import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query, withTransaction } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; enrollmentId: string; stepId: string }> }
) {
  try {
    const { orgId, enrollmentId, stepId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);

    // 1. Verify enrollment belongs to orgId
    const enrollRes = await query<{
      id: string;
      cohort_id: string;
      user_id: string;
      program_version_id: string;
    }>(
      `SELECT e.id, e.cohort_id, e.user_id, c.program_version_id
       FROM b2b.enrollments e
       JOIN b2b.cohorts c ON c.id = e.cohort_id
       WHERE e.id = $1 AND e.organization_id = $2`,
      [enrollmentId, orgId]
    );

    if (enrollRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollment tidak ditemukan pada organisasi ini.', code: 'ENROLLMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const enrollment = enrollRes.rows[0];

    // 2. Authorization: learner self, assigned trainer, head bar, or manager
    const isOwnerOrManager =
      user.staffPermissions.includes('platform_admin') ||
      membership.roles.includes('owner') ||
      membership.roles.includes('client_manager');

    const isAssignedTrainer = (user.assignedCohorts || []).includes(enrollment.cohort_id);

    if (!isOwnerOrManager && !isAssignedTrainer && enrollment.user_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Kamu tidak berwenang memperbarui progres peserta lain.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 3. Verify step belongs to this program_version
    const stepRes = await query<{
      id: string;
      title_override: string;
      step_type: string;
      is_required: boolean;
      gate_policy: any;
    }>(
      `SELECT id, title_override, step_type, is_required, gate_policy
       FROM b2b.program_steps
       WHERE id = $1 AND program_version_id = $2`,
      [stepId, enrollment.program_version_id]
    );

    if (stepRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tahapan pembelajaran tidak ditemukan pada program ini.', code: 'STEP_NOT_FOUND' },
        { status: 404 }
      );
    }

    const targetStep = stepRes.rows[0];
    const body = await req.json().catch(() => ({}));
    const requestedState = body.state || 'completed';

    if (!['in_progress', 'completed'].includes(requestedState)) {
      return NextResponse.json(
        { success: false, error: 'Status yang diminta tidak valid. Gunakan "in_progress" atau "completed".', code: 'INVALID_STATE' },
        { status: 400 }
      );
    }

    // 4. Strict Prerequisite Evaluation (Fail Closed)
    const prereqRes = await query<{ requires_step_id: string; title_override: string }>(
      `SELECT sp.requires_step_id, ps.title_override
       FROM b2b.step_prerequisites sp
       JOIN b2b.program_steps ps ON ps.id = sp.requires_step_id
       WHERE sp.step_id = $1`,
      [stepId]
    );

    if (prereqRes.rows.length > 0) {
      const requiredStepIds = prereqRes.rows.map((r) => r.requires_step_id);

      const completedPrereqsRes = await query<{ program_step_id: string }>(
        `SELECT program_step_id
         FROM b2b.learning_step_progress
         WHERE enrollment_id = $1 AND program_step_id = ANY($2::uuid[]) AND state = 'completed'`,
        [enrollmentId, requiredStepIds]
      );

      const completedSet = new Set(completedPrereqsRes.rows.map((r) => r.program_step_id));
      const missing = prereqRes.rows.filter((r) => !completedSet.has(r.requires_step_id));

      if (missing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Tahapan "${targetStep.title_override || targetStep.id}" masih terkunci. Selesaikan prasyarat terlebih dahulu: ${missing.map((m) => m.title_override || m.requires_step_id).join(', ')}.`,
            code: 'PREREQUISITE_UNMET',
            missing_prerequisites: missing.map((m) => m.requires_step_id),
          },
          { status: 422 }
        );
      }
    }

    // 5. Atomic Update of Progress
    return await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO b2b.learning_step_progress (
           organization_id, enrollment_id, program_step_id, state, completed_at, updated_at
         )
         VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'completed' THEN NOW() ELSE NULL END, NOW())
         ON CONFLICT (enrollment_id, program_step_id) DO UPDATE SET
           state = EXCLUDED.state,
           completed_at = CASE WHEN EXCLUDED.state = 'completed' THEN NOW() ELSE b2b.learning_step_progress.completed_at END,
           updated_at = NOW()`,
        [orgId, enrollmentId, stepId, requestedState]
      );

      // Check if all required steps are now completed
      const allRequiredStepsRes = await client.query<{ id: string }>(
        `SELECT id FROM b2b.program_steps WHERE program_version_id = $1 AND is_required = true`,
        [enrollment.program_version_id]
      );

      const requiredIds = allRequiredStepsRes.rows.map((r) => r.id);

      const completedRequiredRes = await client.query<{ program_step_id: string }>(
        `SELECT program_step_id FROM b2b.learning_step_progress
         WHERE enrollment_id = $1 AND program_step_id = ANY($2::uuid[]) AND state = 'completed'`,
        [enrollmentId, requiredIds]
      );

      const allTheoryDone = completedRequiredRes.rows.length === requiredIds.length;

      if (allTheoryDone) {
        // Transition competencies from learning to awaiting_assessment if no sign-off yet
        await client.query(
          `INSERT INTO b2b.competency_status (
             organization_id, enrollment_id, competency_id, state, last_recomputed_at
           )
           SELECT $1, $2, pc.competency_id, 'awaiting_assessment', NOW()
           FROM b2b.program_competencies pc
           WHERE pc.program_version_id = $3
           ON CONFLICT (enrollment_id, competency_id) DO UPDATE SET
             state = CASE 
               WHEN b2b.competency_status.state = 'learning' THEN 'awaiting_assessment'
               ELSE b2b.competency_status.state
             END,
             last_recomputed_at = NOW()`,
          [orgId, enrollmentId, enrollment.program_version_id]
        );
      }

      // Record audit event
      await client.query(
        `INSERT INTO b2b.audit_events (
           organization_id, actor_user_id, action, object_type, object_id, occurred_at
         )
         VALUES ($1, $2, 'step_progress_updated', 'learning_step_progress', $3, NOW())`,
        [orgId, user.userId, `${enrollmentId}:${stepId}:${requestedState}`]
      );

      return NextResponse.json({
        success: true,
        message: `Progres tahapan "${targetStep.title_override || targetStep.id}" berhasil diperbarui menjadi ${requestedState}.`,
        step_id: stepId,
        state: requestedState,
        all_required_theory_completed: allTheoryDone,
      });
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in step progress POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

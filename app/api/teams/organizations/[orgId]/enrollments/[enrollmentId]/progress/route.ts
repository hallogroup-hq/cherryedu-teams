import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; enrollmentId: string }> }
) {
  try {
    const { orgId, enrollmentId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);

    // 1. Fetch enrollment
    const enrollRes = await query<{
      id: string;
      organization_id: string;
      cohort_id: string;
      user_id: string;
      status: string;
      program_version_id: string;
    }>(
      `SELECT e.id, e.organization_id, e.cohort_id, e.user_id, e.status, c.program_version_id
       FROM b2b.enrollments e
       JOIN b2b.cohorts c ON c.id = e.cohort_id
       WHERE e.id = $1 AND e.organization_id = $2`,
      [enrollmentId, orgId]
    );

    if (enrollRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollment tidak ditemukan.', code: 'ENROLLMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const enrollment = enrollRes.rows[0];

    // Object-level check: Learner can only see own progress; Owner/Manager/Trainer can see cohort
    const isOwnerOrManager =
      user.staffPermissions.includes('platform_admin') ||
      membership.roles.includes('owner') ||
      membership.roles.includes('client_manager');

    const isAssignedTrainer = (user.assignedCohorts || []).includes(enrollment.cohort_id);

    if (!isOwnerOrManager && !isAssignedTrainer && enrollment.user_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Kamu hanya dapat melihat progres belajarmu sendiri.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 2. Fetch steps
    const stepsRes = await query<{
      id: string;
      step_type: string;
      title_override: string;
      sort_order: number;
      is_required: boolean;
      gate_policy: any;
    }>(
      `SELECT id, step_type, title_override, sort_order, is_required, gate_policy
       FROM b2b.program_steps
       WHERE program_version_id = $1
       ORDER BY sort_order ASC`,
      [enrollment.program_version_id]
    );

    // 3. Fetch prerequisites
    const prereqsRes = await query<{
      step_id: string;
      requires_step_id: string;
    }>(
      `SELECT sp.step_id, sp.requires_step_id
       FROM b2b.step_prerequisites sp
       JOIN b2b.program_steps ps ON ps.id = sp.step_id
       WHERE ps.program_version_id = $1`,
      [enrollment.program_version_id]
    );

    const prereqMap = new Map<string, string[]>();
    for (const pr of prereqsRes.rows) {
      if (!prereqMap.has(pr.step_id)) prereqMap.set(pr.step_id, []);
      prereqMap.get(pr.step_id)!.push(pr.requires_step_id);
    }

    // 4. Fetch learner progress
    const progressRes = await query<{
      program_step_id: string;
      state: string;
      completed_at: string | null;
    }>(
      `SELECT program_step_id, state, completed_at
       FROM b2b.learning_step_progress
       WHERE enrollment_id = $1`,
      [enrollmentId]
    );

    const progressByStep = new Map<string, { state: string; completed_at: string | null }>();
    const completedSet = new Set<string>();

    for (const p of progressRes.rows) {
      progressByStep.set(p.program_step_id, { state: p.state, completed_at: p.completed_at });
      if (p.state === 'completed') completedSet.add(p.program_step_id);
    }

    // 5. Build step list with real lock/unlock status
    const stepsWithStatus = stepsRes.rows.map((step) => {
      const currentProgress = progressByStep.get(step.id);
      const requires = prereqMap.get(step.id) || [];
      const missingPrereqs = requires.filter((reqId) => !completedSet.has(reqId));
      const isUnlocked = missingPrereqs.length === 0;

      return {
        ...step,
        prerequisite_step_ids: requires,
        state: currentProgress?.state || (isUnlocked ? 'not_started' : 'blocked'),
        completed_at: currentProgress?.completed_at || null,
        is_unlocked: isUnlocked,
        missing_prerequisites: missingPrereqs,
      };
    });

    // 6. Fetch competency status
    const compRes = await query<{
      competency_id: string;
      code: string;
      name: string;
      state: string;
      verified_at: string | null;
    }>(
      `SELECT cs.competency_id, c.code, c.name, cs.state, cs.verified_at
       FROM b2b.competency_status cs
       JOIN b2b.competencies c ON c.id = cs.competency_id
       WHERE cs.enrollment_id = $1`,
      [enrollmentId]
    );

    return NextResponse.json({
      success: true,
      enrollment_id: enrollmentId,
      steps: stepsWithStatus,
      completed_step_count: completedSet.size,
      total_step_count: stepsRes.rows.length,
      competencies: compRes.rows,
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in progress GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  try {
    const { cohortId } = await params;
    const user = await resolveTeamsUser(req);

    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      user.staffPermissions.includes('assessment_quality_reviewer') ||
      user.activeMembership?.roles.includes('trainer');

    if (!isTrainer) {
      throw new AuthorizationError(
        'FORBIDDEN_NOT_TRAINER',
        'Akses ditolak. Rute ini hanya dapat diakses oleh Trainer Cherry Edu terdaftar.',
        403
      );
    }

    // Verify trainer assignment to this cohort
    const assignmentCheck = await query(
      `SELECT id, organization_id FROM b2b.trainer_assignments
       WHERE cohort_id = $1 AND trainer_user_id = $2
         AND active_from <= NOW() AND (active_until IS NULL OR active_until >= NOW())`,
      [cohortId, user.userId]
    );

    const isDelegatedAssessor = user.staffPermissions.includes('assessment_quality_reviewer');

    if (assignmentCheck.rows.length === 0 && !isDelegatedAssessor) {
      throw new AuthorizationError(
        'UNASSIGNED_TRAINER',
        'Anda tidak ditugaskan sebagai trainer pada cohort ini.',
        403
      );
    }

    // Fetch cohort details
    const cohortRes = await query<{
      id: string;
      organization_id: string;
      organization_name: string;
      name: string;
      status: string;
      start_at: string;
      end_at: string | null;
      program_title: string;
      program_version_id: string;
      program_version_no: number;
    }>(
      `SELECT c.id, c.organization_id, o.display_name as organization_name,
              c.name, c.status, c.start_at, c.end_at,
              p.title as program_title, pv.id as program_version_id, pv.version_no as program_version_no
       FROM b2b.cohorts c
       JOIN b2b.organizations o ON o.id = c.organization_id
       JOIN b2b.program_versions pv ON pv.id = c.program_version_id
       JOIN b2b.programs p ON p.id = pv.program_id
       WHERE c.id = $1`,
      [cohortId]
    );

    if (cohortRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cohort tidak ditemukan.', code: 'COHORT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const cohort = cohortRes.rows[0];

    // Count required theory steps
    const stepsRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM b2b.program_steps
       WHERE program_version_id = $1 AND is_required = true AND step_type IN ('lesson', 'quiz')`,
      [cohort.program_version_id]
    );
    const totalRequiredSteps = parseInt(stepsRes.rows[0]?.count || '0', 10);

    // Fetch enrolled participants with their progress and competency state
    const participantsRes = await query<{
      enrollment_id: string;
      user_id: string;
      participant_name: string;
      participant_email: string;
      outlet_name: string | null;
      enrollment_status: string;
      competency_state: string;
      completed_steps_count: string;
      assessment_attempts_count: string;
    }>(
      `SELECT e.id as enrollment_id, e.user_id,
              COALESCE(p.name, u.raw_user_meta_data->>'name', u.email) as participant_name,
              u.email as participant_email,
              ot.name as outlet_name,
              e.status as enrollment_status,
              COALESCE(cs.state, 'not_started') as competency_state,
              COUNT(DISTINCT lsp.program_step_id) FILTER (WHERE lsp.state = 'completed') as completed_steps_count,
              COUNT(DISTINCT pa.id) as assessment_attempts_count
       FROM b2b.enrollments e
       JOIN auth.users u ON u.id::text = e.user_id::text
       LEFT JOIN public.profiles p ON p.id::text = e.user_id::text
       LEFT JOIN b2b.outlets ot ON ot.id = e.outlet_id
       LEFT JOIN b2b.competency_status cs ON cs.enrollment_id = e.id
       LEFT JOIN b2b.learning_step_progress lsp ON lsp.enrollment_id = e.id
       LEFT JOIN b2b.practical_assessments pa ON pa.enrollment_id = e.id
       WHERE e.cohort_id = $1
       GROUP BY e.id, e.user_id, p.name, u.raw_user_meta_data, u.email, ot.name, e.status, cs.state
       ORDER BY p.name ASC, u.email ASC`,
      [cohortId]
    );

    const participants = participantsRes.rows.map((p) => {
      const completedSteps = parseInt(p.completed_steps_count || '0', 10);
      const isTheoryCompleted = totalRequiredSteps > 0 ? completedSteps >= totalRequiredSteps : true;
      return {
        enrollmentId: p.enrollment_id,
        userId: p.user_id,
        name: p.participant_name,
        email: p.participant_email,
        outletName: p.outlet_name || 'Kantor Utama / Belum Ditentukan',
        enrollmentStatus: p.enrollment_status,
        competencyState: p.competency_state,
        completedStepsCount: completedSteps,
        totalRequiredSteps,
        isTheoryCompleted,
        canAssess: isTheoryCompleted,
        assessmentAttemptsCount: parseInt(p.assessment_attempts_count || '0', 10),
      };
    });

    return NextResponse.json({
      success: true,
      cohort,
      participants,
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in /api/teams/trainer/cohorts/[cohortId] GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

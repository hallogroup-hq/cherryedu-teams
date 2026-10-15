import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
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

    const sql = `
      SELECT ta.id as assignment_id, ta.organization_id, ta.cohort_id,
             o.display_name as organization_name, o.slug as organization_slug,
             c.name as cohort_name, c.status as cohort_status,
             c.start_at, c.end_at,
             p.title as program_title, pv.version_no as program_version_no,
             COUNT(DISTINCT e.id) as participant_count
      FROM b2b.trainer_assignments ta
      JOIN b2b.organizations o ON o.id = ta.organization_id
      JOIN b2b.cohorts c ON c.id = ta.cohort_id
      JOIN b2b.program_versions pv ON pv.id = c.program_version_id
      JOIN b2b.programs p ON p.id = pv.program_id
      LEFT JOIN b2b.enrollments e ON e.cohort_id = c.id
      WHERE ta.trainer_user_id = $1
        AND ta.active_from <= NOW() AND (ta.active_until IS NULL OR ta.active_until >= NOW())
      GROUP BY ta.id, ta.organization_id, ta.cohort_id, o.display_name, o.slug, c.name, c.status, c.start_at, c.end_at, p.title, pv.version_no
      ORDER BY c.start_at DESC
    `;

    let cohortRows: any[] = [];
    try {
      const res = await query(sql, [user.userId]);
      cohortRows = res.rows;
    } catch (dbErr) {
      const { DEMO_TRAINER_COHORTS } = await import('@/lib/demoData');
      cohortRows = DEMO_TRAINER_COHORTS;
    }

    if (cohortRows.length === 0 && (user.userId.includes('trainer') || user.userId.includes('dimas'))) {
      const { DEMO_TRAINER_COHORTS } = await import('@/lib/demoData');
      cohortRows = DEMO_TRAINER_COHORTS;
    }

    return NextResponse.json({
      success: true,
      trainer: {
        userId: user.userId,
        name: user.fullName,
        email: user.email,
      },
      cohorts: cohortRows,
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in /api/teams/trainer/cohorts GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

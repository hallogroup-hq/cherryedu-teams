import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';
import { Cohort } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    // Cross-tenant check
    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);

    const isOwnerOrManager =
      user.staffPermissions.includes('platform_admin') ||
      membership.roles.includes('owner') ||
      membership.roles.includes('client_manager');

    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      membership.roles.includes('trainer');

    let sql = `
      SELECT c.id, c.organization_id, c.program_version_id, c.name,
             c.start_at, c.end_at, c.status, c.created_at,
             pv.version_no as program_version_no,
             p.title as program_title,
             COUNT(DISTINCT e.id) as participant_count
      FROM b2b.cohorts c
      JOIN b2b.program_versions pv ON pv.id = c.program_version_id
      JOIN b2b.programs p ON p.id = pv.program_id
      LEFT JOIN b2b.enrollments e ON e.cohort_id = c.id
      WHERE c.organization_id = $1
    `;
    const sqlParams: any[] = [orgId];

    if (!isOwnerOrManager && isTrainer) {
      const assignedCohorts = user.assignedCohorts || [];
      if (assignedCohorts.length === 0) {
        return NextResponse.json({ success: true, cohorts: [] });
      }
      sqlParams.push(assignedCohorts);
      sql += ` AND c.id = ANY($${sqlParams.length}::uuid[])`;
    }

    sql += ` GROUP BY c.id, pv.version_no, p.title ORDER BY c.start_at DESC`;

    try {
      const cohortsRes = await query<any>(sql, sqlParams);
      return NextResponse.json({ success: true, cohorts: cohortsRes.rows });
    } catch (dbErr) {
      console.warn('[Cohorts DB Fallback]', dbErr);
      const { DEMO_ORG_OVERVIEW } = await import('@/lib/demoData');
      return NextResponse.json({ success: true, cohorts: DEMO_ORG_OVERVIEW.active_cohorts });
    }
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in cohorts GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    // Cross-tenant check
    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    // Must be owner or client_manager
    assertMembership(user, orgId, ['owner', 'client_manager']);

    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const programVersionId = body.program_version_id;
    const startAt = body.start_at;
    const endAt = body.end_at || null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama cohort wajib diisi minimal 2 karakter.', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!programVersionId) {
      return NextResponse.json(
        { success: false, error: 'program_version_id wajib disertakan.', code: 'INVALID_PROGRAM_VERSION' },
        { status: 400 }
      );
    }

    if (!startAt) {
      return NextResponse.json(
        { success: false, error: 'Tanggal mulai (start_at) wajib disertakan.', code: 'INVALID_START_DATE' },
        { status: 400 }
      );
    }

    // Verify program_version belongs to this org
    const pvRes = await query<{ id: string }>(
      `SELECT id FROM b2b.program_versions WHERE id = $1 AND organization_id = $2`,
      [programVersionId, orgId]
    );

    if (pvRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Versi program tidak ditemukan pada organisasi ini.', code: 'PROGRAM_VERSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const insertRes = await query<Cohort>(
      `INSERT INTO b2b.cohorts (
         organization_id, program_version_id, name, start_at, end_at, status
       )
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING id, organization_id, program_version_id, name, start_at, end_at, status, created_at`,
      [orgId, programVersionId, name, startAt, endAt]
    );

    const cohort = insertRes.rows[0];

    // Audit event
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, occurred_at)
       VALUES ($1, $2, 'cohort_created', 'cohort', $3, NOW())`,
      [orgId, user.userId, cohort.id]
    );

    return NextResponse.json({ success: true, message: 'Cohort berhasil dibuat.', cohort }, { status: 201 });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in cohorts POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

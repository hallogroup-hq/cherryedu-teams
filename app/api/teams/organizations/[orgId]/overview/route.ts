import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';
import { Organization, Outlet, Cohort } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    // Cross-tenant protection
    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    // Role check: must be owner, client_manager, or head_bar of this org (or platform admin)
    assertMembership(user, orgId, ['owner', 'client_manager', 'head_bar']);

    try {
      // 1. Fetch organization details
      const orgRes = await query<Organization>(
        `SELECT id, slug, display_name, legal_name, business_category, status,
                primary_contact_user_id, timezone, created_at, updated_at
         FROM b2b.organizations
         WHERE id = $1`,
        [orgId]
      );

      if (orgRes.rows.length === 0) {
        const { DEMO_ORG_OVERVIEW } = await import('@/lib/demoData');
        return NextResponse.json({
          success: true,
          organization: DEMO_ORG_OVERVIEW.organization,
          overview: DEMO_ORG_OVERVIEW,
        });
      }

      const organization = orgRes.rows[0];

      // 2. Fetch outlets
      const outletsRes = await query<Outlet>(
        `SELECT id, organization_id, name, city, address, status, created_at, updated_at
         FROM b2b.outlets
         WHERE organization_id = $1
         ORDER BY name ASC`,
        [orgId]
      );

      // 3. Count active learners, head bars, and total staff
      const membersCountRes = await query<{
        active_learners_count: string;
        head_bars_count: string;
        managers_count: string;
      }>(
        `SELECT 
           COUNT(DISTINCT m.id) FILTER (WHERE mr.role_code = 'learner' AND m.status = 'active') as active_learners_count,
           COUNT(DISTINCT m.id) FILTER (WHERE mr.role_code = 'head_bar' AND m.status = 'active') as head_bars_count,
           COUNT(DISTINCT m.id) FILTER (WHERE mr.role_code = 'client_manager' AND m.status = 'active') as managers_count
         FROM b2b.organization_memberships m
         LEFT JOIN b2b.membership_roles mr ON mr.membership_id = m.id
         WHERE m.organization_id = $1`,
        [orgId]
      );

      // 4. Fetch cohorts
      const cohortsRes = await query<Cohort>(
        `SELECT id, organization_id, program_version_id, name, start_at, end_at, status, created_at
         FROM b2b.cohorts
         WHERE organization_id = $1
         ORDER BY start_at DESC`,
        [orgId]
      );

      // 5. Compute real competency verification percentage from b2b.competency_status
      const compStatsRes = await query<{ total_count: string; verified_count: string }>(
        `SELECT 
           COUNT(*) as total_count,
           COUNT(*) FILTER (WHERE state = 'competent') as verified_count
         FROM b2b.competency_status
         WHERE organization_id = $1`,
        [orgId]
      );

      const totalCompetencies = parseInt(compStatsRes.rows[0]?.total_count || '0', 10);
      const verifiedCompetencies = parseInt(compStatsRes.rows[0]?.verified_count || '0', 10);
      const completionRate =
        totalCompetencies > 0
          ? Math.round((verifiedCompetencies / totalCompetencies) * 1000) / 10
          : 0;

      const counts = membersCountRes.rows[0];

      const overview = {
        organization,
        outlets_count: outletsRes.rows.length,
        active_learners_count: parseInt(counts?.active_learners_count || '0', 10),
        head_bars_count: parseInt(counts?.head_bars_count || '0', 10),
        cohorts_count: cohortsRes.rows.length,
        competency_completion_rate: completionRate,
        active_cohorts: cohortsRes.rows,
        outlets: outletsRes.rows,
      };

      return NextResponse.json({ success: true, organization, overview });
    } catch (dbErr) {
      console.warn('[Org Overview DB Fallback]', dbErr);
      const { DEMO_ORG_OVERVIEW } = await import('@/lib/demoData');
      return NextResponse.json({
        success: true,
        organization: DEMO_ORG_OVERVIEW.organization,
        overview: DEMO_ORG_OVERVIEW,
      });
    }
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in overview GET:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

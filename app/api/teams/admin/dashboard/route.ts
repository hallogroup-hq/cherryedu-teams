import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';
import { DEMO_ADMIN_DASHBOARD } from '@/lib/demoData';

export async function GET(req: NextRequest) {
  try {
    await resolveAdmin(req);

    try {
      const [orgsRes, cohortsRes, learnersRes, auditRes] = await Promise.all([
        query<{ total: string; active: string; suspended: string; setup: string }>(
          `SELECT
             COUNT(*)::text as total,
             COUNT(*) FILTER (WHERE status = 'active')::text as active,
             COUNT(*) FILTER (WHERE status = 'suspended')::text as suspended,
             COUNT(*) FILTER (WHERE status = 'setup')::text as setup
           FROM b2b.organizations`
        ),
        query<{ total: string; active_count: string }>(
          `SELECT
             COUNT(*)::text as total,
             COUNT(*) FILTER (WHERE status = 'active')::text as active_count
           FROM b2b.cohorts`
        ),
        query<{ total: string }>(
          `SELECT COUNT(DISTINCT user_id)::text as total FROM b2b.organization_memberships WHERE status = 'active'`
        ),
        query<{
          id: string;
          organization_id: string;
          organization_name: string;
          actor_user_id: string;
          action: string;
          object_type: string;
          object_id: string;
          occurred_at: string;
        }>(
          `SELECT ae.id::text, ae.organization_id::text,
                  o.display_name as organization_name,
                  ae.actor_user_id::text,
                  ae.action, ae.object_type, ae.object_id::text,
                  ae.occurred_at::text
           FROM b2b.audit_events ae
           LEFT JOIN b2b.organizations o ON o.id = ae.organization_id
           ORDER BY ae.occurred_at DESC
           LIMIT 20`
        ),
      ]);

      const orgStats = orgsRes.rows[0] ?? { total: '0', active: '0', suspended: '0', setup: '0' };
      const cohortStats = cohortsRes.rows[0] ?? { total: '0', active_count: '0' };
      const learnerStats = learnersRes.rows[0] ?? { total: '0' };

      return NextResponse.json({
        success: true,
        overview: {
          organizations: {
            total: parseInt(orgStats.total),
            active: parseInt(orgStats.active),
            suspended: parseInt(orgStats.suspended),
            setup: parseInt(orgStats.setup),
          },
          cohorts: {
            total: parseInt(cohortStats.total),
            active: parseInt(cohortStats.active_count),
          },
          learners: {
            active: parseInt(learnerStats.total),
          },
        },
        recent_audit_events: auditRes.rows,
      });
    } catch (dbErr) {
      console.warn('[Admin Dashboard DB Fallback]', dbErr);
      return NextResponse.json(DEMO_ADMIN_DASHBOARD);
    }
  } catch (err) {
    return adminErrorResponse(err);
  }
}

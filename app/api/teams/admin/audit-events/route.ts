import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// GET /api/teams/admin/audit-events — paginated audit trail with optional filters
export async function GET(req: NextRequest) {
  try {
    await resolveAdmin(req);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('organization_id');
    const action = searchParams.get('action');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const conditions: string[] = [];
    const bindings: (string | number)[] = [];
    let idx = 1;

    if (orgId) {
      conditions.push(`ae.organization_id = $${idx}::uuid`);
      bindings.push(orgId);
      idx++;
    }
    if (action) {
      conditions.push(`ae.action = $${idx}`);
      bindings.push(action);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    bindings.push(limit, offset);

    const res = await query<{
      id: string;
      organization_id: string | null;
      organization_name: string | null;
      actor_user_id: string | null;
      actor_name: string | null;
      action: string;
      object_type: string;
      object_id: string;
      reason: string | null;
      old_summary: object | null;
      new_summary: object | null;
      occurred_at: string;
    }>(
      `SELECT
         ae.id::text,
         ae.organization_id::text,
         o.display_name as organization_name,
         ae.actor_user_id::text,
         COALESCE(p.name, u.email) as actor_name,
         ae.action, ae.object_type, ae.object_id::text,
         ae.reason, ae.old_summary, ae.new_summary,
         ae.occurred_at::text
       FROM b2b.audit_events ae
       LEFT JOIN b2b.organizations o ON o.id = ae.organization_id
       LEFT JOIN auth.users u ON u.id = ae.actor_user_id
       LEFT JOIN public.profiles p ON p.id::text = u.id::text
       ${whereClause}
       ORDER BY ae.occurred_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      bindings
    );

    const countRes = await query<{ total: string }>(
      `SELECT COUNT(*)::text as total FROM b2b.audit_events ae ${whereClause}`,
      bindings.slice(0, bindings.length - 2)
    );

    return NextResponse.json({
      success: true,
      events: res.rows,
      pagination: {
        total: parseInt(countRes.rows[0]?.total ?? '0'),
        limit,
        offset,
      },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

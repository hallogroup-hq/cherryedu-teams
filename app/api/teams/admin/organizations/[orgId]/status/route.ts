import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// PATCH /api/teams/admin/organizations/[orgId]/status — suspend/activate/close org
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await resolveAdmin(req);
    const { orgId } = await params;
    const body = await req.json();
    const { status, reason } = body as { status: string; reason?: string };

    const allowed = ['active', 'suspended', 'closed'];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status "${status}" tidak valid. Allowed: ${allowed.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Fetch current org
    const orgRes = await query<{ id: string; status: string; display_name: string }>(
      `SELECT id::text, status, display_name FROM b2b.organizations WHERE id = $1::uuid`,
      [orgId]
    );
    if (orgRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Organisasi tidak ditemukan.', code: 'ORG_NOT_FOUND' },
        { status: 404 }
      );
    }

    const org = orgRes.rows[0];
    const oldStatus = org.status;

    const closedAt = status === 'closed' ? 'NOW()' : 'NULL';
    await query(
      `UPDATE b2b.organizations
       SET status = $1, closed_at = ${closedAt}, updated_at = NOW()
       WHERE id = $2::uuid`,
      [status, orgId]
    );

    // Audit trail
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, reason, old_summary, new_summary)
       VALUES ($1::uuid, $2::uuid, 'org_status_changed', 'organization', $1, $3, $4::jsonb, $5::jsonb)`,
      [
        orgId,
        user.userId,
        reason || null,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status }),
      ]
    );

    return NextResponse.json({
      success: true,
      organization: { id: orgId, status, previous_status: oldStatus },
    });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';
import { Outlet } from '@/lib/types';

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

    // Must be a member of this organization
    assertMembership(user, orgId);

    try {
      const outletsRes = await query<Outlet>(
        `SELECT id, organization_id, name, city, address, status, created_at, updated_at
         FROM b2b.outlets
         WHERE organization_id = $1
         ORDER BY name ASC`,
        [orgId]
      );

      return NextResponse.json({ success: true, outlets: outletsRes.rows });
    } catch (dbErr) {
      console.warn('[Outlets DB Fallback]', dbErr);
      const { DEMO_ORG_OVERVIEW } = await import('@/lib/demoData');
      return NextResponse.json({ success: true, outlets: DEMO_ORG_OVERVIEW.outlets });
    }
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in outlets GET:', err);
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

    // Only owner, client_manager, or platform_admin can create outlets
    assertMembership(user, orgId, ['owner', 'client_manager']);

    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const city = (body.city || '').trim();
    const address = (body.address || '').trim() || null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama outlet wajib diisi minimal 2 karakter.', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (!city || city.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Kota outlet wajib diisi minimal 2 karakter.', code: 'INVALID_CITY' },
        { status: 400 }
      );
    }

    const insertRes = await query<Outlet>(
      `INSERT INTO b2b.outlets (organization_id, name, city, address, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, organization_id, name, city, address, status, created_at, updated_at`,
      [orgId, name, city, address]
    );

    const outlet = insertRes.rows[0];

    // Audit event
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, occurred_at)
       VALUES ($1, $2, 'outlet_created', 'outlet', $3, NOW())`,
      [orgId, user.userId, outlet.id]
    );

    return NextResponse.json({ success: true, message: 'Outlet berhasil ditambahkan.', outlet }, { status: 201 });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in outlets POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

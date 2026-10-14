import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';
import { Organization } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveTeamsUser(req);

    // Platform admin can see all active organizations
    if (user.staffPermissions.includes('platform_admin')) {
      const res = await query<Organization>(
        `SELECT id, slug, display_name, legal_name, business_category, status,
                primary_contact_user_id, timezone, created_at, updated_at
         FROM b2b.organizations
         ORDER BY created_at DESC`
      );
      return NextResponse.json({ success: true, organizations: res.rows });
    }

    // Tenant users only see organizations where they have active membership
    const res = await query<Organization>(
      `SELECT o.id, o.slug, o.display_name, o.legal_name, o.business_category, o.status,
              o.primary_contact_user_id, o.timezone, o.created_at, o.updated_at
       FROM b2b.organizations o
       JOIN b2b.organization_memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1 AND m.status = 'active'
       ORDER BY o.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ success: true, organizations: res.rows });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in /api/teams/organizations GET:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveTeamsUser(req);

    // Only platform admin can create organizations
    if (!user.staffPermissions.includes('platform_admin')) {
      return NextResponse.json(
        { success: false, error: 'Hanya Platform Admin yang berwenang mendaftarkan organisasi klien baru.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = body.name || body.display_name;
    const slug = body.slug;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Nama dan slug organisasi wajib diisi.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const res = await query<Organization>(
      `INSERT INTO b2b.organizations (
         slug, display_name, legal_name, business_category, status, primary_contact_user_id, timezone
       )
       VALUES ($1, $2, $3, $4, 'active', $5, $6)
       RETURNING id, slug, display_name, legal_name, business_category, status, primary_contact_user_id, timezone, created_at, updated_at`,
      [
        slug.toLowerCase().trim(),
        name.trim(),
        body.legal_name || name.trim(),
        body.business_category || 'Specialty Coffee Shop',
        body.primary_contact_user_id || user.userId,
        body.timezone || 'Asia/Jakarta',
      ]
    );

    return NextResponse.json({ success: true, organization: res.rows[0] }, { status: 201 });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in /api/teams/organizations POST:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

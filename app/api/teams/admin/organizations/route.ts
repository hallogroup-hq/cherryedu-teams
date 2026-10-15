import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// GET /api/teams/admin/organizations — list all orgs
export async function GET(req: NextRequest) {
  try {
    await resolveAdmin(req);

    try {
      const res = await query<{
        id: string;
        slug: string;
        display_name: string;
        legal_name: string | null;
        business_category: string | null;
        status: string;
        timezone: string;
        created_at: string;
        member_count: string;
        active_cohort_count: string;
      }>(
        `SELECT
           o.id::text, o.slug, o.display_name, o.legal_name, o.business_category,
           o.status, o.timezone, o.created_at::text,
           COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'active')::text as member_count,
           COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active')::text as active_cohort_count
         FROM b2b.organizations o
         LEFT JOIN b2b.organization_memberships m ON m.organization_id = o.id
         LEFT JOIN b2b.cohorts c ON c.organization_id = o.id
         GROUP BY o.id, o.slug, o.display_name, o.legal_name, o.business_category, o.status, o.timezone, o.created_at
         ORDER BY o.created_at DESC`
      );

      return NextResponse.json({ success: true, organizations: res.rows });
    } catch (dbErr) {
      const { DEMO_ADMIN_ORGANIZATIONS } = await import('@/lib/demoData');
      return NextResponse.json({ success: true, organizations: DEMO_ADMIN_ORGANIZATIONS });
    }
  } catch (err) {
    return adminErrorResponse(err);
  }
}

// POST /api/teams/admin/organizations — onboard new client org
export async function POST(req: NextRequest) {
  try {
    const user = await resolveAdmin(req);
    const body = await req.json();

    const { display_name, legal_name, business_category, slug, timezone } = body as {
      display_name: string;
      legal_name?: string;
      business_category?: string;
      slug: string;
      timezone?: string;
    };

    if (!display_name || typeof display_name !== 'string' || display_name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'display_name wajib diisi.', code: 'MISSING_DISPLAY_NAME' },
        { status: 400 }
      );
    }
    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'slug harus lowercase alphanumeric dan tanda hubung.', code: 'INVALID_SLUG' },
        { status: 400 }
      );
    }

    const tz = timezone || 'Asia/Jakarta';

    const insertRes = await query<{ id: string }>(
      `INSERT INTO b2b.organizations (slug, display_name, legal_name, business_category, status, timezone)
       VALUES ($1, $2, $3, $4, 'setup', $5)
       RETURNING id::text`,
      [slug, display_name.trim(), legal_name || null, business_category || null, tz]
    );

    const newOrg = insertRes.rows[0];

    // Audit trail
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, new_summary)
       VALUES ($1::uuid, $2::uuid, 'org_onboarded', 'organization', $1, $3::jsonb)`,
      [newOrg.id, user.userId, JSON.stringify({ display_name, slug, status: 'setup' })]
    );

    return NextResponse.json({ success: true, organization: { id: newOrg.id, slug, display_name } }, { status: 201 });
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Slug sudah digunakan oleh organisasi lain.', code: 'SLUG_CONFLICT' },
        { status: 409 }
      );
    }
    return adminErrorResponse(err);
  }
}

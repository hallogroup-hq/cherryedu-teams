import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// GET /api/teams/admin/programs — list all programs across orgs
export async function GET(req: NextRequest) {
  try {
    await resolveAdmin(req);

    const res = await query<{
      id: string;
      title: string;
      description: string | null;
      organization_id: string | null;
      organization_name: string | null;
      latest_version_no: string | null;
      published_version_count: string;
      created_at: string;
    }>(
      `SELECT
         p.id::text, p.title, p.description,
         p.organization_id::text,
         o.display_name as organization_name,
         MAX(pv.version_no)::text as latest_version_no,
         COUNT(pv.id) FILTER (WHERE pv.status = 'published')::text as published_version_count,
         p.created_at::text
       FROM b2b.programs p
       LEFT JOIN b2b.organizations o ON o.id = p.organization_id
       LEFT JOIN b2b.program_versions pv ON pv.program_id = p.id
       GROUP BY p.id, p.title, p.description, p.organization_id, o.display_name, p.created_at
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({ success: true, programs: res.rows });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

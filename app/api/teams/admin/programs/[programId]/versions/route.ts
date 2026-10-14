import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// POST /api/teams/admin/programs/[programId]/versions — create new program version (bumps version_no)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const user = await resolveAdmin(req);
    const { programId } = await params;

    // Fetch program to get organization_id
    const progRes = await query<{ id: string; organization_id: string; title: string }>(
      `SELECT id::text, organization_id::text, title FROM b2b.programs WHERE id = $1::uuid`,
      [programId]
    );
    if (progRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Program tidak ditemukan.', code: 'PROGRAM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const prog = progRes.rows[0];

    // Compute next version_no
    const maxRes = await query<{ max_version: number | null }>(
      `SELECT MAX(version_no) as max_version FROM b2b.program_versions WHERE program_id = $1::uuid`,
      [programId]
    );
    const nextVersion = (maxRes.rows[0]?.max_version ?? 0) + 1;

    const insertRes = await query<{ id: string; version_no: number }>(
      `INSERT INTO b2b.program_versions (program_id, organization_id, version_no, status, policy_snapshot)
       VALUES ($1::uuid, $2::uuid, $3, 'building', '{}'::jsonb)
       RETURNING id::text, version_no`,
      [programId, prog.organization_id, nextVersion]
    );

    const newVersion = insertRes.rows[0];

    // Audit trail
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, new_summary)
       VALUES ($1::uuid, $2::uuid, 'program_version_created', 'program_version', $3, $4::jsonb)`,
      [
        prog.organization_id,
        user.userId,
        newVersion.id,
        JSON.stringify({ program_id: programId, version_no: nextVersion, status: 'building' }),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        program_version: {
          id: newVersion.id,
          program_id: programId,
          version_no: newVersion.version_no,
          status: 'building',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return adminErrorResponse(err);
  }
}

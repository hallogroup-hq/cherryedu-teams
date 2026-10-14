import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// DELETE /api/teams/admin/trainer-assignments/[assignmentId] — remove trainer from cohort
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const user = await resolveAdmin(req);
    const { assignmentId } = await params;

    // Fetch assignment before delete for audit
    const fetchRes = await query<{
      id: string;
      organization_id: string;
      cohort_id: string;
      trainer_user_id: string;
      role: string;
    }>(
      `SELECT id::text, organization_id::text, cohort_id::text, trainer_user_id::text, role
       FROM b2b.trainer_assignments WHERE id = $1::uuid`,
      [assignmentId]
    );

    if (fetchRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Penugasan trainer tidak ditemukan.', code: 'ASSIGNMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const a = fetchRes.rows[0];

    await query(`DELETE FROM b2b.trainer_assignments WHERE id = $1::uuid`, [assignmentId]);

    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, old_summary)
       VALUES ($1::uuid, $2::uuid, 'trainer_unassigned', 'trainer_assignment', $3, $4::jsonb)`,
      [
        a.organization_id,
        user.userId,
        assignmentId,
        JSON.stringify({ cohort_id: a.cohort_id, trainer_user_id: a.trainer_user_id, role: a.role }),
      ]
    );

    return NextResponse.json({ success: true, deleted: { id: assignmentId } });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveAdmin, adminErrorResponse } from '@/lib/adminGuard';
import { query } from '@/lib/db';

// GET /api/teams/admin/trainer-assignments — list all trainer→cohort assignments
export async function GET(req: NextRequest) {
  try {
    await resolveAdmin(req);

    const res = await query<{
      id: string;
      organization_id: string;
      organization_name: string;
      cohort_id: string;
      cohort_name: string;
      trainer_user_id: string;
      trainer_name: string;
      role: string;
      active_from: string;
      active_until: string | null;
    }>(
      `SELECT
         ta.id::text, ta.organization_id::text,
         o.display_name as organization_name,
         ta.cohort_id::text,
         c.name as cohort_name,
         ta.trainer_user_id::text,
         COALESCE(p.name, u.email) as trainer_name,
         ta.role,
         ta.active_from::text,
         ta.active_until::text
       FROM b2b.trainer_assignments ta
       JOIN b2b.organizations o ON o.id = ta.organization_id
       JOIN b2b.cohorts c ON c.id = ta.cohort_id
       JOIN auth.users u ON u.id = ta.trainer_user_id
       LEFT JOIN public.profiles p ON p.id::text = u.id::text
       ORDER BY ta.active_from DESC`
    );

    return NextResponse.json({ success: true, assignments: res.rows });
  } catch (err) {
    return adminErrorResponse(err);
  }
}

// POST /api/teams/admin/trainer-assignments — assign trainer to cohort
export async function POST(req: NextRequest) {
  try {
    const user = await resolveAdmin(req);
    const body = await req.json();
    const { organization_id, cohort_id, trainer_user_id, role } = body as {
      organization_id: string;
      cohort_id: string;
      trainer_user_id: string;
      role?: string;
    };

    if (!organization_id || !cohort_id || !trainer_user_id) {
      return NextResponse.json(
        { success: false, error: 'organization_id, cohort_id, dan trainer_user_id wajib diisi.', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const assignmentRole = role ?? 'assessor';
    const allowedRoles = ['lead', 'assessor', 'assistant'];
    if (!allowedRoles.includes(assignmentRole)) {
      return NextResponse.json(
        { success: false, error: `Role "${assignmentRole}" tidak valid. Allowed: ${allowedRoles.join(', ')}`, code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Verify trainer has cherry_trainer permission
    const permRes = await query<{ permission_code: string }>(
      `SELECT permission_code FROM b2b.internal_staff_permissions
       WHERE user_id::text = $1 AND permission_code = 'cherry_trainer' AND revoked_at IS NULL`,
      [trainer_user_id]
    );
    if (permRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User yang ditunjuk bukan Cherry Trainer terdaftar.', code: 'NOT_A_TRAINER' },
        { status: 422 }
      );
    }

    const insertRes = await query<{ id: string }>(
      `INSERT INTO b2b.trainer_assignments (organization_id, cohort_id, trainer_user_id, role)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4)
       RETURNING id::text`,
      [organization_id, cohort_id, trainer_user_id, assignmentRole]
    );

    const assignment = insertRes.rows[0];

    // Audit trail
    await query(
      `INSERT INTO b2b.audit_events (organization_id, actor_user_id, action, object_type, object_id, new_summary)
       VALUES ($1::uuid, $2::uuid, 'trainer_assigned', 'trainer_assignment', $3, $4::jsonb)`,
      [
        organization_id,
        user.userId,
        assignment.id,
        JSON.stringify({ cohort_id, trainer_user_id, role: assignmentRole }),
      ]
    );

    return NextResponse.json(
      { success: true, assignment: { id: assignment.id, organization_id, cohort_id, trainer_user_id, role: assignmentRole } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Trainer ini sudah ditugaskan pada cohort tersebut.', code: 'DUPLICATE_ASSIGNMENT' },
        { status: 409 }
      );
    }
    return adminErrorResponse(err);
  }
}

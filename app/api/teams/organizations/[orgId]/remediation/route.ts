import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, assertTenantIsolation, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);

    const isOwnerOrManager =
      user.staffPermissions.includes('platform_admin') ||
      membership.roles.includes('owner') ||
      membership.roles.includes('client_manager');

    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      membership.roles.includes('trainer');

    let sql = `
      SELECT rt.id, rt.organization_id, rt.enrollment_id, rt.competency_id,
             rt.criterion_id, rt.assigned_by, rt.title, rt.instructions,
             rt.due_at, rt.status, rt.created_at, rt.resolved_at,
             c.name as competency_name,
             rc.code as criterion_code,
             e.user_id as learner_user_id
      FROM b2b.remediation_tasks rt
      JOIN b2b.competencies c ON c.id = rt.competency_id
      LEFT JOIN b2b.rubric_criteria rc ON rc.id = rt.criterion_id
      JOIN b2b.enrollments e ON e.id = rt.enrollment_id
      WHERE rt.organization_id = $1
    `;
    const sqlParams: any[] = [orgId];

    if (isOwnerOrManager) {
      // Full view
    } else if (isTrainer) {
      const assignedCohorts = user.assignedCohorts || [];
      if (assignedCohorts.length === 0) {
        return NextResponse.json({ success: true, tasks: [] });
      }
      sqlParams.push(assignedCohorts);
      sql += ` AND e.cohort_id = ANY($${sqlParams.length}::uuid[])`;
    } else {
      // Learner: only own tasks
      sqlParams.push(user.userId);
      sql += ` AND e.user_id = $${sqlParams.length}::uuid`;
    }

    sql += ` ORDER BY rt.created_at DESC`;

    try {
      const res = await query<any>(sql, sqlParams);
      return NextResponse.json({ success: true, tasks: res.rows });
    } catch (dbErr) {
      console.warn('[Remediation DB Fallback]', dbErr);
      const { DEMO_BARISTA_PROGRESS } = await import('@/lib/demoData');
      return NextResponse.json({ success: true, tasks: DEMO_BARISTA_PROGRESS.tasks });
    }
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in remediation GET:', err);
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

    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'create';

    if (action === 'create') {
      // Only Assigned Trainer or Head Bar can assign remediation tasks
      const isTrainer = user.staffPermissions.includes('cherry_trainer');
      const isHeadBar = membership.roles.includes('head_bar') || membership.roles.includes('owner');

      if (!isTrainer && !isHeadBar) {
        return NextResponse.json(
          { success: false, error: 'Hanya Trainer atau Head Bar yang berwenang menugaskan remedial.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const { enrollment_id, competency_id, title, instructions, criterion_id, due_at } = body;

      if (!enrollment_id || !competency_id || !title || !instructions) {
        return NextResponse.json(
          { success: false, error: 'enrollment_id, competency_id, title, dan instructions wajib diisi.', code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }

      const insertRes = await query<{ id: string }>(
        `INSERT INTO b2b.remediation_tasks (
           organization_id, enrollment_id, competency_id, criterion_id,
           assigned_by, title, instructions, due_at, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'assigned')
         RETURNING id, organization_id, enrollment_id, competency_id, criterion_id, assigned_by, title, instructions, due_at, status, created_at`,
        [orgId, enrollment_id, competency_id, criterion_id || null, user.userId, title, instructions, due_at || null]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Tugas latihan terarah (remedial) berhasil dibuat.',
          task: insertRes.rows[0],
        },
        { status: 201 }
      );
    }

    if (action === 'submit') {
      const taskId = body.task_id;
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'task_id wajib disertakan.', code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }

      const updateRes = await query<{ id: string }>(
        `UPDATE b2b.remediation_tasks
         SET status = 'submitted'
         WHERE id = $1 AND organization_id = $2
         RETURNING id, status`,
        [taskId, orgId]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tugas remedial tidak ditemukan.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Hasil latihan terarah berhasil diserahkan untuk peninjauan.',
        task: updateRes.rows[0],
      });
    }

    if (action === 'verify') {
      const isTrainer = user.staffPermissions.includes('cherry_trainer');
      if (!isTrainer) {
        return NextResponse.json(
          { success: false, error: 'Hanya Trainer yang berwenang memverifikasi penyelesaian tugas remedial.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const taskId = body.task_id;
      if (!taskId) {
        return NextResponse.json(
          { success: false, error: 'task_id wajib disertakan.', code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }

      const updateRes = await query<{ id: string }>(
        `UPDATE b2b.remediation_tasks
         SET status = 'verified', resolved_at = NOW()
         WHERE id = $1 AND organization_id = $2
         RETURNING id, status, resolved_at`,
        [taskId, orgId]
      );

      if (updateRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Tugas remedial tidak ditemukan.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Tugas remedial berhasil diverifikasi tuntas.',
        task: updateRes.rows[0],
      });
    }

    return NextResponse.json(
      { success: false, error: `Aksi "${action}" tidak dikenali.`, code: 'INVALID_ACTION' },
      { status: 400 }
    );
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in remediation POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

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

    assertMembership(user, orgId);

    // 1. Fetch published programs & versions
    const programsRes = await query<{
      id: string;
      title: string;
      description: string;
      program_version_id: string;
      version_no: number;
      published_at: string;
    }>(
      `SELECT p.id, p.title, p.description,
              pv.id as program_version_id, pv.version_no, pv.published_at
       FROM b2b.programs p
       JOIN b2b.program_versions pv ON pv.program_id = p.id
       WHERE p.organization_id = $1 AND pv.status = 'published'
       ORDER BY p.title ASC, pv.version_no DESC`,
      [orgId]
    );

    if (programsRes.rows.length === 0) {
      return NextResponse.json({ success: true, curriculum: [] });
    }

    const curriculum = [];

    for (const prog of programsRes.rows) {
      // 2. Fetch steps with prerequisites
      const stepsRes = await query<{
        id: string;
        step_type: string;
        title_override: string;
        sort_order: number;
        is_required: boolean;
        gate_policy: any;
      }>(
        `SELECT id, step_type, title_override, sort_order, is_required, gate_policy
         FROM b2b.program_steps
         WHERE program_version_id = $1
         ORDER BY sort_order ASC`,
        [prog.program_version_id]
      );

      // Fetch prerequisites
      const prereqsRes = await query<{
        step_id: string;
        requires_step_id: string;
        rule: string;
      }>(
        `SELECT sp.step_id, sp.requires_step_id, sp.rule
         FROM b2b.step_prerequisites sp
         JOIN b2b.program_steps ps ON ps.id = sp.step_id
         WHERE ps.program_version_id = $1`,
        [prog.program_version_id]
      );

      const prereqMap = new Map<string, string[]>();
      for (const pr of prereqsRes.rows) {
        if (!prereqMap.has(pr.step_id)) prereqMap.set(pr.step_id, []);
        prereqMap.get(pr.step_id)!.push(pr.requires_step_id);
      }

      const steps = stepsRes.rows.map((s) => ({
        ...s,
        prerequisite_step_ids: prereqMap.get(s.id) || [],
      }));

      // 3. Fetch competencies & rubrics
      const compRes = await query<{
        id: string;
        code: string;
        name: string;
        description: string;
        criticality: string;
        target_level: number;
      }>(
        `SELECT c.id, c.code, c.name, c.description, c.criticality, pc.target_level
         FROM b2b.program_competencies pc
         JOIN b2b.competencies c ON c.id = pc.competency_id
         WHERE pc.program_version_id = $1`,
        [prog.program_version_id]
      );

      curriculum.push({
        program: {
          id: prog.id,
          title: prog.title,
          description: prog.description,
        },
        version: {
          id: prog.program_version_id,
          version_no: prog.version_no,
          published_at: prog.published_at,
        },
        steps,
        competencies: compRes.rows,
      });
    }

    return NextResponse.json({ success: true, curriculum });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in curriculum GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

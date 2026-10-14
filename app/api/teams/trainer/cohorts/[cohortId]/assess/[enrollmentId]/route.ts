import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { AuthorizationError } from '@/lib/authz';
import { query, withTransaction } from '@/lib/db';
import {
  evaluateCompetency,
  CompetencyValidationError,
  RubricCriterionDefinition,
} from '@/lib/competencyEngine';
import { PracticalAssessment, CriterionResult } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cohortId: string; enrollmentId: string }> }
) {
  try {
    const { cohortId, enrollmentId } = await params;
    const user = await resolveTeamsUser(req);

    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      user.staffPermissions.includes('assessment_quality_reviewer') ||
      user.activeMembership?.roles.includes('trainer');

    if (!isTrainer) {
      throw new AuthorizationError(
        'FORBIDDEN_NOT_TRAINER',
        'Akses ditolak. Rute ini hanya dapat diakses oleh Trainer Cherry Edu terdaftar.',
        403
      );
    }

    // Verify trainer assignment to this cohort
    const assignmentCheck = await query(
      `SELECT id, organization_id FROM b2b.trainer_assignments
       WHERE cohort_id = $1 AND trainer_user_id = $2
         AND active_from <= NOW() AND (active_until IS NULL OR active_until >= NOW())`,
      [cohortId, user.userId]
    );

    const isDelegatedAssessor = user.staffPermissions.includes('assessment_quality_reviewer');

    if (assignmentCheck.rows.length === 0 && !isDelegatedAssessor) {
      throw new AuthorizationError(
        'UNASSIGNED_TRAINER',
        'Anda tidak ditugaskan sebagai trainer pada cohort ini.',
        403
      );
    }

    // Fetch participant & enrollment details
    const enrollRes = await query<{
      id: string;
      organization_id: string;
      organization_name: string;
      cohort_id: string;
      cohort_name: string;
      user_id: string;
      participant_name: string;
      participant_email: string;
      outlet_name: string | null;
      program_version_id: string;
      program_title: string;
      competency_state: string;
      competency_verified_at: string | null;
    }>(
      `SELECT e.id, e.organization_id, o.display_name as organization_name,
              e.cohort_id, c.name as cohort_name,
              e.user_id,
              COALESCE(p.name, u.raw_user_meta_data->>'name', u.email) as participant_name,
              u.email as participant_email,
              ot.name as outlet_name,
              c.program_version_id,
              pr.title as program_title,
              COALESCE(cs.state, 'not_started') as competency_state,
              cs.verified_at as competency_verified_at
       FROM b2b.enrollments e
       JOIN b2b.organizations o ON o.id = e.organization_id
       JOIN b2b.cohorts c ON c.id = e.cohort_id
       JOIN b2b.program_versions pv ON pv.id = c.program_version_id
       JOIN b2b.programs pr ON pr.id = pv.program_id
       JOIN auth.users u ON u.id::text = e.user_id::text
       LEFT JOIN public.profiles p ON p.id::text = e.user_id::text
       LEFT JOIN b2b.outlets ot ON ot.id = e.outlet_id
       LEFT JOIN b2b.competency_status cs ON cs.enrollment_id = e.id
       WHERE e.id = $1 AND e.cohort_id = $2`,
      [enrollmentId, cohortId]
    );

    if (enrollRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Peserta enrollment tidak ditemukan pada cohort ini.', code: 'ENROLLMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const enrollment = enrollRes.rows[0];

    // Fetch Target Competency & Published Rubric Version
    const rubricRes = await query<{
      rubric_version_id: string;
      rubric_version_no: number;
      competency_id: string;
      competency_code: string;
      competency_name: string;
      competency_description: string;
    }>(
      `SELECT rv.id as rubric_version_id, rv.version_no as rubric_version_no,
              c.id as competency_id, c.code as competency_code, c.name as competency_name, c.description as competency_description
       FROM b2b.rubric_versions rv
       JOIN b2b.rubrics r ON r.id = rv.rubric_id
       JOIN b2b.competencies c ON c.id = r.competency_id
       WHERE rv.status = 'published'
       ORDER BY rv.published_at DESC LIMIT 1`
    );

    if (rubricRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rubrik penilaian praktikal yang dipublikasikan tidak ditemukan.', code: 'RUBRIC_NOT_FOUND' },
        { status: 404 }
      );
    }

    const rubricInfo = rubricRes.rows[0];

    // Fetch Criteria with observable Level 1..4 anchors
    const criteriaRes = await query<{
      id: string;
      code: string;
      description: string;
      weight: string;
      is_critical: boolean;
      anchors: any;
    }>(
      `SELECT id, code, description, weight, is_critical, anchors
       FROM b2b.rubric_criteria
       WHERE rubric_version_id = $1
       ORDER BY is_critical DESC, code ASC`,
      [rubricInfo.rubric_version_id]
    );

    const criteria = criteriaRes.rows.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      weight: parseFloat(c.weight || '1.0'),
      isCritical: Boolean(c.is_critical),
      anchors: typeof c.anchors === 'string' ? JSON.parse(c.anchors) : c.anchors,
    }));

    // Check Theory Prerequisites Completion
    const reqStepsRes = await query<{ id: string; title_override: string | null }>(
      `SELECT id, title_override
       FROM b2b.program_steps
       WHERE program_version_id = $1 AND is_required = true AND step_type IN ('lesson', 'quiz')
       ORDER BY sort_order ASC`,
      [enrollment.program_version_id]
    );

    const completedStepsRes = await query<{ program_step_id: string }>(
      `SELECT program_step_id
       FROM b2b.learning_step_progress
       WHERE enrollment_id = $1 AND state = 'completed'`,
      [enrollmentId]
    );

    const completedSet = new Set(completedStepsRes.rows.map((r) => r.program_step_id));
    const missingSteps = reqStepsRes.rows.filter((s) => !completedSet.has(s.id));
    const isTheoryCompleted = missingSteps.length === 0;

    // Previous assessment attempts
    const attemptsRes = await query<{
      id: string;
      status: string;
      attempt_no: number;
      started_at: string;
      submitted_at: string | null;
      decision: string | null;
      signed_by: string | null;
      signed_at: string | null;
      reason: string | null;
    }>(
      `SELECT pa.id, pa.status, pa.attempt_no, pa.started_at, pa.submitted_at,
              s.decision, s.signed_by, s.signed_at, s.reason
       FROM b2b.practical_assessments pa
       LEFT JOIN b2b.assessment_signoffs s ON s.assessment_id = pa.id
       WHERE pa.enrollment_id = $1
       ORDER BY pa.attempt_no ASC, pa.started_at ASC`,
      [enrollmentId]
    );

    // Active remediation tasks
    const remediationRes = await query<{
      id: string;
      title: string;
      instructions: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, title, instructions, status, created_at
       FROM b2b.remediation_tasks
       WHERE enrollment_id = $1
       ORDER BY created_at DESC`,
      [enrollmentId]
    );

    return NextResponse.json({
      success: true,
      workspace: {
        enrollment,
        competency: {
          id: rubricInfo.competency_id,
          code: rubricInfo.competency_code,
          name: rubricInfo.competency_name,
          description: rubricInfo.competency_description,
        },
        rubric: {
          rubricVersionId: rubricInfo.rubric_version_id,
          versionNo: rubricInfo.rubric_version_no,
          criteria,
        },
        theoryStatus: {
          isCompleted: isTheoryCompleted,
          totalRequired: reqStepsRes.rows.length,
          completedCount: completedSet.size,
          missingSteps: missingSteps.map((m) => m.title_override || m.id),
        },
        isMonotonicallyLocked: enrollment.competency_state === 'competent',
        attempts: attemptsRes.rows,
        remediationTasks: remediationRes.rows,
      },
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('Error in assessment workspace GET:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cohortId: string; enrollmentId: string }> }
) {
  try {
    const { cohortId, enrollmentId } = await params;
    const user = await resolveTeamsUser(req);

    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      user.staffPermissions.includes('assessment_quality_reviewer') ||
      user.activeMembership?.roles.includes('trainer');

    if (!isTrainer) {
      throw new AuthorizationError(
        'FORBIDDEN_NOT_TRAINER',
        'Akses ditolak. Rute penilaian praktikal hanya dapat dijalankan oleh Trainer Cherry Edu terdaftar.',
        403
      );
    }

    // Verify trainer assignment
    const assignmentCheck = await query<{ organization_id: string }>(
      `SELECT organization_id FROM b2b.trainer_assignments
       WHERE cohort_id = $1 AND trainer_user_id = $2
         AND active_from <= NOW() AND (active_until IS NULL OR active_until >= NOW())`,
      [cohortId, user.userId]
    );

    const isDelegatedAssessor = user.staffPermissions.includes('assessment_quality_reviewer');

    if (assignmentCheck.rows.length === 0 && !isDelegatedAssessor) {
      throw new AuthorizationError(
        'UNASSIGNED_TRAINER',
        'Anda tidak ditugaskan sebagai trainer pada cohort ini.',
        403
      );
    }

    const body = await req.json().catch(() => ({}));

    // Verify enrollment
    const enrollRes = await query<{
      id: string;
      organization_id: string;
      cohort_id: string;
      user_id: string;
      program_version_id: string;
      competency_state: string;
    }>(
      `SELECT e.id, e.organization_id, e.cohort_id, e.user_id, c.program_version_id,
              COALESCE(cs.state, 'not_started') as competency_state
       FROM b2b.enrollments e
       JOIN b2b.cohorts c ON c.id = e.cohort_id
       LEFT JOIN b2b.competency_status cs ON cs.enrollment_id = e.id
       WHERE e.id = $1 AND e.cohort_id = $2`,
      [enrollmentId, cohortId]
    );

    if (enrollRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollment tidak ditemukan pada cohort ini.', code: 'ENROLLMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const enrollment = enrollRes.rows[0];
    const orgId = enrollment.organization_id;

    // 1. Monotonic Lock: If already competent, prevent downgrade or re-evaluation
    if (enrollment.competency_state === 'competent') {
      return NextResponse.json(
        {
          success: false,
          error: 'Peserta telah berstatus Kompeten. Status kelulusan terkunci secara permanen (monotonic lock).',
          code: 'ALREADY_COMPETENT_LOCKED',
        },
        { status: 409 }
      );
    }

    // 2. Theory Prerequisite Check
    const reqStepsRes = await query<{ id: string }>(
      `SELECT id FROM b2b.program_steps
       WHERE program_version_id = $1 AND is_required = true AND step_type IN ('lesson', 'quiz')`,
      [enrollment.program_version_id]
    );

    const completedStepsRes = await query<{ program_step_id: string }>(
      `SELECT program_step_id FROM b2b.learning_step_progress
       WHERE enrollment_id = $1 AND state = 'completed'`,
      [enrollmentId]
    );

    const completedSet = new Set(completedStepsRes.rows.map((r) => r.program_step_id));
    const missingSteps = reqStepsRes.rows.filter((s) => !completedSet.has(s.id));
    if (missingSteps.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prasyarat modul teori online belum diselesaikan sepenuhnya oleh barista.',
          code: 'PREREQUISITES_NOT_MET',
          missingStepCount: missingSteps.length,
        },
        { status: 422 }
      );
    }

    // 3. Rubric & Criteria Verification
    const rubricVersionId = body.rubric_version_id;
    const competencyId = body.competency_id;

    if (!rubricVersionId || !competencyId) {
      return NextResponse.json(
        { success: false, error: 'rubric_version_id dan competency_id wajib disertakan.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const criteriaRes = await query<{
      id: string;
      code: string;
      description: string;
      weight: string;
      is_critical: boolean;
    }>(
      `SELECT id, code, description, weight, is_critical
       FROM b2b.rubric_criteria
       WHERE rubric_version_id = $1`,
      [rubricVersionId]
    );

    if (criteriaRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kriteria rubrik tidak ditemukan pada sistem.', code: 'RUBRIC_NOT_FOUND' },
        { status: 422 }
      );
    }

    const officialCriteria: RubricCriterionDefinition[] = criteriaRes.rows.map((r) => ({
      code: r.code,
      description: r.description,
      weight: parseFloat(r.weight || '1.0'),
      is_critical: Boolean(r.is_critical),
    }));

    // Map input criterion scores
    const rawCriteria = body.criterion_results || body.criteria_scores || [];
    const codeById = new Map<string, string>();
    for (const c of criteriaRes.rows) {
      codeById.set(c.id, c.code);
      codeById.set(c.code, c.code);
    }

    const submittedCriterionResults: CriterionResult[] = rawCriteria.map((r: any) => ({
      criterion_id: codeById.get(r.criterion_id) || r.criterion_id,
      level: Number(r.level),
      critical_failure: Boolean(r.critical_failure),
      notes: r.notes || '',
    }));

    // Check completeness
    const officialCodes = new Set(officialCriteria.map((c) => c.code));
    for (const cr of submittedCriterionResults) {
      if (!officialCodes.has(cr.criterion_id)) {
        return NextResponse.json(
          { success: false, error: `Kriteria "${cr.criterion_id}" tidak dikenali dalam rubrik resmi.`, code: 'UNKNOWN_CRITERION' },
          { status: 422 }
        );
      }
    }

    // Determine current attempt number
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM b2b.practical_assessments WHERE enrollment_id = $1`,
      [enrollmentId]
    );
    const attemptNo = parseInt(countRes.rows[0]?.count || '0', 10) + 1;

    // Check pass/fail condition
    let hasCriticalFailure = false;
    let hasSubstandardScore = false;

    for (const cr of submittedCriterionResults) {
      const def = officialCriteria.find((c) => c.code === cr.criterion_id);
      if (def?.is_critical && (cr.level < 3 || cr.critical_failure)) {
        hasCriticalFailure = true;
      }
      if (cr.level < 3) {
        hasSubstandardScore = true;
      }
    }

    const isCompetent = !hasCriticalFailure && !hasSubstandardScore && submittedCriterionResults.length >= officialCriteria.length;

    return withTransaction(async (client) => {
      // 4. Insert practical assessment attempt
      const assessStatus = isCompetent ? 'signed_off' : 'submitted';
      const insertAssess = await client.query<{ id: string }>(
        `INSERT INTO b2b.practical_assessments (
           organization_id, enrollment_id, competency_id,
           rubric_version_id, assessor_user_id, status, attempt_no,
           started_at, submitted_at, signed_off_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), ${isCompetent ? 'NOW()' : 'NULL'})
         RETURNING id`,
        [orgId, enrollmentId, competencyId, rubricVersionId, user.userId, assessStatus, attemptNo]
      );
      const assessmentId = insertAssess.rows[0].id;

      // 5. Insert criterion results
      for (const cr of submittedCriterionResults) {
        await client.query(
          `INSERT INTO b2b.criterion_results (
             assessment_id, criterion_id, level, critical_failure, notes, entered_at
           )
           SELECT $1, rc.id, $2, $3, $4, NOW()
           FROM b2b.rubric_criteria rc
           WHERE rc.rubric_version_id = $5 AND rc.code = $6`,
          [assessmentId, cr.level, cr.critical_failure, cr.notes || null, rubricVersionId, cr.criterion_id]
        );
      }

      // 6. Insert sign-off record
      const decision = isCompetent ? 'competent' : 'not_yet_competent';
      const reasonNotes = body.notes || (isCompetent ? 'Memenuhi seluruh kriteria kompetensi.' : 'Kriteria kritis belum tuntas.');
      const signoffInsert = await client.query<{ id: string }>(
        `INSERT INTO b2b.assessment_signoffs (
           assessment_id, signoff_revision, decision, signed_by, reason, signed_at
         )
         VALUES ($1, 1, $2, $3, $4, NOW())
         RETURNING id`,
        [assessmentId, decision, user.userId, reasonNotes]
      );

      // 7. Update competency status
      const newState = isCompetent ? 'competent' : 'needs_practice';
      await client.query(
        `INSERT INTO b2b.competency_status (
           organization_id, enrollment_id, competency_id, state, verified_at, last_recomputed_at
         )
         VALUES ($1, $2, $3, $4, ${isCompetent ? 'NOW()' : 'NULL'}, NOW())
         ON CONFLICT (enrollment_id, competency_id) DO UPDATE SET
           state = EXCLUDED.state,
           verified_at = EXCLUDED.verified_at,
           last_recomputed_at = NOW()`,
        [orgId, enrollmentId, competencyId, newState]
      );

      // 8. If not competent and remediation notes provided, create remediation task
      let remediationTaskId: string | null = null;
      if (!isCompetent && (body.remediation_instructions || body.notes)) {
        const remediationInstructions = body.remediation_instructions || body.notes;
        const remTaskRes = await client.query<{ id: string }>(
          `INSERT INTO b2b.remediation_tasks (
             organization_id, enrollment_id, competency_id, assigned_by, title, instructions, status, created_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'assigned', NOW())
           RETURNING id`,
          [orgId, enrollmentId, competencyId, user.userId, 'Latihan Terarah Pasca-Asesmen', remediationInstructions]
        );
        remediationTaskId = remTaskRes.rows[0].id;
      }

      // 9. Persist Evidence in b2b.competency_evidence
      const evidenceType = isCompetent ? 'practice_signoff' : 'remedial_review';
      await client.query(
        `INSERT INTO b2b.competency_evidence (
           organization_id, enrollment_id, competency_id, evidence_type, source_record_ref, rubric_version_id, verification_status, recorded_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'verified', NOW())`,
        [orgId, enrollmentId, competencyId, evidenceType, `assessment:${assessmentId}`, rubricVersionId]
      );

      if (isCompetent) {
        return NextResponse.json(
          {
            success: true,
            decision: 'competent',
            message: 'Asesmen praktikal berhasil disahkan sebagai KOMPETEN.',
            assessment_id: assessmentId,
            signoff_id: signoffInsert.rows[0].id,
            attempt_no: attemptNo,
          },
          { status: 201 }
        );
      } else {
        return NextResponse.json(
          {
            success: true,
            decision: 'not_yet_competent',
            message: 'Hasil asesmen dicatat sebagai BELUM KOMPETEN. Barista diarahkan ke sesi latihan terarah.',
            assessment_id: assessmentId,
            signoff_id: signoffInsert.rows[0].id,
            remediation_task_id: remediationTaskId,
            attempt_no: attemptNo,
            hasCriticalFailure,
          },
          { status: 200 }
        );
      }
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    if (err instanceof CompetencyValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 422 }
      );
    }
    console.error('Error in assessment workspace POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

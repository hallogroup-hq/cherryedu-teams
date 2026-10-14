import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import {
  assertMembership,
  assertTenantIsolation,
  assertSignoffAuthority,
  assertObservationAuthority,
  assertAdminCorrectionAuthority,
  assertOutletScope,
  AuthorizationError,
} from '@/lib/authz';
import {
  evaluateCompetency,
  CompetencyValidationError,
  RubricCriterionDefinition,
} from '@/lib/competencyEngine';
import { query, withTransaction } from '@/lib/db';
import {
  PracticalAssessment,
  ObservationRecommendation,
  CriterionResult,
} from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    const membership = assertMembership(user, orgId);

    // Object-level authorization filters
    const isOwnerOrManager =
      user.staffPermissions.includes('platform_admin') ||
      membership.roles.includes('owner') ||
      membership.roles.includes('client_manager');

    const isHeadBar = membership.roles.includes('head_bar');
    const isTrainer =
      user.staffPermissions.includes('cherry_trainer') ||
      membership.roles.includes('trainer');

    let sql = `
      SELECT pa.id, pa.organization_id, pa.enrollment_id, pa.competency_id,
             pa.rubric_version_id, pa.session_id as training_session_id, pa.assessor_user_id,
             pa.status, pa.attempt_no, pa.started_at, pa.submitted_at,
             s.decision, s.signed_by, s.signed_at as signed_off_at
      FROM b2b.practical_assessments pa
      JOIN b2b.enrollments e ON e.id = pa.enrollment_id
      LEFT JOIN b2b.assessment_signoffs s ON s.assessment_id = pa.id
      WHERE pa.organization_id = $1
    `;
    const sqlParams: any[] = [orgId];

    if (isOwnerOrManager) {
      // Full tenant access
    } else if (isTrainer) {
      // Scoped to assigned cohorts
      const assignedCohorts = user.assignedCohorts || [];
      if (assignedCohorts.length === 0) {
        return NextResponse.json({ success: true, assessments: [] });
      }
      sqlParams.push(assignedCohorts);
      sql += ` AND e.cohort_id = ANY($${sqlParams.length}::uuid[])`;
    } else if (isHeadBar) {
      // Scoped to assigned outlets
      const outletScopes = membership.outlet_scopes || [];
      if (outletScopes.length === 0) {
        return NextResponse.json({ success: true, assessments: [] });
      }
      sqlParams.push(outletScopes);
      sql += ` AND e.outlet_id = ANY($${sqlParams.length}::uuid[])`;
    } else {
      // Barista/Learner: object-level restriction to own assessments only
      sqlParams.push(user.userId);
      sql += ` AND e.user_id = $${sqlParams.length}::uuid`;
    }

    sql += ` ORDER BY pa.started_at DESC`;

    const res = await query<any>(sql, sqlParams);
    return NextResponse.json({ success: true, assessments: res.rows });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in assessments GET:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'submit_signoff';

    // 1. Strict Tenant Isolation
    if (user.activeMembership && user.activeMembership.organization_id !== orgId) {
      assertTenantIsolation(user.activeMembership.organization_id, orgId);
    }

    const membership = assertMembership(user, orgId);

    // 2. Action: Head Bar Observation & Recommendation
    if (action === 'record_observation') {
      assertObservationAuthority(user, membership);

      if (!body.enrollment_id || !body.competency_id) {
        return NextResponse.json(
          { success: false, error: 'enrollment_id dan competency_id wajib disertakan.', code: 'VALIDATION_FAILED' },
          { status: 400 }
        );
      }

      // Verify enrollment belongs to this organization
      const enrollRes = await query<{ id: string; cohort_id: string; outlet_id: string | null }>(
        `SELECT id, cohort_id, outlet_id FROM b2b.enrollments WHERE id = $1 AND organization_id = $2`,
        [body.enrollment_id, orgId]
      );

      if (enrollRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Peserta enrollment tidak ditemukan pada organisasi ini.', code: 'ENROLLMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const enrollment = enrollRes.rows[0];

      // Enforce Head Bar outlet scope strictly
      if (membership.roles.includes('head_bar') && !membership.roles.includes('owner')) {
        assertOutletScope(membership, enrollment.outlet_id);
      }

      const recommendation = (body.recommendation as ObservationRecommendation) || 'recommend_needs_practice';

      const insertObsRes = await query<{ id: string }>(
        `INSERT INTO b2b.practical_assessments (
           organization_id, enrollment_id, competency_id,
           rubric_version_id, assessor_user_id, status, attempt_no,
           started_at, submitted_at
         )
         VALUES ($1, $2, $3, $4, $5, 'submitted', 1, NOW(), NOW())
         RETURNING id`,
        [
          orgId,
          body.enrollment_id,
          body.competency_id,
          body.rubric_version_id || null,
          user.userId,
        ]
      );

      const obsAssessmentId = insertObsRes.rows[0].id;

      // Record recommendation observation into assessment signoffs
      await query(
        `INSERT INTO b2b.assessment_signoffs (
           assessment_id, signoff_revision, decision, signed_by, reason, signed_at
         )
         VALUES ($1, 1, 'requires_review', $2, $3, NOW())`,
        [obsAssessmentId, user.userId, `[HeadBar Recommendation: ${recommendation}] ${body.notes || ''}`]
      );

      return NextResponse.json({
        success: true,
        message: 'Observasi Head Bar berhasil dicatat.',
        assessment_id: obsAssessmentId,
        recommendation,
      });
    }

    // 3. Action: Administrative Correction (Platform Admin Only)
    if (action === 'administrative_correction') {
      assertAdminCorrectionAuthority(user, body.reason || '');

      const auditRes = await query<{ id: string }>(
        `INSERT INTO b2b.audit_events (
           organization_id, actor_user_id, action, object_type, object_id, reason, occurred_at
         )
         VALUES ($1, $2, 'administrative_competency_correction', 'competency_status', $3, $4, NOW())
         RETURNING id`,
        [orgId, user.userId, body.competency_id || body.enrollment_id, body.reason]
      );

      return NextResponse.json({
        success: true,
        message: 'Koreksi administratif berhasil dicatat dalam audit trail.',
        audit_event_id: auditRes.rows[0].id,
      });
    }

    // 4. Action: Final Competency Sign-Off (Decision 2 Assessor Enforcement)
    if (action === 'submit_signoff') {
      // 4.0. Immediate Assessor Gate: Admin and Non-Trainers rejected immediately
      if (user.staffPermissions.includes('platform_admin') && !user.staffPermissions.includes('cherry_trainer')) {
        throw new AuthorizationError(
          'ADMIN_CANNOT_SIGNOFF',
          'Platform Admin tidak berwenang menandatangani kelulusan kompetensi secara langsung. Keputusan kompetensi membutuhkan penilai yang berwenang.',
          403
        );
      }

      const isCherryTrainer = user.staffPermissions.includes('cherry_trainer');
      if (!isCherryTrainer) {
        const delegationCheck = await query<{ id: string }>(
          `SELECT id FROM b2b.internal_staff_permissions
           WHERE user_id = $1 AND permission_code = 'assessment_quality_reviewer' AND revoked_at IS NULL`,
          [user.userId]
        );
        if (delegationCheck.rows.length === 0) {
          throw new AuthorizationError(
            'UNAUTHORIZED_ASSESSOR',
            'Hanya Trainer Cherry Edu yang ditugaskan atau penilai dengan delegasi resmi yang berwenang menandatangani kelulusan kompetensi.',
            403
          );
        }
      }

      const enrollmentId = body.enrollment_id;
      const competencyId = body.competency_id;
      const rubricVersionId = body.rubric_version_id;

      if (!enrollmentId || !competencyId || !rubricVersionId) {
        return NextResponse.json(
          {
            success: false,
            error: 'enrollment_id, competency_id, dan rubric_version_id wajib disertakan.',
            code: 'VALIDATION_FAILED',
          },
          { status: 400 }
        );
      }

      // 4.1. Verify enrollment and program version
      const enrollRes = await query<{ id: string; cohort_id: string; user_id: string; program_version_id: string }>(
        `SELECT e.id, e.cohort_id, e.user_id, c.program_version_id
         FROM b2b.enrollments e
         JOIN b2b.cohorts c ON c.id = e.cohort_id
         WHERE e.id = $1 AND e.organization_id = $2`,
        [enrollmentId, orgId]
      );

      if (enrollRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Enrollment tidak ditemukan pada organisasi ini.', code: 'ENROLLMENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const enrollment = enrollRes.rows[0];

      // 4.2. Server-Authoritative Assessor Verification
      const trainerAssignmentRes = await query<{ id: string }>(
        `SELECT id FROM b2b.trainer_assignments 
         WHERE organization_id = $1 AND cohort_id = $2 AND trainer_user_id = $3
           AND active_from <= NOW() AND (active_until IS NULL OR active_until >= NOW())`,
        [orgId, enrollment.cohort_id, user.userId]
      );
      const isAssignedTrainer = trainerAssignmentRes.rows.length > 0;

      const delegationRes = await query<{ id: string }>(
        `SELECT id FROM b2b.internal_staff_permissions
         WHERE user_id = $1 AND permission_code = 'assessment_quality_reviewer' AND revoked_at IS NULL`,
        [user.userId]
      );
      const isDelegatedAssessor = delegationRes.rows.length > 0;

      // Enforce Decision 2 Authority
      const { assessorType } = assertSignoffAuthority(user, {
        isAssignedTrainer,
        isDelegatedAssessor,
      });

      // 4.3. Validate Rubric Version & Competency Relation from Database (Fail Closed)
      const rubricRes = await query<{ id: string; status: string; competency_id: string }>(
        `SELECT rv.id, rv.status, r.competency_id
         FROM b2b.rubric_versions rv
         JOIN b2b.rubrics r ON r.id = rv.rubric_id
         WHERE rv.id = $1`,
        [rubricVersionId]
      );

      if (rubricRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `Rubrik dengan ID "${rubricVersionId}" tidak ditemukan.`, code: 'RUBRIC_NOT_FOUND' },
          { status: 422 }
        );
      }

      const rubric = rubricRes.rows[0];
      if (rubric.status !== 'published') {
        return NextResponse.json(
          { success: false, error: 'Rubrik belum dipublikasikan (status bukan published).', code: 'RUBRIC_NOT_PUBLISHED' },
          { status: 422 }
        );
      }

      if (rubric.competency_id !== competencyId) {
        return NextResponse.json(
          { success: false, error: 'Rubrik yang digunakan tidak sesuai dengan kompetensi yang diuji.', code: 'RUBRIC_COMPETENCY_MISMATCH' },
          { status: 422 }
        );
      }

      // Fetch Official Rubric Criteria (No Hardcoded Fallback!)
      const criteriaRes = await query<{
        id: string;
        code: string;
        description: string;
        weight: string;
        is_critical: boolean;
      }>(
        `SELECT id, code, description, weight::text, is_critical 
         FROM b2b.rubric_criteria 
         WHERE rubric_version_id = $1`,
        [rubricVersionId]
      );

      if (criteriaRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Kriteria rubrik tidak ditemukan pada database (rubrik kosong).', code: 'RUBRIC_CRITERIA_EMPTY' },
          { status: 422 }
        );
      }

      const officialCriteria: RubricCriterionDefinition[] = criteriaRes.rows.map((r) => ({
        code: r.code,
        description: r.description,
        weight: parseFloat(r.weight),
        is_critical: r.is_critical,
      }));

      // 4.4. Server-Authoritative Required Steps & Prerequisites Validation (Fail Closed)
      const requiredStepsRes = await query<{ id: string; title_override: string; step_type: string }>(
        `SELECT id, title_override, step_type
         FROM b2b.program_steps
         WHERE program_version_id = $1 AND is_required = true`,
        [enrollment.program_version_id]
      );

      if (requiredStepsRes.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Konfigurasi kurikulum program versi ini belum memiliki tahapan wajib (0 required steps terkonfigurasi). Asesmen ditolak secara fail-closed.',
            code: 'PROGRAM_STEPS_UNCONFIGURED',
          },
          { status: 422 }
        );
      }

      const requiredStepIds = requiredStepsRes.rows.map((s) => s.id);
      const completedStepsRes = await query<{ program_step_id: string }>(
        `SELECT program_step_id
         FROM b2b.learning_step_progress
         WHERE enrollment_id = $1 AND state = 'completed' AND program_step_id = ANY($2::uuid[])`,
        [enrollmentId, requiredStepIds]
      );

      const completedSet = new Set(completedStepsRes.rows.map((r) => r.program_step_id));
      const missingSteps = requiredStepsRes.rows.filter((s) => !completedSet.has(s.id));

      if (missingSteps.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Prasyarat pembelajaran teori online belum diselesaikan: ${missingSteps.map((m) => m.title_override || m.id).join(', ')}.`,
            code: 'PREREQUISITES_NOT_MET',
            missing_step_ids: missingSteps.map((m) => m.id),
          },
          { status: 422 }
        );
      }

      // 4.5. Run Authoritative Pedagogical Gate Evaluation
      const rawCriteria = body.criterion_results || body.criteria_scores || [];
      const codeById = new Map<string, string>();
      for (const c of criteriaRes.rows) {
        codeById.set(c.id, c.code);
        codeById.set(c.code, c.code);
      }

      const submittedCriterionResults: CriterionResult[] = rawCriteria.map((r: any) => ({
        criterion_id: codeById.get(r.criterion_id) || r.criterion_id,
        level: r.level,
        critical_failure: Boolean(r.critical_failure),
        notes: r.notes || '',
      }));

      // Strict validation: Reject unknown rubric criterion IDs
      const officialCriterionCodes = new Set(officialCriteria.map((c) => c.code));
      for (const cr of submittedCriterionResults) {
        if (!officialCriterionCodes.has(cr.criterion_id)) {
          return NextResponse.json(
            {
              success: false,
              error: `Kriteria asesmen "${cr.criterion_id}" tidak dikenali dalam rubrik resmi versi ini.`,
              code: 'UNKNOWN_CRITERION_ID',
              criterion_id: cr.criterion_id,
            },
            { status: 422 }
          );
        }
      }



      const latestAssessment: PracticalAssessment = {
        id: `temp-${Date.now()}`,
        organization_id: orgId,
        enrollment_id: enrollmentId,
        competency_id: competencyId,
        rubric_version_id: rubricVersionId,
        assessor_user_id: user.userId,
        status: 'submitted',
        attempt_no: 1,
        idempotency_key: `signoff-${enrollmentId}-${competencyId}-${Date.now()}`,
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        signed_off_at: new Date().toISOString(),
        criterion_results: submittedCriterionResults,
        signoff: {
          decision: 'competent',
          signed_by: user.userId,
          assessor_type: assessorType,
          reason: body.notes || 'Disahkan oleh assessor berwenang.',
          signed_at: new Date().toISOString(),
        },
      };

      const evaluation = evaluateCompetency({
        competencyId,
        hasCompletedOnlineLessons: true,
        latestAssessment,
        officialRubricCriteria: officialCriteria,
      });

      if (evaluation.state !== 'competent') {
        return NextResponse.json(
          {
            success: false,
            error: 'Asesmen tidak memenuhi standar kelulusan kompetensi.',
            evaluation,
            code: 'GATE_FAILED',
          },
          { status: 422 }
        );
      }

      // 4.6. Atomic Database Transaction with Row Lock on Enrollment
      return withTransaction(async (client) => {
        // Lock enrollment row
        await client.query(`SELECT id FROM b2b.enrollments WHERE id = $1 FOR UPDATE`, [enrollmentId]);

        const assessmentInsert = await client.query<{ id: string }>(
          `INSERT INTO b2b.practical_assessments (
             organization_id, enrollment_id, competency_id,
             rubric_version_id, assessor_user_id, status, attempt_no,
             started_at, submitted_at, signed_off_at
           )
           VALUES ($1, $2, $3, $4, $5, 'signed_off', 1, NOW(), NOW(), NOW())
           RETURNING id`,
          [
            orgId,
            enrollmentId,
            competencyId,
            rubricVersionId,
            user.userId,
          ]
        );

        const assessmentId = assessmentInsert.rows[0].id;

        // Insert criterion results
        const sanitizedResults = evaluation.sanitizedCriterionResults || submittedCriterionResults;
        for (const r of sanitizedResults) {
          await client.query(
            `INSERT INTO b2b.criterion_results (
               assessment_id, criterion_id, level, critical_failure, notes, entered_at
             )
             SELECT $1, rc.id, $2, $3, $4, NOW()
             FROM b2b.rubric_criteria rc
             WHERE rc.rubric_version_id = $5 AND rc.code = $6`,
            [assessmentId, r.level, r.critical_failure, r.notes || null, rubricVersionId, r.criterion_id]
          );
        }

        // Verify persisted criteria count equals official criteria count
        const countCheck = await client.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM b2b.criterion_results WHERE assessment_id = $1`,
          [assessmentId]
        );
        const persistedCount = parseInt(countCheck.rows[0]?.count || '0', 10);
        if (persistedCount !== officialCriteria.length) {
          throw new CompetencyValidationError(
            'CRITERION_PERSISTENCE_MISMATCH',
            `Kegagalan integritas penyimpanan kriteria: ${persistedCount} dari ${officialCriteria.length} kriteria yang berhasil tersimpan.`
          );
        }

        // Insert official sign-off
        const signoffReason = `Assessor [${assessorType}]: ${body.notes || 'Disahkan oleh penilai berwenang.'}`;
        const signoffInsert = await client.query<{ id: string }>(
          `INSERT INTO b2b.assessment_signoffs (
             assessment_id, signoff_revision, decision, signed_by, reason, signed_at
           )
           VALUES ($1, 1, 'competent', $2, $3, NOW())
           RETURNING id`,
          [assessmentId, user.userId, signoffReason]
        );

        // Update competency status
        await client.query(
          `INSERT INTO b2b.competency_status (
             organization_id, enrollment_id, competency_id, state, verified_at, last_recomputed_at
           )
           VALUES ($1, $2, $3, 'competent', NOW(), NOW())
           ON CONFLICT (enrollment_id, competency_id) DO UPDATE SET
             organization_id = EXCLUDED.organization_id,
             state = 'competent',
             verified_at = NOW(),
             last_recomputed_at = NOW()`,
          [orgId, enrollmentId, competencyId]
        );

        // Record in b2b.competency_evidence
        await client.query(
          `INSERT INTO b2b.competency_evidence (
             organization_id, enrollment_id, competency_id, evidence_type, source_record_ref, rubric_version_id, verification_status, recorded_at
           )
           VALUES ($1, $2, $3, 'practice_signoff', $4, $5, 'verified', NOW())`,
          [orgId, enrollmentId, competencyId, `assessment:${assessmentId}`, rubricVersionId]
        );

        return NextResponse.json(
          {
            success: true,
            message: 'Asesmen praktik berhasil diverifikasi dan disahkan.',
            assessment_id: assessmentId,
            signoff_id: signoffInsert.rows[0].id,
            decision: 'competent',
            evaluation,
          },
          { status: 201 }
        );
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
    if (err instanceof CompetencyValidationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: 422 });
    }
    console.error('Error in assessments POST:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

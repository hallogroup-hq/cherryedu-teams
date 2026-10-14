import http from 'http';
import { NextRequest } from 'next/server';
import { query, closeDbPool } from '../lib/db';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';

import { GET as getTrainerCohorts } from '../app/api/teams/trainer/cohorts/route';
import { GET as getTrainerCohortDetail } from '../app/api/teams/trainer/cohorts/[cohortId]/route';
import {
  GET as getAssessmentWorkspace,
  POST as postAssessmentWorkspace,
} from '../app/api/teams/trainer/cohorts/[cohortId]/assess/[enrollmentId]/route';
import { POST as postStepProgress } from '../app/api/teams/organizations/[orgId]/enrollments/[enrollmentId]/steps/[stepId]/progress/route';

if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
}

const PORT = 3112;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const USER_OWNER_A = '11111111-1111-1111-1111-111111111111';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';
const USER_TRAINER_UNASSIGNED = '55555555-5555-5555-5555-555555555556';

const COHORT_A = 'c1000000-0000-0000-0000-000000000001';
const COMPETENCY_ID = 'c0000000-0000-0000-0000-000000000001';
const RUBRIC_VERSION_ID = 'f1000000-0000-0000-0000-000000000001';

// Fresh test learner and enrollment for Trainer evaluation flow
const TEST_LEARNER_TRAINER = '33333333-3333-3333-3333-333333333377';
const TEST_ENROLLMENT_TRAINER = 'e0000000-0000-0000-0000-000000000077';
const STEP_1 = 'd2000000-0000-0000-0000-000000000001';
const STEP_2 = 'd2000000-0000-0000-0000-000000000002';
const STEP_3 = 'd2000000-0000-0000-0000-000000000003';

const tokenFor = (userId: string, expOffsetSec = 3600) => {
  const token = createSignedToken({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + expOffsetSec,
  });
  return { authorization: `Bearer ${token}` };
};

function startHttpServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk);
        const bodyBuffer = Buffer.concat(chunks);

        const url = new URL(req.url || '/', BASE_URL);
        const pathname = url.pathname;

        const nextReq = new NextRequest(url.toString(), {
          method: req.method,
          headers: req.headers as any,
          body: req.method !== 'GET' && req.method !== 'HEAD' && bodyBuffer.length > 0 ? bodyBuffer : undefined,
        });

        let nextRes: Response;

        const cohortsMatch = pathname.match(/^\/api\/teams\/trainer\/cohorts$/);
        const cohortDetailMatch = pathname.match(/^\/api\/teams\/trainer\/cohorts\/([^/]+)$/);
        const assessWorkspaceMatch = pathname.match(
          /^\/api\/teams\/trainer\/cohorts\/([^/]+)\/assess\/([^/]+)$/
        );
        const stepProgressMatch = pathname.match(
          /^\/api\/teams\/organizations\/([^/]+)\/enrollments\/([^/]+)\/steps\/([^/]+)\/progress$/
        );

        if (cohortsMatch && req.method === 'GET') {
          nextRes = await getTrainerCohorts(nextReq);
        } else if (cohortDetailMatch && req.method === 'GET') {
          nextRes = await getTrainerCohortDetail(nextReq, {
            params: Promise.resolve({ cohortId: cohortDetailMatch[1] }),
          });
        } else if (assessWorkspaceMatch) {
          nextRes =
            req.method === 'POST'
              ? await postAssessmentWorkspace(nextReq, {
                  params: Promise.resolve({
                    cohortId: assessWorkspaceMatch[1],
                    enrollmentId: assessWorkspaceMatch[2],
                  }),
                })
              : await getAssessmentWorkspace(nextReq, {
                  params: Promise.resolve({
                    cohortId: assessWorkspaceMatch[1],
                    enrollmentId: assessWorkspaceMatch[2],
                  }),
                });
        } else if (stepProgressMatch && req.method === 'POST') {
          nextRes = await postStepProgress(nextReq, {
            params: Promise.resolve({
              orgId: stepProgressMatch[1],
              enrollmentId: stepProgressMatch[2],
              stepId: stepProgressMatch[3],
            }),
          });
        } else {
          nextRes = new Response(JSON.stringify({ error: 'Not Found', code: 'NOT_FOUND' }), {
            status: 404,
            headers: { 'content-type': 'application/json' },
          });
        }

        const resBody = await nextRes.text();
        res.writeHead(nextRes.status, Object.fromEntries(nextRes.headers.entries()));
        res.end(resBody);
      } catch (err: any) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }));
      }
    });

    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function runTrainerSuite() {
  console.log('===============================================================');
  console.log('     CHERRY EDU TEAMS — COMPLETE TRAINER APPLICATION QA        ');
  console.log('===============================================================');

  const server = await startHttpServer();
  console.log(`✓ Real HTTP Test Server listening on ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 0. Seed fresh test learner & enrollment in database
    await query(
      `INSERT INTO auth.users (id, email, raw_user_meta_data)
       VALUES ($1, 'barista.trainer.test@coffeeshop.id', '{"name": "Budi Penilai Trainer"}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [TEST_LEARNER_TRAINER]
    );

    await query(
      `INSERT INTO b2b.organization_memberships (id, organization_id, user_id, status)
       VALUES ('aa000000-0000-0000-0000-000000000077', $1, $2, 'active')
       ON CONFLICT (id) DO NOTHING`,
      [TENANT_A, TEST_LEARNER_TRAINER]
    );

    await query(
      `INSERT INTO b2b.membership_roles (membership_id, role_code)
       VALUES ('aa000000-0000-0000-0000-000000000077', 'learner')
       ON CONFLICT DO NOTHING`
    );

    await query(
      `INSERT INTO b2b.enrollments (id, organization_id, cohort_id, user_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (id) DO NOTHING`,
      [TEST_ENROLLMENT_TRAINER, TENANT_A, COHORT_A, TEST_LEARNER_TRAINER]
    );

    // Clean prior test artifacts for this fresh enrollment
    await query(`DELETE FROM b2b.remediation_tasks WHERE enrollment_id = $1`, [TEST_ENROLLMENT_TRAINER]);
    await query(`DELETE FROM b2b.competency_evidence WHERE enrollment_id = $1`, [TEST_ENROLLMENT_TRAINER]);
    await query(`DELETE FROM b2b.practical_assessments WHERE enrollment_id = $1`, [TEST_ENROLLMENT_TRAINER]);
    await query(`DELETE FROM b2b.competency_status WHERE enrollment_id = $1`, [TEST_ENROLLMENT_TRAINER]);
    await query(`DELETE FROM b2b.learning_step_progress WHERE enrollment_id = $1`, [TEST_ENROLLMENT_TRAINER]);

    // -------------------------------------------------------------
    // 1. TRAINER ACCESS & COHORT SCOPING
    // -------------------------------------------------------------
    console.log('[1. TRAINER PORTAL ACCESS & COHORT SCOPING]');

    // 1.1 Unauthenticated request rejected with 401
    const res1_1 = await fetch(`${BASE_URL}/api/teams/trainer/cohorts`);
    assert(res1_1.status === 401, '1.1 Unauthenticated access rejected with 401');

    // 1.2 Non-trainer (Owner & Barista) forbidden with 403
    const res1_2a = await fetch(`${BASE_URL}/api/teams/trainer/cohorts`, {
      headers: tokenFor(USER_OWNER_A),
    });
    assert(res1_2a.status === 403, '1.2a Owner forbidden from accessing trainer portal (403)');

    const res1_2b = await fetch(`${BASE_URL}/api/teams/trainer/cohorts`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    assert(res1_2b.status === 403, '1.2b Barista forbidden from accessing trainer portal (403)');

    // 1.3 Assigned trainer fetches assigned cohorts
    const res1_3 = await fetch(`${BASE_URL}/api/teams/trainer/cohorts`, {
      headers: tokenFor(USER_TRAINER_SARAH),
    });
    const data1_3 = await res1_3.json();
    assert(
      res1_3.status === 200 &&
        data1_3.success === true &&
        Array.isArray(data1_3.cohorts) &&
        data1_3.cohorts.some((c: any) => c.cohort_id === COHORT_A),
      '1.3 Assigned trainer fetches assigned cohorts across organizations (200 OK)'
    );

    // 1.4 Unassigned trainer blocked from accessing unassigned cohort (403)
    const res1_4 = await fetch(`${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}`, {
      headers: tokenFor(USER_TRAINER_UNASSIGNED),
    });
    assert(res1_4.status === 403, '1.4 Unassigned trainer blocked from cohort access (403 UNASSIGNED_TRAINER)');

    // -------------------------------------------------------------
    // 2. COHORT PARTICIPANTS & PEDAGOGICAL GATE INTEGRITY
    // -------------------------------------------------------------
    console.log('\n[2. COHORT PARTICIPANT ROSTER & PEDAGOGICAL GATE]');

    // 2.1 Assigned trainer views cohort participants
    const res2_1 = await fetch(`${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}`, {
      headers: tokenFor(USER_TRAINER_SARAH),
    });
    const data2_1 = await res2_1.json();
    assert(
      res2_1.status === 200 &&
        data2_1.success === true &&
        Array.isArray(data2_1.participants) &&
        data2_1.participants.some((p: any) => p.enrollmentId === TEST_ENROLLMENT_TRAINER),
      '2.1 Assigned trainer views participant roster for cohort (200 OK)'
    );

    // 2.2 Learner with incomplete theory is marked ineligible for sign-off
    const freshParticipant = data2_1.participants.find(
      (p: any) => p.enrollmentId === TEST_ENROLLMENT_TRAINER
    );
    assert(
      freshParticipant && freshParticipant.isTheoryCompleted === false && freshParticipant.canAssess === false,
      '2.2 Barista with incomplete theory marked ineligible for assessment (canAssess: false)'
    );

    // Complete theory steps for test learner
    await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_TRAINER}/steps/${STEP_1}/progress`, {
      method: 'POST',
      headers: { ...tokenFor(TEST_LEARNER_TRAINER), 'content-type': 'application/json' },
      body: JSON.stringify({ state: 'completed' }),
    });
    await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_TRAINER}/steps/${STEP_2}/progress`, {
      method: 'POST',
      headers: { ...tokenFor(TEST_LEARNER_TRAINER), 'content-type': 'application/json' },
      body: JSON.stringify({ state: 'completed' }),
    });
    await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_TRAINER}/steps/${STEP_3}/progress`, {
      method: 'POST',
      headers: { ...tokenFor(TEST_LEARNER_TRAINER), 'content-type': 'application/json' },
      body: JSON.stringify({ state: 'completed' }),
    });

    // 2.3 Re-fetch cohort participants, verify theory is completed
    const res2_3 = await fetch(`${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}`, {
      headers: tokenFor(USER_TRAINER_SARAH),
    });
    const data2_3 = await res2_3.json();
    const updatedParticipant = data2_3.participants.find(
      (p: any) => p.enrollmentId === TEST_ENROLLMENT_TRAINER
    );
    assert(
      updatedParticipant && updatedParticipant.isTheoryCompleted === true && updatedParticipant.canAssess === true,
      '2.3 Theory completion unlocks assessment eligibility for barista (canAssess: true)'
    );

    // -------------------------------------------------------------
    // 3. RUBRIC-BASED PRACTICAL EVALUATION & REMEDIATION LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n[3. RUBRIC EVALUATION WORKSPACE & CRITICAL FAILURE]');

    // 3.1 Rubric definition loaded with Level 1..4 anchors
    const res3_1 = await fetch(
      `${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}/assess/${TEST_ENROLLMENT_TRAINER}`,
      { headers: tokenFor(USER_TRAINER_SARAH) }
    );
    const data3_1 = await res3_1.json();
    assert(
      res3_1.status === 200 &&
        data3_1.success === true &&
        data3_1.workspace.rubric.criteria.length >= 3 &&
        data3_1.workspace.rubric.criteria[0].anchors?.[1] !== undefined,
      '3.1 Evaluation workspace loads rubric criteria with Level 1..4 observable anchors (200 OK)'
    );

    // 3.2 Evaluation submission with critical failure triggers not_yet_competent & assigns remediation
    const res3_2 = await fetch(
      `${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}/assess/${TEST_ENROLLMENT_TRAINER}`,
      {
        method: 'POST',
        headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
        body: JSON.stringify({
          rubric_version_id: RUBRIC_VERSION_ID,
          competency_id: COMPETENCY_ID,
          criterion_results: [
            { criterion_id: 'crit-dose', level: 3, critical_failure: false, notes: 'Dosis 18.2g masuk toleransi' },
            { criterion_id: 'crit-tamp', level: 1, critical_failure: true, notes: 'Tamping miring > 5 derajat memicu channeling' },
            { criterion_id: 'crit-cleanliness', level: 4, critical_failure: false, notes: 'Stasiun kerja bersih' },
          ],
          notes: 'Teknik tamping perlu perbaikan fundamental.',
          remediation_instructions: 'Latihan tamping rata 10 kali menggunakan tamper leveling.',
        }),
      }
    );
    const data3_2 = await res3_2.json();
    assert(
      res3_2.status === 200 &&
        data3_2.success === true &&
        data3_2.decision === 'not_yet_competent' &&
        data3_2.remediation_task_id !== null,
      '3.2 Evaluation with critical failure records not_yet_competent and provisions remediation task (200 OK)'
    );

    // 3.3 Verify PostgreSQL persistence for attempt 1 and remediation
    const dbAssess1 = await query<{ status: string; attempt_no: number }>(
      `SELECT status, attempt_no FROM b2b.practical_assessments 
       WHERE enrollment_id = $1 ORDER BY attempt_no DESC LIMIT 1`,
      [TEST_ENROLLMENT_TRAINER]
    );
    const dbRemediation = await query<{ instructions: string; status: string }>(
      `SELECT instructions, status FROM b2b.remediation_tasks 
       WHERE enrollment_id = $1 LIMIT 1`,
      [TEST_ENROLLMENT_TRAINER]
    );
    assert(
      dbAssess1.rows.length > 0 &&
        dbAssess1.rows[0].status === 'submitted' &&
        dbRemediation.rows.length > 0 &&
        dbRemediation.rows[0].status === 'assigned',
      '3.3 Practical assessment attempt and remediation task accurately persisted in PostgreSQL'
    );

    // -------------------------------------------------------------
    // 4. OFFICIAL COMPETENCY SIGN-OFF & MONOTONIC LOCK
    // -------------------------------------------------------------
    console.log('\n[4. OFFICIAL SIGN-OFF & MONOTONIC LOCK INTEGRITY]');

    // 4.1 Evaluation with passing scores across all criteria succeeds (201 Created)
    const res4_1 = await fetch(
      `${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}/assess/${TEST_ENROLLMENT_TRAINER}`,
      {
        method: 'POST',
        headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
        body: JSON.stringify({
          rubric_version_id: RUBRIC_VERSION_ID,
          competency_id: COMPETENCY_ID,
          criterion_results: [
            { criterion_id: 'crit-dose', level: 4, critical_failure: false, notes: 'Presisi 18.0g' },
            { criterion_id: 'crit-tamp', level: 4, critical_failure: false, notes: 'Tamping rata sempurna' },
            { criterion_id: 'crit-cleanliness', level: 4, critical_failure: false, notes: 'Kebersihan portafilter prima' },
          ],
          notes: 'Remedial tuntas. Seluruh kriteria memenuhi standar industri.',
        }),
      }
    );
    const data4_1 = await res4_1.json();
    assert(
      res4_1.status === 201 &&
        data4_1.success === true &&
        data4_1.decision === 'competent' &&
        data4_1.attempt_no === 2,
      '4.1 Passing evaluation creates official competent sign-off (201 Created, attempt #2)'
    );

    // 4.2 Signoff decision and assessor signature in b2b.assessment_signoffs
    const dbSignoff = await query<{ decision: string; signed_by: string }>(
      `SELECT decision, signed_by FROM b2b.assessment_signoffs
       WHERE assessment_id = $1`,
      [data4_1.assessment_id]
    );
    assert(
      dbSignoff.rows.length > 0 &&
        dbSignoff.rows[0].decision === 'competent' &&
        dbSignoff.rows[0].signed_by === USER_TRAINER_SARAH,
      '4.2 Assessor signature and decision competent persisted in b2b.assessment_signoffs'
    );

    // 4.3 Competency status transitioned to competent in PostgreSQL b2b.competency_status
    const dbStatus = await query<{ state: string; verified_at: string | null }>(
      `SELECT state, verified_at FROM b2b.competency_status
       WHERE enrollment_id = $1 AND competency_id = $2`,
      [TEST_ENROLLMENT_TRAINER, COMPETENCY_ID]
    );
    assert(
      dbStatus.rows.length > 0 &&
        dbStatus.rows[0].state === 'competent' &&
        dbStatus.rows[0].verified_at !== null,
      '4.3 Competency state transitioned to competent in PostgreSQL b2b.competency_status'
    );

    // 4.4 Verification evidence persisted in b2b.competency_evidence
    const dbEvidence = await query<{ evidence_type: string; verification_status: string }>(
      `SELECT evidence_type, verification_status FROM b2b.competency_evidence
       WHERE enrollment_id = $1 AND competency_id = $2 AND evidence_type = 'practice_signoff'`,
      [TEST_ENROLLMENT_TRAINER, COMPETENCY_ID]
    );
    assert(
      dbEvidence.rows.length > 0 && dbEvidence.rows[0].verification_status === 'verified',
      '4.4 Practice sign-off evidence persisted in b2b.competency_evidence with verified status'
    );

    // 4.5 Monotonic Lock: Re-evaluation or downgrade attempt of an already competent barista is rejected with 409
    const res4_5 = await fetch(
      `${BASE_URL}/api/teams/trainer/cohorts/${COHORT_A}/assess/${TEST_ENROLLMENT_TRAINER}`,
      {
        method: 'POST',
        headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
        body: JSON.stringify({
          rubric_version_id: RUBRIC_VERSION_ID,
          competency_id: COMPETENCY_ID,
          criterion_results: [
            { criterion_id: 'crit-dose', level: 1, critical_failure: true },
          ],
        }),
      }
    );
    assert(
      res4_5.status === 409,
      '4.5 Monotonic lock: Re-evaluation/downgrade of already competent barista rejected with 409 ALREADY_COMPETENT_LOCKED'
    );
  } finally {
    server.close();
    await closeDbPool();
  }

  console.log('===============================================================');
  console.log(` TRAINER APPLICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTrainerSuite().catch((err) => {
  console.error('Fatal error running trainer suite:', err);
  process.exit(1);
});

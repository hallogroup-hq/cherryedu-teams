import http from 'http';
import { NextRequest } from 'next/server';
import { query, closeDbPool } from '../lib/db';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';

import { GET as getCurriculum } from '../app/api/teams/organizations/[orgId]/curriculum/route';
import { GET as getProgress } from '../app/api/teams/organizations/[orgId]/enrollments/[enrollmentId]/progress/route';
import { POST as postStepProgress } from '../app/api/teams/organizations/[orgId]/enrollments/[enrollmentId]/steps/[stepId]/progress/route';
import {
  GET as getRemediation,
  POST as postRemediation,
} from '../app/api/teams/organizations/[orgId]/remediation/route';
import {
  GET as getAssessments,
  POST as postAssessment,
} from '../app/api/teams/organizations/[orgId]/assessments/route';

if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
}

const PORT = 3109;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const TENANT_B = 'b0000000-0000-0000-0000-000000000002';
const USER_OWNER_A = '11111111-1111-1111-1111-111111111111';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';
const USER_BARISTA_B = '88888888-8888-8888-8888-888888888888';

const COHORT_A = 'c1000000-0000-0000-0000-000000000001';
const COMPETENCY_ID = 'c0000000-0000-0000-0000-000000000001';
const RUBRIC_VERSION_ID = 'f1000000-0000-0000-0000-000000000001';

const STEP_1 = 'd2000000-0000-0000-0000-000000000001';
const STEP_2 = 'd2000000-0000-0000-0000-000000000002';
const STEP_3 = 'd2000000-0000-0000-0000-000000000003';

// Dedicated fresh test learner and enrollment
const TEST_LEARNER_ID = '33333333-3333-3333-3333-333333333399';
const TEST_ENROLLMENT_ID = 'e0000000-0000-0000-0000-000000000099';

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

        const curriculumMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/curriculum$/);
        const progressMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/enrollments\/([^/]+)\/progress$/);
        const stepProgressMatch = pathname.match(
          /^\/api\/teams\/organizations\/([^/]+)\/enrollments\/([^/]+)\/steps\/([^/]+)\/progress$/
        );
        const remediationMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/remediation$/);
        const assessmentsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/assessments$/);

        if (curriculumMatch && req.method === 'GET') {
          nextRes = await getCurriculum(nextReq, { params: Promise.resolve({ orgId: curriculumMatch[1] }) });
        } else if (progressMatch && req.method === 'GET') {
          nextRes = await getProgress(nextReq, {
            params: Promise.resolve({ orgId: progressMatch[1], enrollmentId: progressMatch[2] }),
          });
        } else if (stepProgressMatch && req.method === 'POST') {
          nextRes = await postStepProgress(nextReq, {
            params: Promise.resolve({
              orgId: stepProgressMatch[1],
              enrollmentId: stepProgressMatch[2],
              stepId: stepProgressMatch[3],
            }),
          });
        } else if (remediationMatch) {
          nextRes = req.method === 'POST'
            ? await postRemediation(nextReq, { params: Promise.resolve({ orgId: remediationMatch[1] }) })
            : await getRemediation(nextReq, { params: Promise.resolve({ orgId: remediationMatch[1] }) });
        } else if (assessmentsMatch) {
          nextRes = req.method === 'POST'
            ? await postAssessment(nextReq, { params: Promise.resolve({ orgId: assessmentsMatch[1] }) })
            : await getAssessments(nextReq, { params: Promise.resolve({ orgId: assessmentsMatch[1] }) });
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

async function runCurriculumSuite() {
  console.log('===============================================================');
  console.log('  CHERRY EDU TEAMS — CURRICULUM & COMPETENCY ENGINE QA SUITE   ');
  console.log('===============================================================');

  const server = await startHttpServer();
  console.log(`✓ Real HTTP Test Server listening on ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Setup fresh test learner and clean progress
    // -------------------------------------------------------------------------
    await query(`INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [
      TEST_LEARNER_ID,
      'barista.learner.fresh@cherrycoffee.id',
    ]);

    await query(
      `INSERT INTO b2b.organization_memberships (id, organization_id, user_id, status)
       VALUES ('aa000000-0000-0000-0000-000000000099', $1, $2, 'active')
       ON CONFLICT (organization_id, user_id) DO UPDATE SET status = 'active'`,
      [TENANT_A, TEST_LEARNER_ID]
    );

    await query(
      `INSERT INTO b2b.membership_roles (membership_id, role_code)
       VALUES ('aa000000-0000-0000-0000-000000000099', 'learner')
       ON CONFLICT DO NOTHING`
    );

    await query(
      `INSERT INTO b2b.enrollments (id, organization_id, cohort_id, user_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (id) DO NOTHING`,
      [TEST_ENROLLMENT_ID, TENANT_A, COHORT_A, TEST_LEARNER_ID]
    );

    // Clean step progress for this fresh enrollment
    await query(`DELETE FROM b2b.learning_step_progress WHERE enrollment_id = $1`, [TEST_ENROLLMENT_ID]);
    await query(`DELETE FROM b2b.competency_status WHERE enrollment_id = $1`, [TEST_ENROLLMENT_ID]);
    await query(`DELETE FROM b2b.remediation_tasks WHERE enrollment_id = $1`, [TEST_ENROLLMENT_ID]);

    // -------------------------------------------------------------------------
    console.log('[1. CURRICULUM DISCOVERY & PREREQUISITES GRAPH]');
    // -------------------------------------------------------------------------

    // 1.1 Unauthenticated curriculum request fails with 401
    const res1_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/curriculum`);
    assert(res1_1.status === 401, '1.1 Unauthenticated curriculum request returns 401');

    // 1.2 Cross-tenant curriculum request fails with 403
    const res1_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/curriculum`, {
      headers: tokenFor(USER_OWNER_A),
    });
    assert(res1_2.status === 403, '1.2 Cross-tenant curriculum request returns 403');

    // 1.3 Tenant member queries curriculum: returns steps and prerequisites
    const res1_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/curriculum`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data1_3 = await res1_3.json();
    assert(
      res1_3.status === 200 && data1_3.success === true && Array.isArray(data1_3.curriculum) && data1_3.curriculum.length > 0,
      '1.3 Member fetches authoritative curriculum structure (200 OK)'
    );

    const steps = data1_3.curriculum[0].steps;
    assert(
      steps.length >= 3 && steps[0].sort_order === 1 && steps[1].prerequisite_step_ids.includes(steps[0].id),
      '1.4 Sequential prerequisite relationship correctly mapped in curriculum graph'
    );

    // -------------------------------------------------------------------------
    console.log('\n[2. ENROLLMENT PROGRESS & PREREQUISITE GATING]');
    // -------------------------------------------------------------------------

    // 2.1 Fresh enrollment progress: Step 1 is unlocked, Step 2 is blocked
    const res2_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/progress`, {
      headers: tokenFor(TEST_LEARNER_ID),
    });
    const data2_1 = await res2_1.json();
    assert(
      res2_1.status === 200 &&
      data2_1.steps.find((s: any) => s.id === STEP_1)?.is_unlocked === true &&
      data2_1.steps.find((s: any) => s.id === STEP_2)?.is_unlocked === false,
      '2.1 Step 1 is unlocked and Step 2 is blocked for fresh learner'
    );

    // 2.2 Attempting to complete Step 2 before Step 1 is rejected with 422 PREREQUISITE_UNMET
    const res2_2 = await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/steps/${STEP_2}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );
    const data2_2 = await res2_2.json();
    assert(
      res2_2.status === 422 && data2_2.code === 'PREREQUISITE_UNMET',
      '2.2 Premature completion of Step 2 rejected with 422 PREREQUISITE_UNMET'
    );

    // 2.3 Other barista cannot tamper with learner progress -> 403 FORBIDDEN
    const res2_3 = await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/steps/${STEP_1}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );
    assert(res2_3.status === 403, '2.3 Unauthorized barista blocked from tampering progress (403)');

    // 2.4 Learner completes Step 1 successfully
    const res2_4 = await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/steps/${STEP_1}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );
    const data2_4 = await res2_4.json();
    assert(res2_4.status === 200 && data2_4.state === 'completed', '2.4 Step 1 completed successfully (200 OK)');

    // 2.5 Re-check progress: Step 2 is now unlocked
    const res2_5 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/progress`, {
      headers: tokenFor(TEST_LEARNER_ID),
    });
    const data2_5 = await res2_5.json();
    assert(
      res2_5.status === 200 && data2_5.steps.find((s: any) => s.id === STEP_2)?.is_unlocked === true,
      '2.5 Step 2 successfully unlocked after completing prerequisite Step 1'
    );

    // 2.6 Complete remaining theory steps (Step 2 and Step 3)
    await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/steps/${STEP_2}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );

    const res2_6 = await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${TEST_ENROLLMENT_ID}/steps/${STEP_3}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );
    const data2_6 = await res2_6.json();
    assert(
      res2_6.status === 200 && data2_6.all_required_theory_completed === true,
      '2.6 All required theory completed, transitioning to awaiting_assessment'
    );

    // 2.7 Verify competency status is awaiting_assessment (NOT competent)
    const dbCompState = await query<{ state: string }>(
      `SELECT state FROM b2b.competency_status WHERE enrollment_id = $1 AND competency_id = $2`,
      [TEST_ENROLLMENT_ID, COMPETENCY_ID]
    );
    assert(
      dbCompState.rows.length === 1 && dbCompState.rows[0].state === 'awaiting_assessment',
      '2.7 Theory completion alone NEVER grants competent state (status: awaiting_assessment)'
    );

    // -------------------------------------------------------------------------
    console.log('\n[3. PRACTICAL ASSESSMENT RUBRIC & REMEDIATION LIFECYCLE]');
    // -------------------------------------------------------------------------

    // 3.1 Non-trainer cannot create remediation task -> 403 FORBIDDEN
    const res3_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        enrollment_id: TEST_ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        title: 'Latihan Tamping Mandiri',
        instructions: 'Lakukan kalibrasi tamping 10 kali.',
      }),
    });
    assert(res3_1.status === 403, '3.1 Non-trainer forbidden from assigning remediation (403)');

    // 3.2 Assigned trainer creates remediation task -> 201 Created
    const res3_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        enrollment_id: TEST_ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        title: 'Remedial Kalibrasi Distribusi & Tamping',
        instructions: 'Praktikkan distribusi WDT dan tamping rata konsisten 15kg.',
      }),
    });
    const data3_2 = await res3_2.json();
    assert(
      res3_2.status === 201 && data3_2.success === true && data3_2.task?.status === 'assigned',
      '3.2 Assigned trainer creates remediation task (201 Created)'
    );

    const taskId = data3_2.task.id;

    // 3.3 Learner submits completed remediation
    const res3_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(TEST_LEARNER_ID), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'submit', task_id: taskId }),
    });
    const data3_3 = await res3_3.json();
    assert(res3_3.status === 200 && data3_3.task?.status === 'submitted', '3.3 Learner submits remediation (200 OK, status: submitted)');

    // 3.4 Trainer verifies remediation task
    const res3_4 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'verify', task_id: taskId }),
    });
    const data3_4 = await res3_4.json();
    assert(res3_4.status === 200 && data3_4.task?.status === 'verified', '3.4 Trainer verifies remediation task (200 OK, status: verified)');

    // -------------------------------------------------------------------------
    console.log('\n[4. MULTI-ATTEMPT ASSESSMENT HISTORY & EVIDENCE LOGGING]');
    // -------------------------------------------------------------------------

    // 4.1 Assessment Attempt 1: Critical failure -> rejected with 422 GATE_FAILED
    const res4_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_signoff',
        enrollment_id: TEST_ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        rubric_version_id: RUBRIC_VERSION_ID,
        criterion_results: [
          { criterion_id: 'crit-dose', level: 3, critical_failure: false },
          { criterion_id: 'crit-tamp', level: 1, critical_failure: true, notes: 'Tamping miring > 5 derajat' },
          { criterion_id: 'crit-cleanliness', level: 4, critical_failure: false },
        ],
      }),
    });
    assert(res4_1.status === 422, '4.1 Assessment Attempt 1 with critical failure fails gate (422 GATE_FAILED)');

    // 4.2 Assessment Attempt 2: Perfect scores -> succeeds with 201 Created and competent state
    const res4_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_signoff',
        enrollment_id: TEST_ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        rubric_version_id: RUBRIC_VERSION_ID,
        criterion_results: [
          { criterion_id: 'crit-dose', level: 4, critical_failure: false, notes: 'Dosis presisi 18.0g' },
          { criterion_id: 'crit-tamp', level: 4, critical_failure: false, notes: 'Tamping rata sempurna' },
          { criterion_id: 'crit-cleanliness', level: 4, critical_failure: false, notes: 'Standar kebersihan prima' },
        ],
        notes: 'Penilaian ulang pasca-remedial tuntas sempurna.',
      }),
    });
    const data4_2 = await res4_2.json();
    assert(
      res4_2.status === 201 && data4_2.success === true && data4_2.decision === 'competent',
      '4.2 Assessment Attempt 2 succeeds (201 Created, decision: competent)'
    );

    // 4.3 Competency state is now verified competent in PostgreSQL
    const dbFinalComp = await query<{ state: string }>(
      `SELECT state FROM b2b.competency_status WHERE enrollment_id = $1 AND competency_id = $2`,
      [TEST_ENROLLMENT_ID, COMPETENCY_ID]
    );
    assert(
      dbFinalComp.rows.length === 1 && dbFinalComp.rows[0].state === 'competent',
      '4.3 Competency state transitioned to competent in PostgreSQL b2b.competency_status'
    );

    // 4.4 Competency evidence record created and verified
    const dbEvidence = await query<{ verification_status: string; evidence_type: string }>(
      `SELECT verification_status, evidence_type FROM b2b.competency_evidence
       WHERE enrollment_id = $1 AND competency_id = $2`,
      [TEST_ENROLLMENT_ID, COMPETENCY_ID]
    );
    assert(
      dbEvidence.rows.length >= 1 && dbEvidence.rows[0].verification_status === 'verified',
      '4.4 Evidence record persisted in PostgreSQL b2b.competency_evidence with status verified'
    );

  } finally {
    server.close();
    await closeDbPool();
  }

  console.log('===============================================================');
  console.log(` CURRICULUM & COMPETENCY RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCurriculumSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

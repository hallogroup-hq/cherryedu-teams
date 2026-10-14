import http from 'http';
import { NextRequest } from 'next/server';
import { query, closeDbPool } from '../lib/db';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';

import { GET as getProgress } from '../app/api/teams/organizations/[orgId]/enrollments/[enrollmentId]/progress/route';
import { POST as postStepProgress } from '../app/api/teams/organizations/[orgId]/enrollments/[enrollmentId]/steps/[stepId]/progress/route';
import {
  GET as getRemediation,
  POST as postRemediation,
} from '../app/api/teams/organizations/[orgId]/remediation/route';

if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
}

const PORT = 3110;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const TENANT_B = 'b0000000-0000-0000-0000-000000000002';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_BARISTA_B = '88888888-8888-8888-8888-888888888888';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';

const ENROLLMENT_A = 'e0000000-0000-0000-0000-000000000001';
const STEP_1 = 'd2000000-0000-0000-0000-000000000001';
const COMPETENCY_ID = 'c0000000-0000-0000-0000-000000000001';

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

        const progressMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/enrollments\/([^/]+)\/progress$/);
        const stepProgressMatch = pathname.match(
          /^\/api\/teams\/organizations\/([^/]+)\/enrollments\/([^/]+)\/steps\/([^/]+)\/progress$/
        );
        const remediationMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/remediation$/);

        if (progressMatch && req.method === 'GET') {
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

async function runBaristaSuite() {
  console.log('===============================================================');
  console.log('     CHERRY EDU TEAMS — COMPLETE BARISTA APPLICATION QA        ');
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
    console.log('[1. BARISTA LEARNER ACCESS & PORTAL NAVIGATION]');
    // -------------------------------------------------------------------------

    // 1.1 Barista A fetches own enrollment progress -> 200 OK
    const res1_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${ENROLLMENT_A}/progress`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    const data1_1 = await res1_1.json();
    assert(
      res1_1.status === 200 && data1_1.success === true && Array.isArray(data1_1.steps),
      '1.1 Barista fetches authoritative learning progress (200 OK)'
    );

    // 1.2 Cross-tenant access to Tenant B progress -> 403
    const res1_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/enrollments/${ENROLLMENT_A}/progress`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    assert(res1_2.status === 403, '1.2 Cross-tenant access blocked with 403');

    // 1.3 Cross-learner progress tampering: Barista B accessing Barista A's progress -> 403
    const res1_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${ENROLLMENT_A}/progress`, {
      headers: tokenFor(USER_BARISTA_B),
    });
    assert(res1_3.status === 403, '1.3 Cross-learner progress access blocked with 403 FORBIDDEN');

    // -------------------------------------------------------------------------
    console.log('\n[2. INTERACTIVE LESSON PROGRESSION & RE-VERIFICATION]');
    // -------------------------------------------------------------------------

    // 2.1 Barista marks Step 1 as completed
    const res2_1 = await fetch(
      `${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${ENROLLMENT_A}/steps/${STEP_1}/progress`,
      {
        method: 'POST',
        headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
        body: JSON.stringify({ state: 'completed' }),
      }
    );
    const data2_1 = await res2_1.json();
    assert(res2_1.status === 200 && data2_1.state === 'completed', '2.1 Barista completes Step 1 (200 OK, state: completed)');

    // 2.2 Progress re-fetch confirms persistence in DB
    const res2_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/enrollments/${ENROLLMENT_A}/progress`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    const data2_2 = await res2_2.json();
    const step1 = data2_2.steps.find((s: any) => s.id === STEP_1);
    assert(
      step1 && step1.state === 'completed' && step1.completed_at !== null,
      '2.2 Completed timestamp and state persisted accurately in PostgreSQL'
    );

    // -------------------------------------------------------------------------
    console.log('\n[3. COMPETENCY STATUS & PEDAGOGICAL GATE INTEGRITY]');
    // -------------------------------------------------------------------------

    // 3.1 Competency status displays real validated state
    const comp = data2_2.competencies.find((c: any) => c.competency_id === COMPETENCY_ID);
    assert(
      comp && ['learning', 'awaiting_assessment', 'needs_practice', 'competent'].includes(comp.state),
      '3.1 Authoritative competency status displayed to learner without artificial inflation'
    );

    // -------------------------------------------------------------------------
    console.log('\n[4. REMEDIATION TASK WORKFLOW (LATIHAN TERARAH)]]');
    // -------------------------------------------------------------------------

    // Setup: Trainer creates a test remediation task
    const resRemCreate = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        enrollment_id: ENROLLMENT_A,
        competency_id: COMPETENCY_ID,
        title: 'Latihan Mandiri Steaming Susu & Mikro-Busa',
        instructions: 'Praktikkan texturing susu hingga suhu 60 derajat dan tuang basic heart 5 kali.',
      }),
    });
    const dataRemCreate = await resRemCreate.json();
    const testTaskId = dataRemCreate.task.id;

    // 4.1 Barista lists own remediation tasks
    const res4_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    const data4_1 = await res4_1.json();
    assert(
      res4_1.status === 200 && data4_1.tasks.some((t: any) => t.id === testTaskId),
      '4.1 Barista fetches active remediation task (200 OK)'
    );

    // 4.2 Barista submits practice evidence notes
    const res4_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/remediation`, {
      method: 'POST',
      headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        task_id: testTaskId,
        notes: 'Sudah latihan 5 kali steaming dengan susu segar pasteurisasi, microfoam halus tanpa gelembung besar.',
      }),
    });
    const data4_2 = await res4_2.json();
    assert(
      res4_2.status === 200 && data4_2.task?.status === 'submitted',
      '4.2 Barista submits practice evidence (status: submitted)'
    );

    // 4.3 Database state verification
    const dbTask = await query<{ status: string }>(
      `SELECT status FROM b2b.remediation_tasks WHERE id = $1`,
      [testTaskId]
    );
    assert(
      dbTask.rows.length === 1 && dbTask.rows[0].status === 'submitted',
      '4.3 Remediation task status persisted as submitted in PostgreSQL b2b.remediation_tasks'
    );

  } finally {
    server.close();
    await closeDbPool();
  }

  console.log('===============================================================');
  console.log(` BARISTA APPLICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBaristaSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

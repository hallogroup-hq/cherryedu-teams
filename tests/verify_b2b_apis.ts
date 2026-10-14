import http from 'http';
import { NextRequest } from 'next/server';
import { query, closeDbPool } from '../lib/db';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';

import { GET as getOrganizations } from '../app/api/teams/organizations/route';
import { GET as getOverview } from '../app/api/teams/organizations/[orgId]/overview/route';
import {
  GET as getInvitations,
  POST as postInvitation,
} from '../app/api/teams/organizations/[orgId]/invitations/route';
import {
  GET as getAssessments,
  POST as postAssessment,
} from '../app/api/teams/organizations/[orgId]/assessments/route';
import {
  GET as getOutlets,
  POST as postOutlet,
} from '../app/api/teams/organizations/[orgId]/outlets/route';
import {
  GET as getCohorts,
  POST as postCohort,
} from '../app/api/teams/organizations/[orgId]/cohorts/route';
import { POST as postAcceptInvitation } from '../app/api/teams/invitations/accept/route';

if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
}

const PORT = 3108;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const TENANT_B = 'b0000000-0000-0000-0000-000000000002';
const USER_OWNER_A = '11111111-1111-1111-1111-111111111111';
const USER_HEADBAR_A = '22222222-2222-2222-2222-222222222222';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_SUSPENDED_A = '44444444-4444-4444-4444-444444444444';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';
const USER_TRAINER_UNASSIGNED = '55555555-5555-5555-5555-555555555556';
const USER_ADMIN = '66666666-6666-6666-6666-666666666666';
const USER_OWNER_B = '77777777-7777-7777-7777-777777777777';
const USER_BARISTA_B = '88888888-8888-8888-8888-888888888888';

const COMPETENCY_ID = 'c0000000-0000-0000-0000-000000000001';
const RUBRIC_VERSION_ID = 'f1000000-0000-0000-0000-000000000001';
const ENROLLMENT_ID = 'e0000000-0000-0000-0000-000000000001';

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

        const orgOverviewMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/overview$/);
        const orgInvitationsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/invitations$/);
        const orgAssessmentsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/assessments$/);
        const orgOutletsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/outlets$/);
        const orgCohortsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/cohorts$/);

        if (pathname === '/api/teams/organizations' && req.method === 'GET') {
          nextRes = await getOrganizations(nextReq);
        } else if (pathname === '/api/teams/invitations/accept' && req.method === 'POST') {
          nextRes = await postAcceptInvitation(nextReq);
        } else if (orgOverviewMatch && req.method === 'GET') {
          nextRes = await getOverview(nextReq, { params: Promise.resolve({ orgId: orgOverviewMatch[1] }) });
        } else if (orgInvitationsMatch) {
          nextRes = req.method === 'POST'
            ? await postInvitation(nextReq, { params: Promise.resolve({ orgId: orgInvitationsMatch[1] }) })
            : await getInvitations(nextReq, { params: Promise.resolve({ orgId: orgInvitationsMatch[1] }) });
        } else if (orgAssessmentsMatch) {
          nextRes = req.method === 'POST'
            ? await postAssessment(nextReq, { params: Promise.resolve({ orgId: orgAssessmentsMatch[1] }) })
            : await getAssessments(nextReq, { params: Promise.resolve({ orgId: orgAssessmentsMatch[1] }) });
        } else if (orgOutletsMatch) {
          nextRes = req.method === 'POST'
            ? await postOutlet(nextReq, { params: Promise.resolve({ orgId: orgOutletsMatch[1] }) })
            : await getOutlets(nextReq, { params: Promise.resolve({ orgId: orgOutletsMatch[1] }) });
        } else if (orgCohortsMatch) {
          nextRes = req.method === 'POST'
            ? await postCohort(nextReq, { params: Promise.resolve({ orgId: orgCohortsMatch[1] }) })
            : await getCohorts(nextReq, { params: Promise.resolve({ orgId: orgCohortsMatch[1] }) });
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

async function runB2BApiSuite() {
  console.log('===============================================================');
  console.log('      CHERRY EDU TEAMS — B2B API & PERSISTENCE QA SUITE        ');
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
    console.log('[1. HTTP AUTHENTICATION & RBAC GATES]');
    // -------------------------------------------------------------------------

    // 1.1 Unauthenticated request returns 401
    const res1_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`);
    const data1_1 = await res1_1.json();
    assert(res1_1.status === 401 && data1_1.code === 'UNAUTHENTICATED', '1.1 HTTP GET /overview unauthenticated returns 401');

    // 1.2 Forged Bearer Token returns 401 FORGED_TOKEN
    const res1_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`, {
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature' },
    });
    const data1_2 = await res1_2.json();
    assert(res1_2.status === 401 && data1_2.code === 'FORGED_TOKEN', '1.2 HTTP GET /overview forged token returns 401 FORGED_TOKEN');

    // 1.3 Expired Bearer Token returns 401 EXPIRED_SESSION
    const res1_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`, {
      headers: tokenFor(USER_OWNER_A, -100),
    });
    const data1_3 = await res1_3.json();
    assert(res1_3.status === 401 && data1_3.code === 'EXPIRED_SESSION', '1.3 HTTP GET /overview expired token returns 401 EXPIRED_SESSION');

    // 1.4 Cross-Tenant Violation (Owner A -> Tenant B) returns 403
    const res1_4 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/overview`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data1_4 = await res1_4.json();
    assert(
      res1_4.status === 403 && (data1_4.code === 'CROSS_TENANT_VIOLATION' || data1_4.code === 'UNAUTHORIZED_TENANT_ACCESS'),
      '1.4 HTTP cross-tenant access returns 403'
    );

    // 1.5 Suspended user returns 403 MEMBERSHIP_SUSPENDED
    const res1_5 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`, {
      headers: tokenFor(USER_SUSPENDED_A),
    });
    const data1_5 = await res1_5.json();
    assert(res1_5.status === 403 && data1_5.code === 'MEMBERSHIP_SUSPENDED', '1.5 HTTP suspended user returns 403 MEMBERSHIP_SUSPENDED');

    // 1.6 Unassigned trainer accessing Tenant B returns 403
    const res1_6 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/overview`, {
      headers: tokenFor(USER_TRAINER_UNASSIGNED),
    });
    const data1_6 = await res1_6.json();
    assert(res1_6.status === 403 && data1_6.code === 'UNAUTHORIZED_TENANT_ACCESS', '1.6 Unassigned trainer denied access to unassigned tenant (403)');

    // 1.7 Valid Owner A access returns 200 OK with real organization overview
    const res1_7 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data1_7 = await res1_7.json();
    assert(
      res1_7.status === 200 && data1_7.success === true && data1_7.organization?.display_name === 'Cherry Roastery Flagship',
      '1.7 HTTP valid owner access returns 200 OK with authoritative organization data'
    );

    // -------------------------------------------------------------------------
    console.log('\n[2. INVITATIONS & OBJECT-LEVEL AUTHORIZATION]');
    // -------------------------------------------------------------------------

    // 2.1 Assigned trainer cannot create invitations (403 INSUFFICIENT_PERMISSIONS)
    const res2_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'newbie@cherrycoffee.id', role: 'learner' }),
    });
    const data2_1 = await res2_1.json();
    assert(res2_1.status === 403 && data2_1.code === 'INSUFFICIENT_PERMISSIONS', '2.1 Trainer denied owner invitation privilege (403 INSUFFICIENT_PERMISSIONS)');

    // 2.2 Owner A creates invitation for new employee -> 201 Created and persisted
    const testInviteEmail = `barista.new.${Date.now()}@cherrycoffee.id`;
    const res2_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({ email: testInviteEmail, role: 'learner' }),
    });
    const data2_2 = await res2_2.json();
    assert(res2_2.status === 201 && data2_2.success === true && data2_2.invitation?.email_normalized === testInviteEmail, '2.2 Owner creates invitation (201 Created)');

    // Verify DB persistence of invitation
    const dbInvite = await query<{ status: string }>(
      `SELECT status FROM b2b.invitations WHERE organization_id = $1 AND email_normalized = $2`,
      [TENANT_A, testInviteEmail]
    );
    assert(dbInvite.rows.length === 1 && dbInvite.rows[0].status === 'pending', '2.3 Invitation persisted in PostgreSQL b2b.invitations with status pending');

    // -------------------------------------------------------------------------
    console.log('\n[3. ASSESSMENT AUTHORITY & COMPETENCY ENGINE]');
    // -------------------------------------------------------------------------

    // 3.1 Owner sign-off blocked with 403 UNAUTHORIZED_ASSESSOR
    const res3_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'submit_signoff', enrollment_id: ENROLLMENT_ID }),
    });
    const data3_1 = await res3_1.json();
    assert(res3_1.status === 403 && data3_1.code === 'UNAUTHORIZED_ASSESSOR', '3.1 Owner sign-off blocked with 403 UNAUTHORIZED_ASSESSOR');

    // 3.2 Admin direct sign-off blocked with 403 ADMIN_CANNOT_SIGNOFF
    const res3_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_ADMIN), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'submit_signoff', enrollment_id: ENROLLMENT_ID }),
    });
    const data3_2 = await res3_2.json();
    assert(res3_2.status === 403 && data3_2.code === 'ADMIN_CANNOT_SIGNOFF', '3.2 Admin direct sign-off blocked with 403 ADMIN_CANNOT_SIGNOFF');

    // 3.3 Unassigned Trainer sign-off blocked with 403
    const res3_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_UNASSIGNED), 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'submit_signoff', enrollment_id: ENROLLMENT_ID }),
    });
    const data3_3 = await res3_3.json();
    assert(res3_3.status === 403, '3.3 Unassigned Trainer sign-off blocked with 403');

    // 3.4 Critical failure in rubric results in 422 GATE_FAILED
    const res3_4 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_signoff',
        enrollment_id: ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        rubric_version_id: RUBRIC_VERSION_ID,
        criteria_scores: [
          { criterion_id: 'crit-dose', level: 1, critical_failure: true, notes: 'Portafilter tidak dibilas' },
          { criterion_id: 'crit-tamp', level: 4, critical_failure: false },
          { criterion_id: 'crit-cleanliness', level: 4, critical_failure: false },
        ],
      }),
    });
    const data3_4 = await res3_4.json();
    assert(res3_4.status === 422 && data3_4.code === 'GATE_FAILED', '3.4 Critical failure rejected with 422 GATE_FAILED');

    // 3.5 Valid Assigned Trainer sign-off succeeds (201 Created)
    const res3_5 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_signoff',
        enrollment_id: ENROLLMENT_ID,
        competency_id: COMPETENCY_ID,
        rubric_version_id: RUBRIC_VERSION_ID,
        criteria_scores: [
          { criterion_id: 'crit-dose', level: 3, critical_failure: false, notes: 'Dosing konsisten' },
          { criterion_id: 'crit-tamp', level: 4, critical_failure: false, notes: 'Tamping rata sempurna' },
          { criterion_id: 'crit-cleanliness', level: 3, critical_failure: false, notes: 'Ekstraksi 28 detik ideal' },
        ],
        notes: 'Praktik kalibrasi espresso tuntas memenuhi standar industri.',
      }),
    });
    const data3_5 = await res3_5.json();
    assert(
      res3_5.status === 201 && data3_5.success === true && data3_5.decision === 'competent',
      '3.5 Valid Assigned Trainer sign-off succeeds (201 Created, decision: competent)'
    );

    // 3.6 PostgreSQL persistence verification
    const dbCompStatus = await query<{ state: string }>(
      `SELECT state FROM b2b.competency_status WHERE enrollment_id = $1 AND competency_id = $2`,
      [ENROLLMENT_ID, COMPETENCY_ID]
    );
    assert(
      dbCompStatus.rows.length === 1 && dbCompStatus.rows[0].state === 'competent',
      '3.6 PostgreSQL state updated to competent in b2b.competency_status'
    );

    // 3.7 Barista queries own assessments (200 OK) vs Cross-Tenant Barista (403)
    const res3_7A = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    const data3_7A = await res3_7A.json();
    assert(
      res3_7A.status === 200 && Array.isArray(data3_7A.assessments) && data3_7A.assessments.length > 0,
      '3.7 Barista queries own assessments successfully (200 OK)'
    );

    const res3_7B = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/assessments`, {
      headers: tokenFor(USER_BARISTA_B),
    });
    assert(res3_7B.status === 403, '3.8 Cross-tenant Barista B blocked with 403');

    // -------------------------------------------------------------------------
    console.log('\n[4. OUTLETS & COHORTS API GATES]');
    // -------------------------------------------------------------------------

    // 4.1 Owner creates outlet -> 201 Created and persisted
    const testOutletName = `Outlet Dago Test ${Date.now()}`;
    const res4_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/outlets`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({ name: testOutletName, city: 'Bandung', address: 'Jl. Ir. H. Juanda No. 100' }),
    });
    const data4_1 = await res4_1.json();
    assert(res4_1.status === 201 && data4_1.success === true && data4_1.outlet?.name === testOutletName, '4.1 Owner creates outlet (201 Created)');

    // 4.2 Barista forbidden from creating outlet -> 403 INSUFFICIENT_PERMISSIONS
    const res4_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/outlets`, {
      method: 'POST',
      headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Outlet', city: 'Bandung' }),
    });
    const data4_2 = await res4_2.json();
    assert(res4_2.status === 403 && data4_2.code === 'INSUFFICIENT_PERMISSIONS', '4.2 Barista cannot create outlet (403 INSUFFICIENT_PERMISSIONS)');

    // 4.3 Members can list outlets -> 200 OK
    const res4_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/outlets`, {
      headers: tokenFor(USER_BARISTA_A),
    });
    const data4_3 = await res4_3.json();
    assert(res4_3.status === 200 && Array.isArray(data4_3.outlets) && data4_3.outlets.length > 0, '4.3 Members can list outlets (200 OK)');

    // 4.4 Cross-tenant outlet access forbidden -> 403
    const res4_4 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/outlets`, {
      headers: tokenFor(USER_OWNER_A),
    });
    assert(res4_4.status === 403, '4.4 Cross-tenant outlet access forbidden (403)');

    // 4.5 Owner lists cohorts -> 200 OK
    const res4_5 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/cohorts`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data4_5 = await res4_5.json();
    assert(res4_5.status === 200 && Array.isArray(data4_5.cohorts), '4.5 Owner lists cohorts (200 OK)');

    // -------------------------------------------------------------------------
    console.log('\n[5. INVITATION ACCEPTANCE & MEMBERSHIP LIFECYCLE]');
    // -------------------------------------------------------------------------

    // 5.1 Invalid invitation token -> 404 INVITATION_NOT_FOUND
    const res5_1 = await fetch(`${BASE_URL}/api/teams/invitations/accept`, {
      method: 'POST',
      headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'bogus-token-12345' }),
    });
    const data5_1 = await res5_1.json();
    assert(res5_1.status === 404 && data5_1.code === 'INVITATION_NOT_FOUND', '5.1 Invalid token rejected (404 INVITATION_NOT_FOUND)');

    // 5.2 Valid token acceptance by invited user -> 200 OK with role learner
    const testAcceptEmail = `learner.accept.${Date.now()}@cherrycoffee.id`;
    const resInvite = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({ email: testAcceptEmail, role: 'learner' }),
    });
    const inviteData = await resInvite.json();
    const rawInviteToken = inviteData.token;

    // A new user UUID
    const USER_NEW_ACCEPTEE = '99999999-9999-9999-9999-999999999999';
    // Ensure test user exists in auth.users
    await query(
      `INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [USER_NEW_ACCEPTEE, testAcceptEmail]
    );

    const res5_2 = await fetch(`${BASE_URL}/api/teams/invitations/accept`, {
      method: 'POST',
      headers: { ...tokenFor(USER_NEW_ACCEPTEE), 'content-type': 'application/json' },
      body: JSON.stringify({ token: rawInviteToken }),
    });
    const data5_2 = await res5_2.json();
    assert(
      res5_2.status === 200 && data5_2.success === true && data5_2.role === 'learner',
      '5.2 Valid token acceptance succeeds (200 OK, role: learner)'
    );

    // 5.3 PostgreSQL persistence verification of accepted membership
    const dbNewMember = await query<{ status: string }>(
      `SELECT status FROM b2b.organization_memberships WHERE organization_id = $1 AND user_id = $2`,
      [TENANT_A, USER_NEW_ACCEPTEE]
    );
    assert(
      dbNewMember.rows.length === 1 && dbNewMember.rows[0].status === 'active',
      '5.3 Membership is active in PostgreSQL b2b.organization_memberships'
    );

    // 5.4 Re-accepting used invitation fails -> 400 INVITATION_ALREADY_USED
    const res5_4 = await fetch(`${BASE_URL}/api/teams/invitations/accept`, {
      method: 'POST',
      headers: { ...tokenFor(USER_NEW_ACCEPTEE), 'content-type': 'application/json' },
      body: JSON.stringify({ token: rawInviteToken }),
    });
    const data5_4 = await res5_4.json();
    assert(
      res5_4.status === 400 && data5_4.code === 'INVITATION_ALREADY_USED',
      '5.4 Re-accepting used invitation fails (400 INVITATION_ALREADY_USED)'
    );

  } finally {
    server.close();
    await closeDbPool();
  }

  console.log('===============================================================');
  console.log(` B2B API QA RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runB2BApiSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

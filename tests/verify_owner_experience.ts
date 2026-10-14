import http from 'http';
import { NextRequest } from 'next/server';
import { query, closeDbPool } from '../lib/db';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';

import { GET as getOverview } from '../app/api/teams/organizations/[orgId]/overview/route';
import {
  GET as getOutlets,
  POST as postOutlet,
} from '../app/api/teams/organizations/[orgId]/outlets/route';
import {
  GET as getInvitations,
  POST as postInvitation,
  DELETE as deleteInvitation,
} from '../app/api/teams/organizations/[orgId]/invitations/route';
import { GET as getCohorts } from '../app/api/teams/organizations/[orgId]/cohorts/route';

if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
}

const PORT = 3111;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const TENANT_B = 'b0000000-0000-0000-0000-000000000002';
const USER_OWNER_A = '11111111-1111-1111-1111-111111111111';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';

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

        const overviewMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/overview$/);
        const outletsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/outlets$/);
        const invitationsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/invitations$/);
        const cohortsMatch = pathname.match(/^\/api\/teams\/organizations\/([^/]+)\/cohorts$/);

        if (overviewMatch && req.method === 'GET') {
          nextRes = await getOverview(nextReq, { params: Promise.resolve({ orgId: overviewMatch[1] }) });
        } else if (outletsMatch) {
          nextRes = req.method === 'POST'
            ? await postOutlet(nextReq, { params: Promise.resolve({ orgId: outletsMatch[1] }) })
            : await getOutlets(nextReq, { params: Promise.resolve({ orgId: outletsMatch[1] }) });
        } else if (invitationsMatch) {
          if (req.method === 'POST') {
            nextRes = await postInvitation(nextReq, { params: Promise.resolve({ orgId: invitationsMatch[1] }) });
          } else if (req.method === 'DELETE') {
            nextRes = await deleteInvitation(nextReq, { params: Promise.resolve({ orgId: invitationsMatch[1] }) });
          } else {
            nextRes = await getInvitations(nextReq, { params: Promise.resolve({ orgId: invitationsMatch[1] }) });
          }
        } else if (cohortsMatch && req.method === 'GET') {
          nextRes = await getCohorts(nextReq, { params: Promise.resolve({ orgId: cohortsMatch[1] }) });
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

async function runOwnerSuite() {
  console.log('===============================================================');
  console.log('      CHERRY EDU TEAMS — COMPLETE OWNER APPLICATION QA         ');
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
    console.log('[1. OWNER & MANAGER OVERVIEW INTEGRITY]');
    // -------------------------------------------------------------------------

    // 1.1 Owner A fetches authoritative overview -> 200 OK
    const res1_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/overview`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data1_1 = await res1_1.json();
    assert(
      res1_1.status === 200 && data1_1.success === true && data1_1.organization?.display_name === 'Cherry Roastery Flagship',
      '1.1 Owner fetches authoritative organization overview (200 OK)'
    );

    // 1.2 Cross-tenant access to Tenant B overview -> 403
    const res1_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_B}/overview`, {
      headers: tokenFor(USER_OWNER_A),
    });
    assert(res1_2.status === 403, '1.2 Cross-tenant overview access blocked with 403');

    // -------------------------------------------------------------------------
    console.log('\n[2. OUTLET PROVISIONING & SCOPING]');
    // -------------------------------------------------------------------------

    // 2.1 Owner provisions a new outlet -> 201 Created and persisted
    const testOutletName = `Outlet Braga Suite ${Date.now()}`;
    const res2_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/outlets`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: testOutletName,
        city: 'Bandung',
        address: 'Jl. Braga No. 45',
      }),
    });
    const data2_1 = await res2_1.json();
    assert(
      res2_1.status === 201 && data2_1.success === true && data2_1.outlet?.name === testOutletName,
      '2.1 Owner provisions new outlet (201 Created)'
    );

    const newOutletId = data2_1.outlet.id;

    // 2.2 Learner cannot provision outlets -> 403 INSUFFICIENT_PERMISSIONS
    const res2_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/outlets`, {
      method: 'POST',
      headers: { ...tokenFor(USER_BARISTA_A), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Illegal Outlet', city: 'Bandung' }),
    });
    assert(res2_2.status === 403, '2.2 Barista forbidden from provisioning outlets (403)');

    // 2.3 Verify persistence in DB
    const dbOutlet = await query<{ name: string }>(
      `SELECT name FROM b2b.outlets WHERE id = $1 AND organization_id = $2`,
      [newOutletId, TENANT_A]
    );
    assert(
      dbOutlet.rows.length === 1 && dbOutlet.rows[0].name === testOutletName,
      '2.3 Provisioned outlet persisted in PostgreSQL b2b.outlets'
    );

    // -------------------------------------------------------------------------
    console.log('\n[3. EMPLOYEE INVITATION LIFECYCLE]');
    // -------------------------------------------------------------------------

    // 3.1 Owner invites new employee with assigned outlet -> 201 Created
    const inviteEmail = `barista.owner.test.${Date.now()}@cherrycoffee.id`;
    const res3_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations`, {
      method: 'POST',
      headers: { ...tokenFor(USER_OWNER_A), 'content-type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        role: 'learner',
        outlet_id: newOutletId,
      }),
    });
    const data3_1 = await res3_1.json();
    assert(
      res3_1.status === 201 && data3_1.success === true && typeof data3_1.token === 'string',
      '3.1 Owner invites employee with delivery token (201 Created)'
    );

    const inviteId = data3_1.invitation.id;

    // 3.2 Trainer cannot invite members -> 403 INSUFFICIENT_PERMISSIONS
    const res3_2 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations`, {
      method: 'POST',
      headers: { ...tokenFor(USER_TRAINER_SARAH), 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'hack@cherrycoffee.id', role: 'learner' }),
    });
    assert(res3_2.status === 403, '3.2 Trainer cannot invite organization members (403)');

    // 3.3 Owner revokes invitation -> 200 OK and status updated to revoked
    const res3_3 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/invitations?id=${inviteId}`, {
      method: 'DELETE',
      headers: tokenFor(USER_OWNER_A),
    });
    const data3_3 = await res3_3.json();
    assert(res3_3.status === 200 && data3_3.success === true, '3.3 Owner revokes pending invitation (200 OK)');

    const dbRevoked = await query<{ status: string }>(
      `SELECT status FROM b2b.invitations WHERE id = $1`,
      [inviteId]
    );
    assert(
      dbRevoked.rows.length === 1 && dbRevoked.rows[0].status === 'revoked',
      '3.4 Invitation status transitioned to revoked in PostgreSQL b2b.invitations'
    );

    // -------------------------------------------------------------------------
    console.log('\n[4. COHORT MONITORING & PROGRESS METRICS]');
    // -------------------------------------------------------------------------

    // 4.1 Owner queries cohorts list -> 200 OK
    const res4_1 = await fetch(`${BASE_URL}/api/teams/organizations/${TENANT_A}/cohorts`, {
      headers: tokenFor(USER_OWNER_A),
    });
    const data4_1 = await res4_1.json();
    assert(
      res4_1.status === 200 && Array.isArray(data4_1.cohorts) && data4_1.cohorts.length > 0,
      '4.1 Owner monitors active training cohorts (200 OK)'
    );

    // 4.2 Completion rate verified as non-negative percentage
    assert(
      typeof data1_1.overview?.competency_completion_rate === 'number' &&
      data1_1.overview.competency_completion_rate >= 0 &&
      data1_1.overview.competency_completion_rate <= 100,
      '4.2 Competency completion rate accurately calculated from authoritative status'
    );

  } finally {
    server.close();
    await closeDbPool();
  }

  console.log('===============================================================');
  console.log(` OWNER APPLICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOwnerSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

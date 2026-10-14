/**
 * verify_admin_experience.ts
 * GATE 8 — Platform Admin test suite
 * Port: 3113
 */

import http from 'http';
import { createServer } from 'http';
import next from 'next';
import { createSignedToken } from './helpers/testAuth';
import { Pool } from 'pg';

// Set env before importing app modules
process.env.SUPABASE_JWT_SECRET = 'cherryedu-staging-auth-jwt-secret-secure-key-2026';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://akmalirsyadpermana@localhost:5432/cherryedu_staging_db';

const PORT = 3113;

// Seeded test UUIDs (must match seed data)
const USER_PLATFORM_ADMIN = '66666666-6666-6666-6666-666666666666';
const USER_BARISTA_A = '33333333-3333-3333-3333-333333333333';
const USER_OWNER_A = '11111111-1111-1111-1111-111111111111';
const USER_TRAINER_SARAH = '55555555-5555-5555-5555-555555555555';
const TENANT_A = 'a0000000-0000-0000-0000-000000000001';
const PROGRAM_ID = 'd0000000-0000-0000-0000-000000000001';
const COHORT_A = 'c1000000-0000-0000-0000-000000000001';

// Tokens
const adminToken = createSignedToken({ sub: USER_PLATFORM_ADMIN });
const baristaToken = createSignedToken({ sub: USER_BARISTA_A });
const ownerToken = createSignedToken({ sub: USER_OWNER_A });
const trainerToken = createSignedToken({ sub: USER_TRAINER_SARAH });

type TestResult = { name: string; passed: boolean; detail?: string };
const results: TestResult[] = [];
let onboardedOrgId: string | null = null;
let createdAssignmentId: string | null = null;
let newTrainerAssignmentCohortId: string | null = null;

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  token: string | null,
  body?: object
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: raw });
        }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function pass(name: string) {
  results.push({ name, passed: true });
  console.log(`  ✓ ${name}`);
}

function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail });
  console.log(`  ✗ ${name}`);
  console.log(`    → ${detail}`);
}

// ── Test Cases ─────────────────────────────────────────────────────────────

async function testBaristaBlockedFromDashboard() {
  const name = 'Barista blocked from admin dashboard (403)';
  try {
    const r = await req('GET', '/api/teams/admin/dashboard', baristaToken);
    if (r.status === 403 && r.data.code === 'FORBIDDEN_NOT_ADMIN') pass(name);
    else fail(name, `Expected 403 FORBIDDEN_NOT_ADMIN, got ${r.status} ${r.data.code}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testOwnerBlockedFromDashboard() {
  const name = 'Owner blocked from admin dashboard (403)';
  try {
    const r = await req('GET', '/api/teams/admin/dashboard', ownerToken);
    if (r.status === 403 && r.data.code === 'FORBIDDEN_NOT_ADMIN') pass(name);
    else fail(name, `Expected 403 FORBIDDEN_NOT_ADMIN, got ${r.status} ${r.data.code}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testTrainerBlockedFromDashboard() {
  const name = 'Trainer blocked from admin dashboard (403)';
  try {
    const r = await req('GET', '/api/teams/admin/dashboard', trainerToken);
    if (r.status === 403 && r.data.code === 'FORBIDDEN_NOT_ADMIN') pass(name);
    else fail(name, `Expected 403 FORBIDDEN_NOT_ADMIN, got ${r.status} ${r.data.code}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testUnauthenticatedBlockedFromDashboard() {
  const name = 'Unauthenticated request blocked (401)';
  try {
    const r = await req('GET', '/api/teams/admin/dashboard', null);
    if (r.status === 401) pass(name);
    else fail(name, `Expected 401, got ${r.status}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminDashboardOverview() {
  const name = 'Admin fetches dashboard overview (200 OK, correct shape)';
  try {
    const r = await req('GET', '/api/teams/admin/dashboard', adminToken);
    if (
      r.status === 200 &&
      r.data.success === true &&
      typeof r.data.overview?.organizations?.total === 'number' &&
      typeof r.data.overview?.cohorts?.total === 'number' &&
      typeof r.data.overview?.learners?.active === 'number' &&
      Array.isArray(r.data.recent_audit_events)
    ) {
      pass(name);
    } else {
      fail(name, `Unexpected response: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminListOrganizations() {
  const name = 'Admin lists all organisations (200 OK)';
  try {
    const r = await req('GET', '/api/teams/admin/organizations', adminToken);
    if (r.status === 200 && Array.isArray(r.data.organizations) && r.data.organizations.length > 0) {
      pass(name);
    } else {
      fail(name, `Expected orgs array with items, got: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminOnboardOrganization() {
  const name = 'Admin onboards new client org (201 Created, persisted)';
  const slug = `test-admin-org-${Date.now()}`;
  try {
    const r = await req('POST', '/api/teams/admin/organizations', adminToken, {
      display_name: 'Test Admin Org',
      legal_name: 'PT Test Admin Indonesia',
      business_category: 'cafe',
      slug,
      timezone: 'Asia/Jakarta',
    });
    if (r.status === 201 && r.data.success && r.data.organization?.id) {
      onboardedOrgId = r.data.organization.id;

      // Verify persisted in DB
      const verify = await req('GET', '/api/teams/admin/organizations', adminToken);
      const found = verify.data.organizations?.find((o: any) => o.id === onboardedOrgId);
      if (found) pass(name);
      else fail(name, 'Org created but not found in list');
    } else {
      fail(name, `Expected 201, got ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminOnboardDuplicateSlugConflict() {
  const name = 'Admin onboarding with duplicate slug returns 409 SLUG_CONFLICT';
  try {
    // cherry-flagship is the seeded TENANT_A slug — guaranteed to exist
    const r = await req('POST', '/api/teams/admin/organizations', adminToken, {
      display_name: 'Duplicate Slug Org',
      slug: 'cherry-flagship',
      timezone: 'Asia/Jakarta',
    });
    if (r.status === 409 && r.data.code === 'SLUG_CONFLICT') pass(name);
    else fail(name, `Expected 409 SLUG_CONFLICT, got ${r.status} ${JSON.stringify(r.data.code)}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminSuspendOrganization() {
  const name = 'Admin suspends an organisation (status: suspended)';
  if (!onboardedOrgId) {
    fail(name, 'Skipped: no onboarded org from previous test');
    return;
  }
  try {
    const r = await req('PATCH', `/api/teams/admin/organizations/${onboardedOrgId}/status`, adminToken, {
      status: 'suspended',
      reason: 'automated gate test',
    });
    if (r.status === 200 && r.data.organization?.status === 'suspended') {
      pass(name);
    } else {
      fail(name, `Expected suspended, got ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminViewPrograms() {
  const name = 'Admin views program catalog (200 OK, programs present)';
  try {
    const r = await req('GET', '/api/teams/admin/programs', adminToken);
    if (r.status === 200 && Array.isArray(r.data.programs) && r.data.programs.length > 0) {
      pass(name);
    } else {
      fail(name, `Expected programs array, got: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminCreateProgramVersion() {
  const name = 'Admin creates new program version (201 Created, version_no incremented)';
  try {
    // Get current max
    const progList = await req('GET', '/api/teams/admin/programs', adminToken);
    const prog = progList.data.programs?.find((p: any) => p.id === PROGRAM_ID);
    const prevMax = parseInt(prog?.latest_version_no ?? '0');

    const r = await req('POST', `/api/teams/admin/programs/${PROGRAM_ID}/versions`, adminToken, {});
    if (r.status === 201 && r.data.program_version?.version_no > prevMax) {
      pass(name);
    } else {
      fail(name, `Expected 201 with incremented version, got ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminListTrainerAssignments() {
  const name = 'Admin views trainer assignments (200 OK)';
  try {
    const r = await req('GET', '/api/teams/admin/trainer-assignments', adminToken);
    if (r.status === 200 && Array.isArray(r.data.assignments)) pass(name);
    else fail(name, `Expected 200 with assignments array, got ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminAssignTrainerToNewCohort() {
  const name = 'Admin assigns trainer to cohort (201 Created, persisted)';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // Create a temporary cohort under TENANT_A with PROGRAM_VERSION_ID d1000000-...
    const PROGRAM_VERSION_ID = 'd1000000-0000-0000-0000-000000000001';
    const cohortRes = await pool.query(
      `INSERT INTO b2b.cohorts (organization_id, program_version_id, name, status, start_at, end_at)
       VALUES ($1::uuid, $2::uuid, 'Admin Test Cohort', 'active', NOW(), NOW() + INTERVAL '60 days')
       RETURNING id::text`,
      [TENANT_A, PROGRAM_VERSION_ID]
    );
    const testCohortId = cohortRes.rows[0].id;
    newTrainerAssignmentCohortId = testCohortId;

    const r = await req('POST', '/api/teams/admin/trainer-assignments', adminToken, {
      organization_id: TENANT_A,
      cohort_id: testCohortId,
      trainer_user_id: USER_TRAINER_SARAH,
      role: 'lead',
    });

    if (r.status === 201 && r.data.assignment?.id) {
      createdAssignmentId = r.data.assignment.id;

      // Verify persisted
      const verify = await req('GET', '/api/teams/admin/trainer-assignments', adminToken);
      const found = verify.data.assignments?.find((a: any) => a.id === createdAssignmentId);
      if (found) pass(name);
      else fail(name, 'Assignment created but not found in list');
    } else {
      fail(name, `Expected 201, got ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) {
    fail(name, e.message);
  } finally {
    await pool.end();
  }
}

async function testAdminAssignTrainerDuplicate() {
  const name = 'Admin duplicate trainer assignment returns 409 DUPLICATE_ASSIGNMENT';
  if (!createdAssignmentId || !newTrainerAssignmentCohortId) {
    fail(name, 'Skipped: no assignment from previous test');
    return;
  }
  try {
    const r = await req('POST', '/api/teams/admin/trainer-assignments', adminToken, {
      organization_id: TENANT_A,
      cohort_id: newTrainerAssignmentCohortId,
      trainer_user_id: USER_TRAINER_SARAH,
      role: 'assessor',
    });
    if (r.status === 409 && r.data.code === 'DUPLICATE_ASSIGNMENT') pass(name);
    else fail(name, `Expected 409 DUPLICATE_ASSIGNMENT, got ${r.status} ${r.data.code}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminViewAuditEvents() {
  const name = 'Admin views audit event trail (200 OK, events present)';
  try {
    const r = await req('GET', '/api/teams/admin/audit-events', adminToken);
    if (
      r.status === 200 &&
      Array.isArray(r.data.events) &&
      r.data.events.length > 0 &&
      typeof r.data.pagination?.total === 'number'
    ) {
      pass(name);
    } else {
      fail(name, `Expected events, got: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminAuditEventsFilteredByOrg() {
  const name = 'Admin filters audit events by organization_id (200 OK, relevant only)';
  try {
    const r = await req('GET', `/api/teams/admin/audit-events?organization_id=${TENANT_A}`, adminToken);
    if (r.status === 200 && Array.isArray(r.data.events)) {
      const mismatch = r.data.events.find((e: any) => e.organization_id && e.organization_id !== TENANT_A);
      if (!mismatch) pass(name);
      else fail(name, `Found event for wrong org: ${JSON.stringify(mismatch)}`);
    } else {
      fail(name, `Expected 200 with events, got ${r.status}`);
    }
  } catch (e: any) { fail(name, e.message); }
}

async function testAdminCannotSignOffCompetency() {
  const name = 'Admin cannot sign off competency (403 ADMIN_CANNOT_SIGNOFF)';
  const ENROLLMENT_A = 'e0000000-0000-0000-0000-000000000001';
  const COMPETENCY_ID = 'c0000000-0000-0000-0000-000000000001';
  try {
    const r = await req(
      'POST',
      `/api/teams/organizations/${TENANT_A}/assessments`,
      adminToken,
      {
        type: 'sign_off',
        enrollment_id: ENROLLMENT_A,
        competency_id: COMPETENCY_ID,
        decision: 'competent',
        notes: 'Admin bypass attempt',
      }
    );
    if (r.status === 403 && r.data.code === 'ADMIN_CANNOT_SIGNOFF') pass(name);
    else fail(name, `Expected 403 ADMIN_CANNOT_SIGNOFF, got ${r.status} ${r.data.code}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testNonAdminBlockedFromOrgs() {
  const name = 'Non-admin blocked from admin organizations list (403)';
  try {
    const r = await req('GET', '/api/teams/admin/organizations', baristaToken);
    if (r.status === 403) pass(name);
    else fail(name, `Expected 403, got ${r.status}`);
  } catch (e: any) { fail(name, e.message); }
}

async function testNonAdminBlockedFromAudit() {
  const name = 'Non-admin blocked from audit events (403)';
  try {
    const r = await req('GET', '/api/teams/admin/audit-events', ownerToken);
    if (r.status === 403) pass(name);
    else fail(name, `Expected 403, got ${r.status}`);
  } catch (e: any) { fail(name, e.message); }
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function runAll() {
  console.log('\n=== GATE 8 — Platform Admin Test Suite ===\n');

  // Non-admin access controls
  console.log('--- Access Control ---');
  await testBaristaBlockedFromDashboard();
  await testOwnerBlockedFromDashboard();
  await testTrainerBlockedFromDashboard();
  await testUnauthenticatedBlockedFromDashboard();
  await testNonAdminBlockedFromOrgs();
  await testNonAdminBlockedFromAudit();

  // Admin positive paths
  console.log('\n--- Admin Operations ---');
  await testAdminDashboardOverview();
  await testAdminListOrganizations();
  await testAdminOnboardOrganization();
  await testAdminOnboardDuplicateSlugConflict();
  await testAdminSuspendOrganization();
  await testAdminViewPrograms();
  await testAdminCreateProgramVersion();
  await testAdminListTrainerAssignments();
  await testAdminAssignTrainerToNewCohort();
  await testAdminAssignTrainerDuplicate();
  await testAdminViewAuditEvents();
  await testAdminAuditEventsFilteredByOrg();

  // Business rule enforcement
  console.log('\n--- Business Rule Enforcement ---');
  await testAdminCannotSignOffCompetency();

  console.log('\n=== Results ===');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  results.forEach((r) => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  });
  console.log(`\n${passed}/${total} tests passed`);

  if (passed !== total) {
    process.exit(1);
  }
}

// ── Server bootstrap ────────────────────────────────────────────────────────

async function main() {
  const app = next({ dev: false, dir: process.cwd() });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((req, res) => {
    handle(req as any, res as any);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, (err?: Error) => (err ? reject(err) : resolve()));
  });

  console.log(`Test server listening on port ${PORT}`);

  try {
    await runAll();
  } finally {
    server.close();
    process.exit(results.every((r) => r.passed) ? 0 : 1);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

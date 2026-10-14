/**
 * Cherry Edu Teams — Foundation Verification & Security Assertion Suite
 * Tests:
 * 1. Multi-Tenant Isolation (Tenant A vs Tenant B)
 * 2. Inactive / Suspended Membership Rejection
 * 3. Assessor Authority Checks
 * 4. Competency Engine: Rejection of Artificial Progress (Online-only != Competent)
 * 5. Practical Assessment Critical Failure Triggers Remedial
 */

import {
  assertMembership,
  assertTenantIsolation,
  assertSignoffAuthority,
  assertObservationAuthority,
  assertAdminCorrectionAuthority,
  AuthorizationError,
} from '../lib/authz';
import { evaluateCompetency } from '../lib/competencyEngine';
import { UserAuthContext, PracticalAssessment } from '../lib/types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

console.log('=== RUNNING CHERRY EDU TEAMS FOUNDATION TESTS ===\n');

// -------------------------------------------------------------------------
// Test 1: Cross-Tenant Isolation
// -------------------------------------------------------------------------
console.log('Test Group 1: Multi-Tenant Isolation');
{
  const orgA = 'org-coffee-shop-a';
  const orgB = 'org-coffee-shop-b';

  let caughtError: AuthorizationError | null = null;
  try {
    assertTenantIsolation(orgA, orgB);
  } catch (err: any) {
    caughtError = err;
  }

  assert(
    caughtError !== null && caughtError.code === 'CROSS_TENANT_VIOLATION',
    'assertTenantIsolation blocks access between Org A and Org B'
  );

  let success = false;
  try {
    assertTenantIsolation(orgA, orgA);
    success = true;
  } catch (err) {
    success = false;
  }
  assert(success, 'assertTenantIsolation allows access within the same Org A');
}

// -------------------------------------------------------------------------
// Test 2: Inactive Membership Rejection
// -------------------------------------------------------------------------
console.log('\nTest Group 2: Membership Status & Role Enforcement');
{
  const suspendedUser: UserAuthContext = {
    userId: 'user-001',
    email: 'barista@outlet.id',
    fullName: 'Barista Suspended',
    staffPermissions: [],
    activeMembership: {
      id: 'mem-001',
      organization_id: 'org-coffee-shop-a',
      user_id: 'user-001',
      status: 'suspended',
      created_at: new Date().toISOString(),
      roles: ['learner'],
    },
  };

  let caughtError: AuthorizationError | null = null;
  try {
    assertMembership(suspendedUser, 'org-coffee-shop-a', ['learner']);
  } catch (err: any) {
    caughtError = err;
  }

  assert(
    caughtError !== null && caughtError.code === 'MEMBERSHIP_INACTIVE',
    'Suspended membership is blocked from accessing workspace'
  );
}

// -------------------------------------------------------------------------
// Test 3: Assessor Authority Enforcement (Decision 2)
// -------------------------------------------------------------------------
console.log('\nTest Group 3: Assessor Authority Enforcement (Decision 2)');
{
  const headBar: UserAuthContext = {
    userId: 'user-headbar-01',
    email: 'headbar@kopiruang.id',
    fullName: 'Head Bar Dani',
    staffPermissions: [],
    activeMembership: {
      id: 'mem-hb-01',
      organization_id: 'org-kopi-ruang',
      user_id: 'user-headbar-01',
      status: 'active',
      created_at: new Date().toISOString(),
      roles: ['head_bar'],
    },
  };

  // 3a. Head Bar has observation authority
  let observationAllowed = false;
  try {
    const { assertObservationAuthority } = require('../lib/authz');
    assertObservationAuthority(headBar, headBar.activeMembership!);
    observationAllowed = true;
  } catch (err) {
    observationAllowed = false;
  }
  assert(observationAllowed, 'Client Head Bar is authorized to observe & evaluate');

  // 3b. Head Bar WITHOUT delegation is blocked from final competency signoff
  let signoffError: AuthorizationError | null = null;
  try {
    assertSignoffAuthority(headBar, { isAssignedTrainer: false, isDelegatedAssessor: false });
  } catch (err: any) {
    signoffError = err;
  }
  assert(
    signoffError !== null && signoffError.code === 'UNAUTHORIZED_ASSESSOR',
    'Client Head Bar without delegation CANNOT execute final signoff'
  );

  // 3c. Platform Admin CANNOT execute final signoff directly
  const platformAdmin: UserAuthContext = {
    userId: 'user-admin-01',
    email: 'admin@cherryedu.id',
    fullName: 'Admin Cherry',
    staffPermissions: ['platform_admin'],
  };
  let adminSignoffError: AuthorizationError | null = null;
  try {
    assertSignoffAuthority(platformAdmin, { isAssignedTrainer: false });
  } catch (err: any) {
    adminSignoffError = err;
  }
  assert(
    adminSignoffError !== null && adminSignoffError.code === 'ADMIN_CANNOT_SIGNOFF',
    'Platform Admin is strictly NOT authorized to pass participants directly'
  );

  // 3d. Platform Admin CAN perform administrative correction with audit reason
  let adminCorrectionAllowed = false;
  try {
    const { assertAdminCorrectionAuthority } = require('../lib/authz');
    assertAdminCorrectionAuthority(platformAdmin, 'Perbaikan administratif hasil re-evaluasi resmi nomor audit #1042');
    adminCorrectionAllowed = true;
  } catch {
    adminCorrectionAllowed = false;
  }
  assert(adminCorrectionAllowed, 'Platform Admin can perform administrative corrections with valid reason');

  // 3e. Cherry Trainer IS authorized to sign off for assigned cohort
  const cherryTrainer: UserAuthContext = {
    userId: 'user-trainer-01',
    email: 'trainer@cherryedu.id',
    fullName: 'Trainer Cherry',
    staffPermissions: ['cherry_trainer'],
  };
  const result = assertSignoffAuthority(cherryTrainer, { isAssignedTrainer: true });
  assert(
    result.assessorType === 'cherry_trainer',
    'Cherry Edu Trainer assigned to cohort is fully authorized for final signoff'
  );
}

// -------------------------------------------------------------------------
// Test 4: Pedagogical Competency Gates (Anti-Artificial Progress)
// -------------------------------------------------------------------------
console.log('\nTest Group 4: Competency Gate & Pedagogical Rule Verification');
{
  // Scenario A: Online lesson complete, but NO practical assessment
  const resA = evaluateCompetency({
    competencyId: 'comp-espresso-dialin',
    hasCompletedOnlineLessons: true,
    latestAssessment: null,
  });

  assert(
    resA.state === 'awaiting_assessment' && !resA.isEligibleForSignoff,
    'Online lesson completion alone NEVER passes competency (State = awaiting_assessment)'
  );

  // Scenario B: Practical assessment had CRITICAL FAILURE
  const assessmentCriticalFail: PracticalAssessment = {
    id: 'as-01',
    organization_id: 'org-kopi-ruang',
    enrollment_id: 'en-01',
    competency_id: 'comp-espresso-dialin',
    rubric_version_id: 'rub-v1',
    assessor_user_id: 'trainer-01',
    status: 'submitted',
    attempt_no: 1,
    idempotency_key: 'idemp-01',
    started_at: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    criterion_results: [
      {
        id: 'cr-01',
        assessment_id: 'as-01',
        criterion_id: 'crit-01',
        level: 3,
        critical_failure: false,
        entered_at: new Date().toISOString(),
      },
      {
        id: 'cr-02',
        assessment_id: 'as-01',
        criterion_id: 'crit-02',
        level: 1,
        critical_failure: true, // e.g. Portafilter safety violation
        notes: 'Mengoperasikan steam wand tanpa purge dan tidak aman',
        entered_at: new Date().toISOString(),
      },
    ],
  };

  const resB = evaluateCompetency({
    competencyId: 'comp-espresso-dialin',
    hasCompletedOnlineLessons: true,
    latestAssessment: assessmentCriticalFail,
  });

  assert(
    resB.state === 'needs_practice',
    'Critical failure forces state to needs_practice and blocks competency'
  );

  // Scenario C: Passing criteria & signed off by authorized assessor
  const assessmentPassed: PracticalAssessment = {
    ...assessmentCriticalFail,
    criterion_results: [
      {
        id: 'cr-01',
        assessment_id: 'as-01',
        criterion_id: 'crit-01',
        level: 4,
        critical_failure: false,
        entered_at: new Date().toISOString(),
      },
      {
        id: 'cr-02',
        assessment_id: 'as-01',
        criterion_id: 'crit-02',
        level: 3,
        critical_failure: false,
        entered_at: new Date().toISOString(),
      },
    ],
    signoff: {
      decision: 'competent',
      signed_by: 'trainer-01',
      assessor_type: 'cherry_trainer',
      signed_at: new Date().toISOString(),
    },
  };

  const resC = evaluateCompetency({
    competencyId: 'comp-espresso-dialin',
    hasCompletedOnlineLessons: true,
    latestAssessment: assessmentPassed,
  });

  assert(
    resC.state === 'competent',
    'Competency is granted ONLY when online theory, rubric threshold, and official signoff are complete'
  );
}

console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);

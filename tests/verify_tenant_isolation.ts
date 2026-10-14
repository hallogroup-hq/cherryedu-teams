import { assertMembership, assertTenantIsolation, assertOutletScope, AuthorizationError } from '../lib/authz';
import { UserAuthContext } from '../lib/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, title: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${title}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${title}`);
  }
}

console.log('=== CHERRY EDU TEAMS — TENANT ISOLATION SUITE ===\n');

const userA: UserAuthContext = {
  userId: 'user-a-owner',
  email: 'owner@shopa.test',
  fullName: 'Owner Shop A',
  activeOrganizationId: 'org-shop-a',
  staffPermissions: [],
  activeMembership: {
    id: 'mem-a',
    organization_id: 'org-shop-a',
    user_id: 'user-a-owner',
    status: 'active',
    roles: ['owner'],
    created_at: new Date().toISOString(),
  },
};

// 1. Cross-Tenant Rejection
let crossTenantBlocked = false;
try {
  assertTenantIsolation(userA.activeOrganizationId!, 'org-shop-b');
} catch (err: any) {
  crossTenantBlocked = err instanceof AuthorizationError && err.code === 'CROSS_TENANT_VIOLATION';
}
assert(crossTenantBlocked, '1.1 Cross-tenant access between Org A and Org B blocked (CROSS_TENANT_VIOLATION)');

// 2. Same-Tenant Allowed
let sameTenantAllowed = false;
try {
  assertTenantIsolation(userA.activeOrganizationId!, 'org-shop-a');
  sameTenantAllowed = true;
} catch {
  sameTenantAllowed = false;
}
assert(sameTenantAllowed, '1.2 Same-tenant access within Org A is permitted');

// 3. Suspended Membership
const userSuspended: UserAuthContext = {
  ...userA,
  activeMembership: {
    ...userA.activeMembership!,
    status: 'suspended',
  },
};
let suspendedBlocked = false;
try {
  assertMembership(userSuspended, 'org-shop-a');
} catch (err: any) {
  suspendedBlocked = err instanceof AuthorizationError && err.code === 'MEMBERSHIP_INACTIVE';
}
assert(suspendedBlocked, '1.3 Suspended user blocked with MEMBERSHIP_INACTIVE');

// 4. Outlet Scope Restrictions
const userBaristaLimited: UserAuthContext = {
  ...userA,
  activeMembership: {
    ...userA.activeMembership!,
    roles: ['learner'],
    outlet_scopes: ['outlet-dago'],
  },
};
let outletScopeBlocked = false;
try {
  assertOutletScope(userBaristaLimited.activeMembership!, 'outlet-braga');
} catch (err: any) {
  outletScopeBlocked = err instanceof AuthorizationError && err.code === 'OUTLET_SCOPE_RESTRICTED';
}
assert(outletScopeBlocked, '1.4 Access to unassigned outlet blocked with OUTLET_SCOPE_RESTRICTED');

console.log(`\nTENANT ISOLATION RESULT: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);

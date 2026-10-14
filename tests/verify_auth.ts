import { verifyJwtToken, DecodedToken } from '../lib/serverAuth';
import { createSignedToken, TEST_JWT_SECRET } from './helpers/testAuth';
import { AuthorizationError } from '../lib/authz';

process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

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

console.log('=== CHERRY EDU TEAMS — AUTHENTICATION VERIFICATION ===\n');

// 1. Valid Token Verification
const validToken = createSignedToken({ sub: 'user-valid-01', exp: Math.floor(Date.now() / 1000) + 3600 });
const decoded = verifyJwtToken(validToken);
assert(decoded.sub === 'user-valid-01', '1.1 Cryptographically valid JWT token decodes sub correctly');

// 2. Forged Signature Rejection
const tamperedToken = validToken.slice(0, -6) + 'abc123';
let forgedCaught = false;
try {
  verifyJwtToken(tamperedToken);
} catch (err: any) {
  forgedCaught = err instanceof AuthorizationError && err.code === 'FORGED_TOKEN';
}
assert(forgedCaught, '1.2 Tampered token signature fails with FORGED_TOKEN');

// 3. Expired Token Rejection
const expiredToken = createSignedToken({ sub: 'user-expired', exp: Math.floor(Date.now() / 1000) - 60 });
let expiredCaught = false;
try {
  verifyJwtToken(expiredToken);
} catch (err: any) {
  expiredCaught = err instanceof AuthorizationError && err.code === 'EXPIRED_SESSION';
}
assert(expiredCaught, '1.3 Expired token fails with EXPIRED_SESSION');

// 4. Missing Secret Fail-Closed
delete process.env.SUPABASE_JWT_SECRET;
let missingSecretCaught = false;
try {
  verifyJwtToken(validToken);
} catch (err: any) {
  missingSecretCaught = err instanceof AuthorizationError && err.code === 'AUTH_CONFIG_MISSING';
}
process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
assert(missingSecretCaught, '1.4 Missing SUPABASE_JWT_SECRET fails closed with 500 AUTH_CONFIG_MISSING');

console.log(`\nAUTH VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
if (failed > 0) process.exit(1);

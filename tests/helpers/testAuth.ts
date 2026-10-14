import crypto from 'crypto';
import { DecodedToken } from '@/lib/serverAuth';

export const TEST_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || 'cherryedu-staging-auth-jwt-secret-secure-key-2026';

/**
 * Isolated test utility for generating cryptographically signed HS256 tokens for automated tests.
 * Never used in runtime application code.
 */
export function createSignedToken(
  payload: Partial<DecodedToken> & { sub: string },
  secret: string = TEST_JWT_SECRET
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: DecodedToken = {
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour default
    aud: 'authenticated',
    ...payload,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

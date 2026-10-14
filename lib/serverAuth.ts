import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { UserAuthContext, RoleCode, StaffPermissionCode, OrganizationMembership } from './types';
import { AuthorizationError } from './authz';
import { query } from './db';

export interface DecodedToken {
  sub: string; // user id
  email?: string;
  role?: string;
  exp: number;
  nbf?: number;
  aud?: string | string[];
  iss?: string;
}

/**
 * Returns server Supabase JWT Secret.
 * Strictly fails closed if not configured.
 */
function getJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new AuthorizationError(
      'AUTH_CONFIG_MISSING',
      'Konfigurasi secret otentikasi server (SUPABASE_JWT_SECRET) tidak ditemukan. Sistem menolak seluruh permintaan secara fail-closed.',
      500
    );
  }
  return secret.trim();
}

/**
 * Validates a JWT token cryptographically and checks for expiration, audience, algorithm, and tampering.
 */
export function verifyJwtToken(token: string): DecodedToken {
  if (!token || typeof token !== 'string') {
    throw new AuthorizationError('INVALID_TOKEN', 'Token otentikasi kosong atau tidak valid.', 401);
  }

  const jwtSecret = getJwtSecret();

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new AuthorizationError('INVALID_TOKEN_FORMAT', 'Format JWT tidak valid.', 401);
  }

  const [headerB64, payloadB64, signature] = parts;

  // 1. Validate Header
  let header: { alg?: string; typ?: string };
  try {
    const headerJson = Buffer.from(headerB64, 'base64url').toString('utf8');
    header = JSON.parse(headerJson);
  } catch {
    throw new AuthorizationError('MALFORMED_HEADER', 'Header JWT tidak dapat diurai.', 401);
  }

  if (header.alg !== 'HS256') {
    throw new AuthorizationError(
      'UNSUPPORTED_ALGORITHM',
      `Algoritma token "${header.alg}" tidak diizinkan. Hanya HS256 yang didukung.`,
      401
    );
  }

  // 2. Cryptographic Signature Verification (timing-safe)
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac('sha256', jwtSecret)
    .update(data)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new AuthorizationError(
      'FORGED_TOKEN',
      'Tanda tangan token otentikasi tidak valid atau telah dimanipulasi.',
      401
    );
  }

  // 3. Validate Payload Claims
  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as DecodedToken;

    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.trim() === '') {
      throw new AuthorizationError(
        'INVALID_TOKEN_PAYLOAD',
        'Payload token tidak memiliki sub (user_id) yang sah.',
        401
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // Expiry check
    if (typeof payload.exp !== 'number' || payload.exp < nowSec) {
      throw new AuthorizationError(
        'EXPIRED_SESSION',
        'Sesi login telah kedaluwarsa. Silakan masuk kembali.',
        401
      );
    }

    // Not before check
    if (payload.nbf && typeof payload.nbf === 'number' && payload.nbf > nowSec) {
      throw new AuthorizationError(
        'SESSION_NOT_YET_VALID',
        'Token otentikasi belum dapat digunakan (nbf claim).',
        401
      );
    }

    // Audience check (Supabase access tokens carry aud: 'authenticated')
    if (payload.aud) {
      const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audList.includes('authenticated')) {
        throw new AuthorizationError(
          'INVALID_AUDIENCE',
          'Audience token otentikasi tidak valid untuk sesi pengguna.',
          401
        );
      }
    }

    return payload;
  } catch (err: any) {
    if (err instanceof AuthorizationError) throw err;
    throw new AuthorizationError('MALFORMED_TOKEN', 'Token payload tidak dapat diurai.', 401);
  }
}

/**
 * Resolves the authenticated UserAuthContext strictly from the database.
 * 1. Verifies Bearer token cryptographically.
 * 2. Fetches user record from auth.users and public.profiles.
 * 3. Queries active organization memberships and roles from b2b.organization_memberships.
 * 4. Queries internal staff permissions from b2b.internal_staff_permissions.
 * 5. Rejects suspended memberships and revoked permissions.
 */
export async function resolveTeamsUser(
  req: NextRequest,
  targetOrgId?: string
): Promise<UserAuthContext> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new AuthorizationError(
      'UNAUTHENTICATED',
      'Kredensial otentikasi Bearer token tidak ditemukan.',
      401
    );
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyJwtToken(token);

  // 1. Fetch user from database
  const userResult = await query<{
    id: string;
    email: string;
    name: string;
  }>(
    `SELECT u.id::text, u.email, COALESCE(p.name, u.raw_user_meta_data->>'name', u.email) as name
     FROM auth.users u
     LEFT JOIN public.profiles p ON p.id = u.id::text
     WHERE u.id::text = $1`,
    [decoded.sub]
  );

  if (userResult.rows.length === 0) {
    throw new AuthorizationError(
      'USER_NOT_FOUND',
      'Pengguna tidak ditemukan dalam database.',
      401
    );
  }

  const dbUser = userResult.rows[0];

  // 2. Fetch internal staff permissions
  const staffResult = await query<{ permission_code: string }>(
    `SELECT permission_code 
     FROM b2b.internal_staff_permissions 
     WHERE user_id::text = $1 AND revoked_at IS NULL`,
    [dbUser.id]
  );

  const staffPermissions = staffResult.rows.map(
    (r) => r.permission_code as StaffPermissionCode
  );

  // 3. Fetch all organization memberships for this user
  const memberResult = await query<{
    membership_id: string;
    organization_id: string;
    membership_status: string;
    roles: string[];
    outlet_scopes: string[];
    created_at: string;
  }>(
    `SELECT 
       m.id::text as membership_id,
       m.organization_id::text,
       m.status as membership_status,
       m.created_at::text,
       COALESCE(array_agg(DISTINCT mr.role_code::text) FILTER (WHERE mr.role_code IS NOT NULL), ARRAY[]::text[]) as roles,
       COALESCE(array_agg(DISTINCT mos.outlet_id::text) FILTER (WHERE mos.outlet_id IS NOT NULL), ARRAY[]::text[]) as outlet_scopes
     FROM b2b.organization_memberships m
     LEFT JOIN b2b.membership_roles mr ON mr.membership_id = m.id
     LEFT JOIN b2b.membership_outlet_scopes mos ON mos.membership_id = m.id
     WHERE m.user_id::text = $1
     GROUP BY m.id, m.organization_id, m.status, m.created_at`,
    [dbUser.id]
  );

  // Determine active membership
  let activeMembership: OrganizationMembership | null = null;
  let assignedCohorts: string[] | undefined = undefined;
  const memberships = memberResult.rows;

  if (targetOrgId) {
    const target = memberships.find((m) => m.organization_id === targetOrgId);
    if (target) {
      if (target.membership_status === 'suspended') {
        throw new AuthorizationError(
          'MEMBERSHIP_SUSPENDED',
          'Keanggotaanmu pada organisasi ini ditangguhkan (suspended).',
          403
        );
      }
      if (target.membership_status === 'active') {
        activeMembership = {
          id: target.membership_id,
          organization_id: target.organization_id,
          user_id: dbUser.id,
          status: 'active',
          roles: target.roles as RoleCode[],
          outlet_scopes: target.outlet_scopes,
          created_at: target.created_at,
        };
      }
    } else if (staffPermissions.includes('cherry_trainer')) {
      // Scoped access: Check if trainer has active cohort assignment in target organization
      const assignmentRes = await query<{ cohort_id: string }>(
        `SELECT cohort_id::text
         FROM b2b.trainer_assignments
         WHERE organization_id = $1 AND trainer_user_id = $2
           AND active_from <= NOW() AND (active_until IS NULL OR active_until >= NOW())`,
        [targetOrgId, dbUser.id]
      );
      if (assignmentRes.rows.length > 0) {
        assignedCohorts = assignmentRes.rows.map((r) => r.cohort_id);
        activeMembership = {
          id: `trainer-${dbUser.id}`,
          organization_id: targetOrgId,
          user_id: dbUser.id,
          status: 'active',
          roles: ['trainer'],
          created_at: new Date().toISOString(),
        };
      }
    } else if (staffPermissions.includes('platform_admin')) {
      activeMembership = {
        id: `admin-${dbUser.id}`,
        organization_id: targetOrgId,
        user_id: dbUser.id,
        status: 'active',
        roles: ['client_manager'],
        created_at: new Date().toISOString(),
      };
    }
  } else if (memberships.length > 0) {
    // Default to first active membership if none specified
    const active = memberships.find((m) => m.membership_status === 'active');
    if (active) {
      activeMembership = {
        id: active.membership_id,
        organization_id: active.organization_id,
        user_id: dbUser.id,
        status: 'active',
        roles: active.roles as RoleCode[],
        outlet_scopes: active.outlet_scopes,
        created_at: active.created_at,
      };
    }
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.name,
    activeOrganizationId: activeMembership?.organization_id || null,
    activeMembership,
    staffPermissions,
    assignedCohorts,
  };
}

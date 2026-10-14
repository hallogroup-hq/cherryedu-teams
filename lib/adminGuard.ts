import { NextRequest, NextResponse } from 'next/server';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { UserAuthContext } from '@/lib/types';
import { AuthorizationError } from '@/lib/authz';

/**
 * Resolves and guards platform_admin access.
 * Returns the user context if authorized, throws AuthorizationError otherwise.
 */
export async function resolveAdmin(req: NextRequest): Promise<UserAuthContext> {
  const user = await resolveTeamsUser(req);

  if (!user.staffPermissions.includes('platform_admin')) {
    throw new AuthorizationError(
      'FORBIDDEN_NOT_ADMIN',
      'Akses ditolak. Rute ini hanya dapat diakses oleh Platform Admin Cherry Edu.',
      403
    );
  }

  return user;
}

export function adminErrorResponse(err: unknown) {
  if (err instanceof AuthorizationError) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const e = err as Error;
  console.error('[Admin API Error]', e?.message, e?.stack);
  return NextResponse.json(
    { success: false, error: e?.message || 'Server error', code: 'SERVER_ERROR' },
    { status: 500 }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { assertMembership, AuthorizationError } from '@/lib/authz';
import { query } from '@/lib/db';
import { Invitation, RoleCode } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    // Must be member of orgId with owner or client_manager role
    assertMembership(user, orgId, ['owner', 'client_manager']);

    const res = await query<Invitation>(
      `SELECT id, organization_id, email_normalized, intended_role, outlet_id,
              token_hash, expires_at, status, invited_by, accepted_user_id, accepted_at, created_at
       FROM b2b.invitations
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [orgId]
    );

    return NextResponse.json({ success: true, invitations: res.rows });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in invitations GET:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    const membership = assertMembership(user, orgId, ['owner', 'client_manager']);

    const body = await req.json().catch(() => ({}));
    if (!body.email || !body.role) {
      return NextResponse.json(
        { success: false, error: 'Email dan role wajib diisi.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const role = body.role as RoleCode;
    if (role === 'owner' && !membership.roles.includes('owner')) {
      return NextResponse.json(
        { success: false, error: 'Hanya Owner yang dapat mengundang anggota dengan peran Owner.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const emailNormalized = body.email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const insertRes = await query<Invitation>(
      `INSERT INTO b2b.invitations (
         organization_id, email_normalized, intended_role, outlet_id,
         token_hash, expires_at, status, invited_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING id, organization_id, email_normalized, intended_role, outlet_id,
                 token_hash, expires_at, status, invited_by, created_at`,
      [orgId, emailNormalized, role, body.outlet_id || null, tokenHash, expiresAt, user.userId]
    );

    return NextResponse.json(
      { success: true, invitation: insertRes.rows[0], token },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in invitations POST:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const user = await resolveTeamsUser(req, orgId);

    assertMembership(user, orgId, ['owner', 'client_manager']);

    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'ID undangan wajib diisi.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    const delRes = await query(
      `UPDATE b2b.invitations
       SET status = 'revoked'
       WHERE id = $1 AND organization_id = $2`,
      [invitationId, orgId]
    );

    if (delRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Undangan tidak ditemukan atau berada di luar organisasi.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Undangan berhasil dibatalkan.' });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in invitations DELETE:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
}

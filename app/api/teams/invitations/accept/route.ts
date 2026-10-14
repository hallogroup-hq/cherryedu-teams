import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveTeamsUser } from '@/lib/serverAuth';
import { AuthorizationError } from '@/lib/authz';
import { withTransaction } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveTeamsUser(req);
    const body = await req.json().catch(() => ({}));
    const rawToken = body.token;

    if (!rawToken || typeof rawToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token undangan wajib disertakan.', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    return await withTransaction(async (client) => {
      // 1. Fetch and lock invitation
      const inviteRes = await client.query<{
        id: string;
        organization_id: string;
        email_normalized: string;
        intended_role: string;
        outlet_id: string | null;
        expires_at: string;
        status: string;
      }>(
        `SELECT id, organization_id, email_normalized, intended_role, outlet_id, expires_at, status
         FROM b2b.invitations
         WHERE token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );

      if (inviteRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Token undangan tidak valid atau tidak ditemukan.', code: 'INVITATION_NOT_FOUND' },
          { status: 404 }
        );
      }

      const invitation = inviteRes.rows[0];

      if (invitation.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Undangan ini sudah tidak aktif (status: ${invitation.status}).`, code: 'INVITATION_ALREADY_USED' },
          { status: 400 }
        );
      }

      if (new Date(invitation.expires_at) < new Date()) {
        await client.query(`UPDATE b2b.invitations SET status = 'expired' WHERE id = $1`, [invitation.id]);
        return NextResponse.json(
          { success: false, error: 'Undangan ini telah kedaluwarsa.', code: 'INVITATION_EXPIRED' },
          { status: 400 }
        );
      }

      // 2. Activate or create membership
      const memberRes = await client.query<{ id: string }>(
        `INSERT INTO b2b.organization_memberships (
           organization_id, user_id, status, joined_at
         )
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (organization_id, user_id) DO UPDATE SET
           status = 'active',
           joined_at = COALESCE(b2b.organization_memberships.joined_at, NOW())
         RETURNING id`,
        [invitation.organization_id, user.userId]
      );

      const membershipId = memberRes.rows[0].id;

      // 3. Assign role
      await client.query(
        `INSERT INTO b2b.membership_roles (membership_id, role_code)
         VALUES ($1, $2)
         ON CONFLICT (membership_id, role_code) DO NOTHING`,
        [membershipId, invitation.intended_role]
      );

      // 4. Assign outlet scope if specified
      if (invitation.outlet_id) {
        await client.query(
          `INSERT INTO b2b.membership_outlet_scopes (
             membership_id, organization_id, outlet_id
           )
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [membershipId, invitation.organization_id, invitation.outlet_id]
        );
      }

      // 5. Update invitation to accepted
      await client.query(
        `UPDATE b2b.invitations
         SET status = 'accepted', accepted_user_id = $1, accepted_at = NOW()
         WHERE id = $2`,
        [user.userId, invitation.id]
      );

      // 6. Record audit event
      await client.query(
        `INSERT INTO b2b.audit_events (
           organization_id, actor_user_id, action, object_type, object_id, occurred_at
         )
         VALUES ($1, $2, 'invitation_accepted', 'invitation', $3, NOW())`,
        [invitation.organization_id, user.userId, invitation.id]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Undangan berhasil diterima. Kamu telah resmi bergabung.',
          organization_id: invitation.organization_id,
          role: invitation.intended_role,
          membership_id: membershipId,
        },
        { status: 200 }
      );
    });
  } catch (err: any) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: err.message, code: err.code }, { status: err.status });
    }
    console.error('Error in invitations/accept POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

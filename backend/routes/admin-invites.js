const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const crypto   = require('crypto');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Helper: only the super admin (seeded via seedAdmin.js) can generate / revoke invites
const requireSuperAdmin = (req, res, next) => {
  const superEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!superEmail)
    return res.status(500).json({ error: 'SUPER_ADMIN_EMAIL is not configured in .env' });
  if (req.user.email !== superEmail)
    return res.status(403).json({
      error: 'Only the super admin can perform this action.',
    });
  next();
};

// ── POST /api/admin-invites — Generate a new invite token ────
// Body: { email }   |   Requires: super admin only
router.post('/', requireAdmin, requireSuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim())
    return res.status(400).json({ error: 'email is required' });

  const targetEmail = email.trim().toLowerCase();

  // Prevent inviting someone who is already an admin
  const [[existing]] = await db.query(
    'SELECT user_id, role FROM users WHERE email = ?', [targetEmail]
  );
  if (existing && existing.role === 'admin')
    return res.status(409).json({ error: 'This email already belongs to an admin account.' });

  // One active (unused, non-expired) invite per email is enough
  const [[pending]] = await db.query(
    `SELECT invite_id FROM admin_invites
     WHERE email = ? AND used = 0 AND expires_at > NOW()`,
    [targetEmail]
  );
  if (pending)
    return res.status(409).json({
      error: 'An active invite already exists for this email. Revoke it first if you want to resend.',
    });

  // Generate a cryptographically random 32-byte hex token (64 chars)
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await db.query(
    `INSERT INTO admin_invites (email, token, expires_at, created_by)
     VALUES (?, ?, ?, ?)`,
    [targetEmail, token, expiresAt, req.user.user_id]
  );

  res.status(201).json({
    message: 'Invite token generated successfully.',
    invite: {
      email:      targetEmail,
      token,
      expires_at: expiresAt,
    },
  });
});

// ── GET /api/admin-invites — List all invites ────────────────
// Any admin can view the list (read-only visibility)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [invites] = await db.query(
      `SELECT
         i.invite_id,
         i.email,
         i.token,
         i.used,
         i.expires_at,
         i.created_at,
         u.name AS created_by_name
       FROM admin_invites i
       JOIN users u ON u.user_id = i.created_by
       ORDER BY i.created_at DESC`
    );

    // Annotate each invite with its computed status
    const now = new Date();
    const result = invites.map(inv => ({
      ...inv,
      status: inv.used
        ? 'used'
        : new Date(inv.expires_at) < now
          ? 'expired'
          : 'pending',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin-invites/:id — Revoke a pending invite ──
// Only super admin can revoke
router.delete('/:id', requireAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const [[invite]] = await db.query(
      'SELECT * FROM admin_invites WHERE invite_id = ?', [req.params.id]
    );
    if (!invite)
      return res.status(404).json({ error: 'Invite not found.' });
    if (invite.used)
      return res.status(400).json({ error: 'Cannot revoke an already-used invite.' });

    await db.query('DELETE FROM admin_invites WHERE invite_id = ?', [req.params.id]);
    res.json({ message: 'Invite revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { requireAuth } = require('../middleware/auth');

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, inviteToken } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const normalEmail = email.trim().toLowerCase();

  // ── Invite-token admin path ──────────────────────────────────
  let role = 'user';
  if (inviteToken && inviteToken.trim() !== '') {
    // Look up the invite: token AND email must both match
    const [[invite]] = await db.query(
      `SELECT * FROM admin_invites
       WHERE token = ? AND email = ?`,
      [inviteToken.trim(), normalEmail]
    );

    if (!invite)
      return res.status(403).json({ error: 'Invalid invite token or email mismatch.' });
    if (invite.used)
      return res.status(403).json({ error: 'This invite token has already been used.' });
    if (new Date(invite.expires_at) < new Date())
      return res.status(403).json({ error: 'This invite token has expired. Ask an admin for a new one.' });

    role = 'admin';

    // Burn the token immediately (before the INSERT, to avoid race conditions)
    await db.query(
      'UPDATE admin_invites SET used = 1 WHERE invite_id = ?',
      [invite.invite_id]
    );
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalEmail, hash, role]
    );
    const isSuperAdmin = normalEmail === (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    const user = { user_id: result.insertId, name: name.trim(), email: normalEmail, role, is_super_admin: isSuperAdmin };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Registered successfully', token, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});


// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const isSuperAdmin = user.email === (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    const payload = { user_id: user.user_id, name: user.name, email: user.email, role: user.role, is_super_admin: isSuperAdmin };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// D:\CertiFlow\certiflow-backend\routes\auth.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');            // your Knex instance
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// keep your old controller login available if something else calls it
let loginUser;
try {
  ({ loginUser } = require('../controllers/auth'));
} catch (_) {
  loginUser = null;
}

/**
 * POST /api/auth/preprovision
 * Body: { name, email, role? }  // role defaults to 'student'
 * Upserts by email. Returns flags for whether the student still needs setup.
 */
router.post('/preprovision', async (req, res) => {
  try {
    const { name, email, role = 'student' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const now = knex.fn.now();
    const [user] = await knex('users')
      .insert({ name: name || null, email, role })
      .onConflict('email')
      .merge({ name: name || null, role, updated_at: now })
      .returning(['id', 'email', 'username', 'password_hash', 'role']);

    const needsSetup = !user?.password_hash;
    const hasUsername = !!user?.username;

    res.json({
      ok: true,
      userId: user.id,
      email: user.email,
      role: user.role,
      hasUsername,
      needsSetup,
      message: needsSetup
        ? 'User pre-provisioned. Invite flow can set username/password.'
        : 'User already has credentials; no invite needed.',
    });
  } catch (err) {
    console.error('preprovision error:', err);
    res.status(500).json({ error: 'preprovision failed' });
  }
});

/**
 * POST /api/auth/set-credentials
 * Body: { email, username, password }
 * Finds the pre-provisioned user by email, sets username (must be unique) and hashes password.
 * Returns a JWT for immediate login.
 */
router.post('/set-credentials', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username, and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'password must be at least 8 characters' });
    }

    // Ensure the user exists
    const existing = await knex('users').where({ email }).first();
    if (!existing) return res.status(404).json({ error: 'user not found for this email' });

    // Ensure username is not taken by someone else
    const taken = await knex('users')
      .where({ username })
      .andWhereNot({ id: existing.id })
      .first();
    if (taken) return res.status(409).json({ error: 'username already taken' });

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Update both legacy 'password' and new 'password_hash' for compatibility
    await knex('users')
      .where({ id: existing.id })
      .update({
        username,
        password_hash: hash,
        password: hash, // if your older code used "password", keep it in sync
        updated_at: knex.fn.now(),
      });

    const user = await knex('users')
      .where({ id: existing.id })
      .select(['id', 'email', 'username', 'role'])
      .first();

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('set-credentials error:', err);
    // Handle unique constraint error gracefully
    if (String(err.message || '').includes('unique') || String(err.message || '').includes('duplicate key')) {
      return res.status(409).json({ error: 'username already taken' });
    }
    res.status(500).json({ error: 'set-credentials failed' });
  }
});

// Keep your existing login endpoint if used elsewhere
if (loginUser) {
  router.post('/login', loginUser);
}

module.exports = router;

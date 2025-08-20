// D:\CertiFlow\certiflow-backend\routes\auth.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');            // your existing Knex instance
const { loginUser } = require('../controllers/auth');

// POST /api/auth/preprovision
// Body: { name, email, role? }   (role defaults to 'student')
// Creates the user if not exists (by email), or updates name/role if it does.
// Returns flags telling you if the student still needs to set credentials.
router.post('/preprovision', async (req, res) => {
  try {
    const { name, email, role = 'student' } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const now = knex.fn.now();

    // Upsert by unique(email)
    const [user] = await knex('users')
      .insert({ name: name || null, email, role })
      .onConflict('email')
      .merge({ name: name || null, role, updated_at: now })
      .returning(['id', 'email', 'username', 'password_hash', 'role']);

    const needsSetup = !user?.password_hash; // no password yet -> needs invite/setup
    const hasUsername = !!user?.username;

    return res.json({
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
    return res.status(500).json({ error: 'preprovision failed' });
  }
});

// Existing login route (kept as-is for now)
router.post('/login', loginUser);

module.exports = router;

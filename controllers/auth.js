// D:\CertiFlow\certiflow-backend\controllers\auth.js
const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Body: { identifier, password }
 * - identifier can be an email OR a username
 * - verifies bcrypt password (supports legacy "password" or new "password_hash")
 * Response: { ok, user: {id,email,username,name,role}, token }
 */
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ error: 'identifier and password are required' });
    }

    // Find by email OR username
    const user = await knex('users')
      .where('email', identifier)
      .orWhere('username', identifier)
      .first();

    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const hash = user.password_hash || user.password; // support legacy column if present
    if (!hash) {
      return res.status(409).json({ error: 'no credentials set for this user' });
    }

    const ok = await bcrypt.compare(String(password), hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || null,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'login failed' });
  }
};

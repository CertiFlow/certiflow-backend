const knex = require('../db/knex');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { name, role } = req.body;

  try {
    let user = await knex('users').where({ name }).first();

    if (!user) {
      const fakeEmail = `${name.toLowerCase().replace(/ /g, '.')}@example.com`;

      const inserted = await knex('users')
        .insert({
          name,
          role,
          email: fakeEmail,
          password: 'nopass' // Temporary placeholder password
        })
        .returning('*');

      user = inserted[0];
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = { loginUser };

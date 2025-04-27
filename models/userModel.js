const knex = require('knex');
const knexfile = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

// User Model
const User = {
  getAll: () => db('users').select('*'),
  getById: (id) => db('users').where({ id }).first(),
  getByEmail: (email) => db('users').where({ email }).first(),  // <— added
  create: (user) => db('users').insert(user).returning('*'),
  update: (id, user) => db('users').where({ id }).update(user).returning('*'),
  delete: (id) => db('users').where({ id }).del(),
};

module.exports = User;

// models/certificateModel.js
const knex = require('knex');
const knexfile = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

const Certificate = {
  getAll:    () => db('certificates').select('*'),
  getById:  (id) => db('certificates').where({ id }).first(),
  create:   (cert) => db('certificates').insert(cert).returning('*'),
  update:   (id, cert) => db('certificates').where({ id }).update(cert).returning('*'),
  remove:   (id) => db('certificates').where({ id }).del(),
};

module.exports = Certificate;

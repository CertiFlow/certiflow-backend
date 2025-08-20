// certiflow-backend/models/trainingModel.js
const knex = require('knex');
const knexfile = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

const Training = {
  getAll: () => db('trainings').select('*'),
  getById: (id) => db('trainings').where({ id }).first(),
  create: (training) => db('trainings').insert(training).returning('*'),
  delete: (id) => db('trainings').where({ id }).del(),
};

module.exports = Training;

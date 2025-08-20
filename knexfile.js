require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host:     'localhost',
      port:     5432,
      user:     'postgres',
      password: 'Nr10221',      // ← your actual Postgres password
      database: 'postgres',
      ssl:      false
    },
    migrations: { directory: './migrations' },
    seeds:      { directory: './seeds' },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: { directory: './migrations' },
    seeds:      { directory: './seeds' },
  },
};

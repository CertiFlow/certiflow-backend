// D:\CertiFlow\certiflow-backend\index.js
// Express + PG pool with env-based SSL/CORS + auto-run Knex migrations at startup

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const knexLib = require('knex');
const path = require('path');

const PORT = process.env.PORT || 10000;

// CORS: comma-separated list in CORS_ORIGIN (e.g., "http://localhost:5173,https://getcertiflow.com")
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// DB SSL toggle for hosted DBs (Render): PG_SSL=1
const USE_SSL =
  process.env.PG_SSL === '1' ||
  process.env.PG_SSL === 'true' ||
  process.env.PGSSL === '1' ||
  process.env.PGSSL === 'true';

if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in env');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true,
  })
);

// Create PG pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: USE_SSL ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});
app.set('db', pool);

// Health (uses DB ping)
app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, db: true, ssl: !!USE_SSL });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Register routes (best-effort)
try { app.use('/api/enrollments', require('./routes/enrollments')); } catch (e) { console.warn('ℹ️ enrollments route:', e.message); }
try { app.use('/api/documents', require('./routes/documents')); } catch (e) { console.warn('ℹ️ documents route:', e.message); }
try { app.use('/api/templates', require('./routes/templates')); } catch (e) { console.warn('ℹ️ templates route:', e.message); }
try { app.use('/api/certificates', require('./routes/certificates')); } catch (e) { console.warn('ℹ️ certificates route:', e.message); }
try { app.use('/api/verify', require('./routes/verify')); } catch (e) { console.warn('ℹ️ verify route:', e.message); }
try { app.use('/api/auth', require('./routes/auth')); } catch (e) { console.warn('ℹ️ auth route:', e.message); }


// Auto-run Knex migrations at startup
async function runMigrations() {
  const knex = knexLib({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: USE_SSL ? { rejectUnauthorized: false } : false,
    },
    migrations: { directory: path.join(__dirname, 'migrations') },
  });

  try {
    const [batchNo, log] = await knex.migrate.latest();
    console.log(`📦 Knex migrations: batch ${batchNo}, ran ${log.length} file(s)`);
    if (log.length) log.forEach(f => console.log('   -', f));
  } catch (err) {
    console.error('❌ Knex migration failed:', err.message);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// Startup: verify DB, run migrations, then listen
(async () => {
  try {
    await pool.query('SELECT 1 as ok');
    console.log(`✅ Connected to the database! (ssl=${USE_SSL ? 'ON' : 'OFF'})`);
    await runMigrations();
  } catch (err) {
    console.error('❌ Database connection failed at startup:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
})();

// Safety
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION', err);
  process.exit(1);
});

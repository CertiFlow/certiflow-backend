// D:\CertiFlow\certiflow-backend\index.js
// Full server with environment-based Postgres SSL and CORS

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const morgan = require('morgan');

// ------------------------
// Config
// ------------------------
const PORT = process.env.PORT || 10000;

// CORS: list allowed origins comma-separated in CORS_ORIGIN
// e.g. "http://localhost:5173,https://getcertiflow.com"
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// DB SSL toggle: PG_SSL=0 (local), PG_SSL=1 (hosted like Render)
const USE_SSL =
  process.env.PG_SSL === '1' ||
  process.env.PG_SSL === 'true' ||
  process.env.PGSSL === '1' ||
  process.env.PGSSL === 'true';

// ------------------------
// App setup
// ------------------------
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / curl / postman with no origin
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true,
  })
);

// ------------------------
// Database
// ------------------------
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: USE_SSL ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// quick connect test at startup
pool
  .query('SELECT 1 as ok')
  .then(() => {
    console.log(
      `✅ Connected to the database! (ssl=${USE_SSL ? 'ON' : 'OFF'})`
    );
  })
  .catch((err) => {
    console.error('❌ Database connection failed at startup:', err.message);
    process.exit(1);
  });

// Make pool available if your route files want it via req.app.get('db')
app.set('db', pool);

// ------------------------
// Health
// ------------------------
app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({
      ok: true,
      db: r.rows?.[0]?.ok === 1,
      ssl: !!USE_SSL,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ------------------------
// Routes
// (These assume each file exports an Express Router. If your project
// already had these working, this will match that pattern.)
// ------------------------
try {
  app.use('/api/enrollments', require('./routes/enrollments'));
} catch (e) {
  console.warn('ℹ️ enrollments route not found or failed to load:', e.message);
}
try {
  app.use('/api/documents', require('./routes/documents'));
} catch (e) {
  console.warn('ℹ️ documents route not found or failed to load:', e.message);
}
try {
  app.use('/api/templates', require('./routes/templates'));
} catch (e) {
  console.warn('ℹ️ templates route not found or failed to load:', e.message);
}

// ------------------------
// Start server
// ------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Safety: crash on critical unhandled rejections so we notice in dev
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION', err);
  process.exit(1);
});

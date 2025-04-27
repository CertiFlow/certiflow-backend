// Load .env in local development (ignored on Render)
require('dotenv').config();

const express = require('express');
const userRoutes = require('./routes/userRoutes');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 10000;

// Parse JSON bodies
app.use(express.json());

// PostgreSQL connection (for health-check)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Health-check route
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Mount user routes under /api/users
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('CertiFlow API is running');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

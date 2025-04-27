// Load .env in local development (ignored on Render)
require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const authRoutes = require('./routes/authRoutes');
const authenticate = require('./middleware/authenticate');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 10000;

// Parse JSON bodies
app.use(express.json());

// Mount auth routes (register & login)
app.use('/api/auth', authRoutes);

// Protect user routes with JWT middleware
app.use('/api/users', authenticate, userRoutes);

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

// Root route
app.get('/', (req, res) => {
  res.send('CertiFlow API is running');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

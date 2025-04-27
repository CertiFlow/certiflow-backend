// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const authRoutes = require('./routes/authRoutes');
const authenticate = require('./middleware/authenticate');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 10000;

// 🚀 Allow all origins (for testing)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Auth endpoints
app.use('/api/auth', authRoutes);

// Protected user routes
app.use('/api/users', authenticate, userRoutes);

// Health-check
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('CertiFlow API is running');
});

// Start
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


require('dotenv').config();      // Loads .env locally; ignored in Render
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 10000;

// Only use the single DATABASE_URL variable:
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Define your /health route (no eager pool.connect on startup):
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Only start listening after defining routes:
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


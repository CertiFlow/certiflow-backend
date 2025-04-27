// index.js

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const authRoutes = require('./routes/authRoutes');
const authenticate = require('./middleware/authenticate');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 10000;

// Enable CORS for local dev and your deployed front-end
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://certiflow-frontend.vercel.app'  // replace with your real front-end URL
  ]
}));

// Parse JSON bodies
app.use(express.json());

// Mount authentication routes (register & login)
app.use('/api/auth', authRoutes);

// Protect user routes with JWT middleware
app.use('/api/users', authenticate, userRoutes);

// Health-check route using PostgreSQL
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

// Root route
app.get('/', (req, res) => {
  res.send('CertiFlow API is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


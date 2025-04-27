const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, CertiFlow!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
const express = require('express');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Connect to database
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect()
  .then(() => console.log('Connected to the database!'))
  .catch(err => console.error('Connection error', err.stack));

// THIS IS THE NEW /health ROUTE
app.get('/health', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).send('Database error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

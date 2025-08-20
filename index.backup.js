const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const knex = require('./db/knex'); // ✅ USE THIS LINE — points to knex.js

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const certificateRoutes = require('./routes/certificates');
const documentRoutes = require('./routes/documents');
const templateRoutes = require('./routes/templates');

app.use('/api', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/templates', templateRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Test DB connection
knex.raw('SELECT 1')
  .then(() => console.log('✅ Connected to the database!'))
  .catch((err) => console.error('❌ Database connection failed:', err));

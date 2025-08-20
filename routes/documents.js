const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../database');

// 📂 Ensure 'uploads/' folder exists
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ⚙️ Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Upload Route
router.post('/upload', upload.single('file'), async (req, res) => {
  const { user_id, course_id } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const result = await pool.query(
      `INSERT INTO documents (user_id, course_id, file_name, original_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, course_id, file.filename, file.originalname]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error saving document:', err);
    res.status(500).json({ error: 'Failed to save document' });
  }
});

// 🧾 Get docs by user
router.get('/student/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching student docs:', err.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// 🧾 Get docs by course
router.get('/course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(
      `SELECT d.*, u.first_name, u.last_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.course_id = $1`,
      [courseId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching course docs:', err.message);
    res.status(500).json({ error: 'Failed to fetch course documents' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/knex');

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/templates',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// POST /api/templates/upload
router.post('/upload', upload.single('template'), async (req, res) => {
  const { title, course_id } = req.body;
  const filename = req.file?.filename;

  console.log('Uploading template with:', { title, filename, course_id });

  if (!filename) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await db('templates')
      .insert({
        title,
        filename,
        course_id: parseInt(course_id),
      })
      .returning('id'); // ensure we get the inserted ID back

    const insertedId = Array.isArray(result) ? result[0].id || result[0] : result;

    res.json({ message: 'Template uploaded successfully', id: insertedId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload template' });
  }
});

module.exports = router;

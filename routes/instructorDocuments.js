const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /api/instructor/documents/:courseId
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        u.id AS student_id,
        u.name,
        u.email,
        e.id AS enrollment_id,
        d.file_name,
        d.original_name,
        d.created_at AS submitted_at
      FROM "enrollments" e
      JOIN "users" u ON u.id = e.user_id
      LEFT JOIN "documents" d
        ON d.user_id = u.id AND d.course_id = e.course_id
      WHERE e.course_id = $1
      ORDER BY u.name
    `, [courseId]);

    const students = result.rows.map(row => ({
      student_id: row.student_id,
      name: row.name,
      email: row.email,
      enrollment_id: row.enrollment_id,
      submitted: !!row.file_name,
      document: row.file_name
        ? {
            file_name: row.file_name,
            original_name: row.original_name,
            submitted_at: row.submitted_at,
            download_url: `/api/documents/download/${row.file_name}`
          }
        : null
    }));

    res.json(students);
  } catch (err) {
    console.error('❌ Error fetching instructor view:', err.message);
    res.status(500).json({ error: 'Failed to load documents for instructor' });
  }
});

module.exports = router;

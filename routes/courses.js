const express = require('express');
const router = express.Router();
const pool = require('../database'); // PostgreSQL connection pool

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch courses:', err.message);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// POST /api/courses
router.post('/', async (req, res) => {
  const { title, description, start_date, duration, instructor } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await pool.query(
      'INSERT INTO courses (title, description, start_date, duration, instructor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, start_date, duration, instructor]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting course:', err.message);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Update course
router.put('/:id', async (req, res) => {
  const { title, description, start_date, duration, instructor } = req.body;

  try {
    const result = await pool.query(
      'UPDATE courses SET title=$1, description=$2, start_date=$3, duration=$4, instructor=$5 WHERE id=$6 RETURNING *',
      [title, description, start_date, duration, instructor, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating course:', err.message);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Delete course
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    res.status(204).end(); // No content
  } catch (err) {
    console.error('❌ Error deleting course:', err.message);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});
// GET /api/courses/:id/students
router.get('/:id/students', async (req, res) => {
  const courseId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             EXISTS (
               SELECT 1 FROM documents d
               WHERE d.user_id = u.id AND d.course_id = $1
             ) AS submitted
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      WHERE e.course_id = $1
    `, [courseId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch students for course:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});


// GET /api/courses/:id/students
router.get('/:id/students', async (req, res) => {
  const courseId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             EXISTS (
               SELECT 1 FROM documents d
               WHERE d.user_id = u.id AND d.course_id = $1
             ) AS submitted
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      WHERE e.course_id = $1
    `, [courseId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch students for course:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});
module.exports = router;

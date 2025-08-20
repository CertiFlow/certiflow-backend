const express = require('express');
const db = require('../db/knex');
const path = require('path');
const fillTemplate = require('../utils/fillTemplate');

const router = express.Router();

// POST /api/generate-document
router.post('/', async (req, res) => {
  const { enrollment_id, template_id } = req.body;

  if (!enrollment_id || !template_id) {
    return res.status(400).json({ error: 'Missing enrollment_id or template_id' });
  }

  try {
    const enrollment = await db('enrollments')
      .where('id', enrollment_id)
      .first();

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const student = await db('users')
      .where('id', enrollment.user_id)
      .first();

    const course = await db('courses')
      .where('id', enrollment.course_id)
      .first();

    const instructor = await db('users')
      .where('id', course.instructor_id || 1) // fallback if not set
      .first();

    const template = await db('templates')
      .where('id', template_id)
      .first();

    if (!template) return res.status(404).json({ error: 'Template not found' });

    const outputFileName = `${student.name}_${course.title}_Filled.pdf`.replace(/\s+/g, '_');

    const pdfPath = await fillTemplate(template.filename, outputFileName, {
      studentName: student.name,
      studentId: student.id.toString(),
      courseTitle: course.title,
      instructorName: instructor ? instructor.name : 'N/A',
      classDate: course.start_date.toISOString().split('T')[0],
    });

    res.json({ message: 'PDF generated', path: pdfPath });
  } catch (err) {
    console.error('❌ Document generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;

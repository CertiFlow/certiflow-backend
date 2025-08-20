const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/:certificateId', async (req, res) => {
  const { certificateId } = req.params;

  try {
    const cert = await knex('certificates')
      .join('users', 'certificates.user_id', '=', 'users.id')
      .join('courses', 'certificates.course_id', '=', 'courses.id')
      .select(
        'certificates.certificate_id',
        'certificates.issued_date',
        'users.name as student_name',
        'users.email as student_email',
        'courses.title as course_title'
      )
      .where('certificates.certificate_id', certificateId)
      .first();

    if (!cert) {
      return res.status(404).send('<h2>❌ Certificate Not Found</h2>');
    }

    res.send(`
      <h2>✅ Certificate Verified</h2>
      <p><strong>Certificate ID:</strong> ${cert.certificate_id}</p>
      <p><strong>Student Name:</strong> ${cert.student_name}</p>
      <p><strong>Course Title:</strong> ${cert.course_title}</p>
      <p><strong>Issued Date:</strong> ${cert.issued_date}</p>
      <p><strong>Email:</strong> ${cert.student_email}</p>
    `);
  } catch (err) {
    console.error('Verification Error:', err.message);
    res.status(500).send('<h2>🚨 Server Error</h2>');
  }
});

module.exports = router;

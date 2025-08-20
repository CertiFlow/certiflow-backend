const express = require('express');
const router = express.Router();
const pool = require('../database');
const generateCertificate = require('../utils/generateCertificate');
const fillTemplate = require('../utils/fillTemplate');
const sendCertificateEmail = require('../utils/sendCertificateEmail');
const path = require('path');

// PATCH - Approve a student and generate certificate + filled document + send email
router.patch('/:id/pass', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Mark as passed
    await pool.query('UPDATE enrollments SET passed = true WHERE id = $1', [id]);

    // 2. Get student and course info
    const { rows } = await pool.query(`
      SELECT e.user_id, e.course_id, u.name, u.email, u.id as student_id, c.title, c.start_date
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Enrollment not found' });

    const { user_id, course_id, student_id, name, email, title, start_date } = rows[0];
    const certId = `CERT-${Date.now()}-${user_id}`;
    const studentName = name;

    // 3. Save certificate record
    await pool.query(
      `INSERT INTO certificates (user_id, course_id, certificate_id, issued_date, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [user_id, course_id, certId]
    );

    // 4. Generate Certificate PDF
    const certFilename = `${studentName}_${title}_Certificate.pdf`.replace(/\s+/g, '_');
    const certPath = path.join(__dirname, '../generated-docs', certFilename);

    await generateCertificate(studentName, title, certId, new Date().toLocaleDateString(), certPath);

    // 5. Fetch most recent template and fill it
    const templateResult = await pool.query(`
  SELECT * FROM templates
  WHERE course_id = $1
  UNION
  SELECT * FROM templates WHERE course_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1
`, [course_id]);


    if (templateResult.rows.length > 0) {
      const template = templateResult.rows[0];
      const outputFileName = `${studentName}_${title}_Form.pdf`.replace(/\s+/g, '_');
      await fillTemplate(template.filename, outputFileName, {
        studentName,
        studentId: student_id.toString(),
        courseTitle: title,
        instructorName: 'N/A',
        classDate: start_date.toISOString().split('T')[0],
      });
    }

    // 6. ✅ Send certificate email
   // 6. 🔕 Email sending skipped (SMTP not configured yet)
// await sendCertificateEmail(email, studentName, certPath);
console.log(`📦 Certificate ready for ${studentName} (email skipped)`);

    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error generating certificate/document:', err.message);
    res.status(500).json({ error: 'Failed to approve and generate documents' });
  }
});

module.exports = router;

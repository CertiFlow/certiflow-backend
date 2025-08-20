const knex = require('../db/knex');
const generateCertificate = require('../utils/generateCertificate');
const sendCertificateEmail = require('../utils/sendCertificateEmail');
const path = require('path');
const crypto = require('crypto');

exports.getAllAttendance = async (req, res) => {
  try {
    const data = await knex('attendance')
      .join('enrollments', 'attendance.enrollment_id', '=', 'enrollments.id')
      .select('attendance.*', 'enrollments.user_id', 'enrollments.course_id');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
};

exports.createAttendance = async (req, res) => {
  const { enrollment_id, date, attended } = req.body;

  if (!enrollment_id || !date) {
    return res.status(400).json({ error: 'enrollment_id and date are required.' });
  }

  try {
    const [record] = await knex('attendance')
      .insert({ enrollment_id, date, attended })
      .returning('*');

    if (attended) {
      const enrollment = await knex('enrollments').where({ id: enrollment_id }).first();
      const user = await knex('users').where({ id: enrollment.user_id }).first();
      const course = await knex('courses').where({ id: enrollment.course_id }).first();

      const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const pdfPath = await generateCertificate({
        studentName: user.name,
        courseTitle: course.title,
        issueDate: date,
        certificateId
      });

      await sendCertificateEmail({
        toEmail: user.email,
        studentName: user.name,
        courseTitle: course.title,
        certificatePath: pdfPath
      });

      await knex('certificates').insert({
        user_id: user.id,
        course_id: course.id,
        certificate_id: certificateId,
        issued_date: date,
        pdf_path: path.basename(pdfPath)
      });
    }

    res.status(201).json(record);
  } catch (err) {
    console.error('❌ Error in createAttendance:', err.message);
    res.status(500).json({ error: 'Failed to create attendance record.' });
  }
};

exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await knex('attendance').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    res.status(200).json({ message: 'Attendance record deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete attendance.' });
  }
};

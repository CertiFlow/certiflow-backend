const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const generateCertificatePDF = require('../utils/generateCertificate');

// 🔍 List all certificates (with optional search)
router.get('/', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  const { search } = req.query;

  try {
    const query = knex('certificates')
      .join('users', 'certificates.user_id', 'users.id')
      .join('courses', 'certificates.course_id', 'courses.id')
      .select(
        'certificates.id',
        'users.name as student_name',
        'users.email as student_email',
        'courses.title as course_title',
        'certificates.issued_date',
        'certificates.certificate_id'
      )
      .orderBy('certificates.issued_date', 'desc');

    if (search) {
      query.where(function () {
        this.whereILike('users.name', `%${search}%`)
            .orWhereILike('courses.title', `%${search}%`);
      });
    }

    const results = await query;
    res.json(results);
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// 📥 Generate a certificate PDF by cert DB ID
router.get('/:id/pdf', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  const certId = req.params.id;

  try {
    const cert = await knex('certificates')
      .join('users', 'certificates.user_id', 'users.id')
      .join('courses', 'certificates.course_id', 'courses.id')
      .where('certificates.id', certId)
      .first(
        'users.name as student_name',
        'courses.title as course_title',
        'certificates.issued_date',
        'certificates.certificate_id'
      );

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const pdfBuffer = await generateCertificatePDF(
      cert.student_name,
      cert.course_title,
      cert.certificate_id,
      new Date(cert.issued_date).toLocaleDateString()
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=certificate-${cert.certificate_id}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ✅ PUBLIC: Verify certificate by ID
router.get('/verify/:certificate_id', async (req, res) => {
  const { certificate_id } = req.params;

  try {
    const cert = await knex('certificates')
      .join('users', 'certificates.user_id', 'users.id')
      .join('courses', 'certificates.course_id', 'courses.id')
      .where('certificates.certificate_id', certificate_id)
      .orderBy('certificates.issued_date', 'desc')
      .first(
        'users.name as student_name',
        'courses.title as course_title',
        'certificates.issued_date',
        'certificates.expires_on',
        'certificates.revoked',
        'certificates.certificate_id'
      );

    if (!cert) {
      return res.status(404).json({ valid: false, message: 'Certificate not found' });
    }

    const today = new Date();
    const isExpired = cert.expires_on && new Date(cert.expires_on) < today;
    const isRevoked = cert.revoked;

    if (isExpired) {
      return res.json({
        valid: false,
        certificate_id: cert.certificate_id,
        message: 'Certificate has expired',
        expired: true,
      });
    }

    if (isRevoked) {
      return res.json({
        valid: false,
        certificate_id: cert.certificate_id,
        message: 'Certificate has been revoked',
        revoked: true,
      });
    }

    res.json({
      valid: true,
      certificate_id: cert.certificate_id,
      student: cert.student_name,
      course: cert.course_title,
      issued: cert.issued_date,
      expires_on: cert.expires_on || null,
    });
  } catch (err) {
    console.error('❌ Certificate verification failed:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

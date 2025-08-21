// routes/certificates.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const fs = require('fs');
const path = require('path');
const generateCertificate = require('../utils/generateCertificate');

// Where to put/generated PDFs (Render is read-only except /tmp)
const OUT_DIR =
  process.env.GEN_DOCS_DIR ||
  (process.env.RENDER || process.env.RENDER_EXTERNAL_URL
    ? '/tmp/generated-docs'
    : path.join(__dirname, '..', 'generated-docs'));

// tiny date helper -> YYYY-MM-DD
function toYMD(d) {
  if (!d) return new Date().toISOString().slice(0, 10);
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// soft auth: require a Bearer token header (don’t validate contents here)
// matches your prior behavior "Missing Authorization header"
function requireAuth(req, res, next) {
  const h = req.headers['authorization'] || '';
  if (!h || !/^Bearer\s+/.test(h)) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  next();
}

// (safety) ensure columns exist in prod if drifted
async function ensureCertificateColumns() {
  try {
    const { rows } = await pool.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name='certificates'
          AND column_name IN ('pdf_path','created_at','updated_at')`
    );
    const have = new Set(rows.map(r => r.column_name));
    const todo = [];
    if (!have.has('pdf_path'))   todo.push(`ADD COLUMN pdf_path VARCHAR(255)`);
    if (!have.has('created_at')) todo.push(`ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    if (!have.has('updated_at')) todo.push(`ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    if (todo.length) {
      await pool.query(`ALTER TABLE certificates ${todo.join(', ')}`);
    }
  } catch (e) {
    console.warn('⚠️ ensureCertificateColumns:', e.message);
  }
}

/**
 * GET /api/certificates
 * Auth required — returns latest certificates
 */
router.get('/', requireAuth, async (_req, res) => {
  try {
    await ensureCertificateColumns();
    const { rows } = await pool.query(`
      SELECT
        c.id,
        u.name  AS student_name,
        u.email AS student_email,
        cr.title AS course_title,
        c.issued_date,
        c.certificate_id,
        c.pdf_path
      FROM certificates c
      JOIN users   u  ON u.id  = c.user_id
      JOIN courses cr ON cr.id = c.course_id
      ORDER BY c.id DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ list certificates error:', err);
    res.status(500).json({ error: 'Failed to list certificates' });
  }
});

/**
 * GET /api/certificates/:id/download
 * Auth required — auto-regenerates PDF if missing and streams it
 */
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    await ensureCertificateColumns();

    const { rows } = await pool.query(
      `
      SELECT
        c.id,
        c.certificate_id,
        c.issued_date,
        c.pdf_path,
        u.name  AS student_name,
        cr.title AS course_title
      FROM certificates c
      JOIN users   u  ON u.id  = c.user_id
      JOIN courses cr ON cr.id = c.course_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const row = rows[0];
    let pdfPath = row.pdf_path;

    // if missing or file not present, regenerate to OUT_DIR and save path
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
      const filename = `${row.student_name}_${row.course_title}_Certificate.pdf`.replace(/\s+/g, '_');
      pdfPath = path.join(OUT_DIR, filename);

      await generateCertificate(
        row.student_name,
        row.course_title,
        row.certificate_id,
        toYMD(row.issued_date || new Date()),
        pdfPath
      );

      await pool.query(
        `UPDATE certificates
           SET pdf_path = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [pdfPath, row.id]
      );
    }

    // stream the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(pdfPath)}"`);
    fs.createReadStream(pdfPath)
      .on('error', (e) => {
        console.error('❌ pdf stream error:', e);
        res.status(500).json({ error: 'Failed to read PDF' });
      })
      .pipe(res);
  } catch (err) {
    console.error('❌ download certificate error:', err);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

/**
 * GET /api/certificates/verify/:certificateId
 * Public — flat shape expected by your VerifyCertificate page
 */
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const certId = req.params.certificateId;
    const { rows } = await pool.query(
      `
      SELECT
        c.certificate_id,
        c.issued_date,
        u.name   AS student_name,
        cr.title AS course_title
      FROM certificates c
      JOIN users   u  ON u.id  = c.user_id
      JOIN courses cr ON cr.id = c.course_id
      WHERE c.certificate_id = $1
      LIMIT 1
      `,
      [certId]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, message: 'Invalid certificate ID.' });
    }

    const r = rows[0];
    return res.json({
      valid: true,
      revoked: false,
      expired: false,
      certificate_id: r.certificate_id,
      student: r.student_name,
      course: r.course_title,
      issued: r.issued_date,
      // expires_on: null,
    });
  } catch (err) {
    console.error('❌ verify (compat) error:', err);
    res.status(500).json({ valid: false, message: 'Server error.' });
  }
});

module.exports = router;

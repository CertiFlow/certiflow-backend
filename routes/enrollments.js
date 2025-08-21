// routes/enrollments.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const generateCertificate = require('../utils/generateCertificate');
let fillTemplate = null; // make this optional so the route always mounts on Render
try {
  fillTemplate = require('../utils/fillTemplate');
} catch (e) {
  console.warn('⚠️ fillTemplate unavailable (optional):', e.message);
}
const fs = require('fs');
const path = require('path');

// Where to put generated PDFs (Render is read-only except /tmp)
const OUT_DIR =
  process.env.GEN_DOCS_DIR ||
  (process.env.RENDER || process.env.RENDER_EXTERNAL_URL
    ? '/tmp/generated-docs'
    : path.join(__dirname, '..', 'generated-docs'));

// ensure enrollments has passed/passed_at columns (prod safety)
async function ensureEnrollmentsPassColumns() {
  try {
    const { rows } = await pool.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name = 'enrollments'
          AND column_name IN ('passed','passed_at')`
    );
    const names = new Set(rows.map(r => r.column_name));
    if (!names.has('passed') || !names.has('passed_at')) {
      await pool.query(`
        ALTER TABLE enrollments
          ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS passed_at TIMESTAMPTZ
      `);
      // warm read so catalog is fresh
      await pool.query(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_name = 'enrollments'
            AND column_name IN ('passed','passed_at')`
      );
    }
  } catch (e) {
    console.warn('⚠️ ensureEnrollmentsPassColumns:', e.message);
  }
}

// handy date -> YYYY-MM-DD
function toYMD(d) {
  if (!d) return new Date().toISOString().slice(0, 10);
  try {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// List recent enrollments (helps find ids)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.id, e.user_id, e.course_id, e.passed, e.passed_at,
             u.name AS student_name, u.email AS student_email,
             c.title AS course_title
      FROM enrollments e
      LEFT JOIN users u   ON u.id = e.user_id
      LEFT JOIN courses c ON c.id = e.course_id
      ORDER BY e.id DESC
      LIMIT 25
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Failed to fetch enrollments:', err.message);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Approve a student and generate certificate + (optional) filled doc
router.patch('/:id/pass', async (req, res) => {
  const { id } = req.params;

  try {
    // 0) make sure the columns exist (handles prod drift)
    await ensureEnrollmentsPassColumns();

    // 1) Mark as passed
    let r1;
    try {
      r1 = await pool.query(
        'UPDATE enrollments SET passed = TRUE, passed_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
    } catch (e) {
      // in case of race or catalog lag, try once more
      if (String(e.code) === '42703' || /column "passed".*does not exist/i.test(e.message)) {
        await ensureEnrollmentsPassColumns();
        r1 = await pool.query(
          'UPDATE enrollments SET passed = TRUE, passed_at = NOW() WHERE id = $1 RETURNING *',
          [id]
        );
      } else {
        throw e;
      }
    }
    if (r1.rowCount === 0) return res.status(404).json({ error: 'Enrollment not found' });

    // 2) Get student + course info
    const { rows } = await pool.query(
      `
      SELECT
        e.user_id,
        e.course_id,
        u.name,
        u.email,
        u.id       AS student_id,
        c.title,
        c.start_date
      FROM enrollments e
      JOIN users u   ON e.user_id  = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1
      `,
      [id]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Student or course not found' });

    const { user_id, course_id, student_id, name, email, title, start_date } = rows[0];
    const studentName = name;
    const certId = `CERT-${Date.now()}-${user_id}`;

    // 3) Save certificate record (pdf_path will be set after PDF generation)
    await pool.query(
      `
      INSERT INTO certificates (user_id, course_id, certificate_id, issued_date, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [user_id, course_id, certId]
    );

    // 4) Generate Certificate PDF (ensure folder)
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    const certFilename = `${studentName}_${title}_Certificate.pdf`.replace(/\s+/g, '_');
    const certPath = path.join(OUT_DIR, certFilename);

    // Your util signature: (studentName, courseTitle, certificateId, dateString, outputPath)
    await generateCertificate(studentName, title, certId, toYMD(new Date()), certPath);

    // 5) Persist the pdf_path
    await pool.query(
      `UPDATE certificates
         SET pdf_path = $1, updated_at = CURRENT_TIMESTAMP
       WHERE certificate_id = $2`,
      [certPath, certId]
    );

    // 6) Try to fill the most recent template; soft-fail if missing
    if (fillTemplate) {
      try {
        const tRes = await pool.query(
          `
          SELECT * FROM templates
          WHERE course_id = $1
          UNION
          SELECT * FROM templates WHERE course_id IS NULL
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [course_id]
        );

        if (tRes.rows.length > 0) {
          const template = tRes.rows[0];
          const outputFileName = `${studentName}_${title}_Form.pdf`.replace(/\s+/g, '_');
          await fillTemplate(template.filename, outputFileName, {
            studentName,
            studentId: String(student_id),
            courseTitle: title,
            instructorName: 'N/A',
            classDate: toYMD(start_date),
          });
        }
      } catch (templateErr) {
        console.warn('⚠️ Template fill skipped:', templateErr.message);
        // no throw; certificate still succeeds
      }
    }

    console.log(`📦 Certificate ready for ${studentName} (email skipped)`);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Error generating certificate/document:', err);
    res.status(500).json({ error: 'Failed to approve and generate documents' });
  }
});

module.exports = router;

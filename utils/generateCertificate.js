const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const fs = require('fs');

async function generateCertificatePDF(studentName, courseName, certificateId, issueDate, outputPath) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.fontSize(24).text('Training Certificate', { align: 'center' });
  doc.moveDown();
  doc.fontSize(18).text(`This certifies that`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(22).text(studentName, { align: 'center', underline: true });
  doc.moveDown();
  doc.fontSize(16).text(`has completed the ${courseName} course`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Issued on: ${issueDate}`, { align: 'center' });
  doc.moveDown();
  doc.text(`Certificate ID: ${certificateId}`, { align: 'center' });

  // ✅ Generate QR code (URL to verify page)
  const verifyUrl = `http://localhost:5173/verify/${certificateId}`;
  const qrBuffer = await bwipjs.toBuffer({
    bcid: 'qrcode',
    text: verifyUrl,
    scale: 3,
    includetext: false,
  });

  doc.image(qrBuffer, doc.page.width / 2 - 50, doc.y + 30, { width: 100 });

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      resolve();
    });
  });
}

module.exports = generateCertificatePDF;

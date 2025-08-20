const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function fillTemplate(templateFileName, outputFileName, data) {
  const templatePath = path.join(__dirname, '..', 'uploads', 'templates', templateFileName);
  const outputPath = path.join(__dirname, '..', 'generated-docs', outputFileName);

  const existingPdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Example: Draw fields near top left
  firstPage.drawText(`Name: ${data.studentName}`, {
    x: 70,
    y: 700,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Student ID: ${data.studentId}`, {
    x: 70,
    y: 680,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Class: ${data.courseTitle}`, {
    x: 70,
    y: 660,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Instructor: ${data.instructorName}`, {
    x: 70,
    y: 640,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  firstPage.drawText(`Date: ${data.classDate}`, {
    x: 70,
    y: 620,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log('✅ PDF generated at:', outputPath);
  return outputPath;
}

module.exports = fillTemplate;

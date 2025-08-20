const generateCertificate = require('./utils/generateCertificate');
const sendCertificateEmail = require('./utils/sendCertificateEmail');

(async () => {
  const studentName = 'John Doe';
  const courseTitle = 'GWO BTT';
  const issueDate = '2024-08-01';
  const certificateId = 'CERT-20240501-001';
  const toEmail = 'nidalram14@gmail.com'; 

  const pdfPath = await generateCertificate({
    studentName,
    courseTitle,
    issueDate,
    certificateId
  });

  await sendCertificateEmail({
    toEmail,
    studentName,
    courseTitle,
    certificatePath: pdfPath
  });
})();

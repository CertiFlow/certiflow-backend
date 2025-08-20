// utils/sendCertificateEmail.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendCertificateEmail = async (email, fullName, certPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'hotmail', 'outlook', etc.
    auth: {
      user: process.env.SMTP_USER, // e.g., certiflow@gmail.com
      pass: process.env.SMTP_PASS  // app password
    }
  });

  const mailOptions = {
    from: `"CertiFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Certificate is Ready',
    text: `Hi ${fullName},\n\nCongratulations! Your certificate is attached.\n\nThanks,\nCertiFlow Team`,
    attachments: [
      {
        filename: path.basename(certPath),
        path: certPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendCertificateEmail;

const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// 4. Add a .env validation check on server startup:
if (!emailUser || emailUser.trim() === '' || !emailPass || emailPass.trim() === '' || emailUser === 'your_gmail_username@gmail.com' || emailPass === 'your_gmail_app_password') {
  console.warn("WARNING: EMAIL_USER or EMAIL_PASS not set — email features will not work");
}

// 1. Fix Nodemailer configuration:
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Add transporter.verify() on server startup that logs "Mail server connected successfully" or the exact error to terminal
transporter.verify((error, success) => {
  if (error) {
    console.error("Mail server connection error:", error);
  } else {
    console.log("Mail server connected successfully");
  }
});

module.exports = transporter;

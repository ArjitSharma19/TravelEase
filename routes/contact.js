/*
 * Copyright (c) 2026 MyCompany LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// POST /
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Save to database
    const newContact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim()
    });
    await newContact.save();

    // Send email notification to site admin via existing Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const adminEmail = process.env.EMAIL_USER || 'admin@travelease.com';
    const mailOptions = {
      from: `"TravelEase Support" <${process.env.EMAIL_USER || 'no-reply@travelease.com'}>`,
      to: adminEmail,
      subject: `[Contact Form] Message from ${name}`,
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dbe4f0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-top: 0; border-bottom: 2px solid #1a73e8; padding-bottom: 8px;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f5f7fa; padding: 15px; border-radius: 6px; border-left: 4px solid #00BFA5; color: #333; white-space: pre-wrap;">${message}</div>
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`Contact notification email sent successfully to site admin: ${adminEmail}`);
      } else {
        console.warn('EMAIL_USER and EMAIL_PASS environment variables are not configured. Logging contact email to console.');
        console.log(`[DEV MODE] Email Content:\nTo: ${adminEmail}\nSubject: ${mailOptions.subject}\nBody: ${message}`);
      }
    } catch (emailErr) {
      console.error('Nodemailer failed to send contact notification email:', emailErr.message);
    }

    res.status(200).json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact form. Please try again later.' });
  }
});

module.exports = router;

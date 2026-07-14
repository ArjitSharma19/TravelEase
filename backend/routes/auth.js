const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        photo: picture,
        authProvider: 'google',
        isEmailVerified: true, // Google accounts are pre-verified
        // default settings matching normal signups
        passportCountry: 'India',
        destination: '',
        tripPurpose: 'tourism',
        isFirstTimeAbroad: false,
        travelersCount: 1,
        budgetRange: 'mid-range'
      });
      await user.save();
    } else {
      // If the user already exists, make sure they are marked as using google auth provider if needed,
      // or simply update their photo if they don't have one.
      if (!user.authProvider || user.authProvider === 'local') {
        user.authProvider = 'google';
      }
      user.isEmailVerified = true; // Pre-verify on login/conversion
      if (picture && !user.photo) {
        user.photo = picture;
      }
      await user.save();
    }

    // Generate JWT token matching the main server.js signups and logins
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'travelease_secure_jwt_secret_token_key_2026',
      { expiresIn: '7d' }
    );
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ success: true, token: jwtToken, user: userResponse });
    
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always respond with the same success message to prevent user enumeration
    const successResponse = { success: true, message: 'OTP sent if account exists' };

    if (!user) {
      return res.json(successResponse);
    }

    // Reset OTP attempts and blocks on request
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Set OTP and 10-minute expiry
    user.resetOTP = hashedOtp;
    user.resetOTPExpiry = Date.now() + 600000; // 10 minutes
    await user.save();

    // Configure Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"TravelEase Support" <${process.env.EMAIL_USER || 'no-reply@travelease.com'}>`,
      to: user.email,
      subject: 'TravelEase Password Reset OTP',
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dbe4f0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-top: 0;">Password Reset OTP</h2>
          <p>Hi ${user.name || 'Traveler'},</p>
          <p>You requested an OTP to reset your password for your TravelEase account. Please use the following 6-digit OTP to verify your identity:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 6px; color: #1a73e8; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">${otp}</span>
          </div>
          <p style="font-weight: bold; color: #cf2e2e; text-align: center;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #dbe4f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #5e6b7e;">This is an automated email. Please do not reply directly.</p>
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset OTP successfully sent to: ${user.email}`);
      } else {
        console.warn('EMAIL_USER and EMAIL_PASS environment variables are not configured.');
        console.log(`[DEVELOPMENT MODE] OTP for ${user.email}: ${otp}`);
      }
    } catch (emailErr) {
      console.error('Nodemailer failed to send OTP email:', emailErr);
      // Still print the OTP in the console so developers don't get stuck if Gmail SMTP fails
      console.log(`[DEVELOPMENT MODE] OTP for ${user.email}: ${otp}`);
    }

    return res.json(successResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Check if OTP attempts are blocked
    if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.otpBlockedUntil - Date.now()) / 60000);
      return res.status(400).json({ error: `OTP blocked — please wait ${waitMinutes} minutes` });
    }

    // Check if OTP has expired
    if (!user.resetOTPExpiry || user.resetOTPExpiry < Date.now()) {
      return res.status(400).json({ error: 'OTP expired — request a new one' });
    }

    const hashedIncomingOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    if (user.resetOTP !== hashedIncomingOtp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      
      if (user.otpAttempts >= 5) {
        user.otpBlockedUntil = Date.now() + 30 * 60000; // 30 minutes
        await user.save();
        return res.status(400).json({ error: 'OTP blocked — please wait 30 minutes' });
      }

      await user.save();
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({ error: `Incorrect OTP, ${remaining} attempts remaining` });
    }

    // OTP is correct! Reset attempts on success, but keep OTP valid until reset-password is called
    user.otpAttempts = 0;
    await user.save();

    res.json({ success: true, otpVerified: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'An error occurred during OTP verification.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Email, OTP, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Re-verify OTP block
    if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.otpBlockedUntil - Date.now()) / 60000);
      return res.status(400).json({ error: `OTP blocked — please wait ${waitMinutes} minutes` });
    }

    // Re-verify OTP expiry
    if (!user.resetOTPExpiry || user.resetOTPExpiry < Date.now()) {
      return res.status(400).json({ error: 'OTP expired — request a new one' });
    }

    // Re-verify OTP value
    const hashedIncomingOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (user.resetOTP !== hashedIncomingOtp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      
      if (user.otpAttempts >= 5) {
        user.otpBlockedUntil = Date.now() + 30 * 60000;
        await user.save();
        return res.status(400).json({ error: 'OTP blocked — please wait 30 minutes' });
      }

      await user.save();
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({ error: `Incorrect OTP, ${remaining} attempts remaining` });
    }

    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // Clear the reset and OTP fields
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    await user.save();

    res.json({ success: true, message: 'password reset successfully — please log in' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});


router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      verificationToken: hashedToken
    });

    if (!user) {
      return res.redirect('/index.html?verify=invalid');
    }

    if (user.verificationTokenExpiry < Date.now()) {
      return res.redirect(`/index.html?verify=expired&email=${encodeURIComponent(user.email)}`);
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.redirect('/index.html?verify=success');
  } catch (error) {
    console.error('Verify email error:', error);
    res.redirect('/index.html?verify=error');
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'Verification email sent, please check your inbox' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = Date.now() + 86400000; // 24 hours
    await user.save();

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${origin}/api/auth/verify-email/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"TravelEase Support" <${process.env.EMAIL_USER || 'no-reply@travelease.com'}>`,
      to: user.email,
      subject: 'TravelEase - Verify Your Email Address',
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dbe4f0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-top: 0;">Email Verification Required</h2>
          <p>Hi ${user.name || 'Traveler'},</p>
          <p>Thank you for registering with TravelEase. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #5e6b7e;">${verifyUrl}</p>
          <hr style="border: 0; border-top: 1px solid #dbe4f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #5e6b7e;">This link is valid for 24 hours.</p>
        </div>
      `
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to: ${user.email}`);
      } else {
        console.warn('EMAIL_USER and EMAIL_PASS not configured.');
        console.log(`[DEVELOPMENT MODE] Verification link: ${verifyUrl}`);
      }
    } catch (emailErr) {
      console.error('Nodemailer verification email failed:', emailErr);
      console.log(`[DEVELOPMENT MODE] Verification link: ${verifyUrl}`);
    }

    res.json({ success: true, message: 'Verification email sent, please check your inbox' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

module.exports = router;

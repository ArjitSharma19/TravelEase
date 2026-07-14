const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const transporter = require('../utils/mailer');
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

    const mailOptions = {
      from: `"TravelEase Support" <${process.env.EMAIL_USER || 'no-reply@travelease.com'}>`,
      to: user.email,
      subject: 'TravelEase Password Reset OTP',
      text: `TravelEase\n\nHi ${user.name || 'Traveler'},\n\nYou requested a One-Time Password (OTP) to reset your password for your TravelEase account. Please use the following 6-digit OTP to verify your identity:\n\nOTP: ${otp}\n\nSecurity Warnings:\n- This OTP expires in 10 minutes.\n- Do not share this OTP with anyone.\n\nIf you did not request a password reset, please ignore this email.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #1a73e8; padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">TravelEase</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">
            <h2 style="margin-top: 0; font-size: 20px; color: #1e293b; font-weight: 600;">Verification Code</h2>
            <p>Hi ${user.name || 'Traveler'},</p>
            <p>You requested a One-Time Password (OTP) to reset your password. Use the code below to complete your reset:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: 700; color: #0d9488; letter-spacing: 8px; background-color: #f0fdfa; border: 1.5px solid #99f6e4; padding: 12px 30px; border-radius: 8px; display: inline-block;">${otp}</span>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; font-weight: 600; color: #991b1b; font-size: 14px;">⚠️ Security Warnings:</p>
              <ul style="margin: 6px 0 0 0; padding-left: 20px; color: #991b1b; font-size: 13px;">
                <li>This OTP expires in 10 minutes.</li>
                <li>Do not share this OTP with anyone.</li>
              </ul>
            </div>
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you did not request a password reset, please ignore this email.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
            This is an automated email. Please do not reply directly.
          </div>
        </div>
      `
    };

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER.includes('your_gmail_username') || process.env.EMAIL_PASS.includes('your_gmail_app_password')) {
        console.warn('EMAIL_USER and EMAIL_PASS environment variables are not configured correctly for forgot password OTP.');
        console.log(`[DEVELOPMENT MODE] OTP for ${user.email}: ${otp}`);
        return res.json(successResponse);
      }

      await transporter.sendMail(mailOptions);
      console.log(`Password reset OTP successfully sent to: ${user.email}`);
      return res.json(successResponse);
    } catch (emailErr) {
      console.error('Nodemailer failed to send OTP email:', emailErr);
      // Still print the OTP in the console so developers don't get stuck if Gmail SMTP fails
      console.log(`[DEVELOPMENT MODE] OTP for ${user.email}: ${otp}`);
      return res.status(500).json({ error: 'Failed to send OTP email — please try again' });
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

    // Using imported transporter from centralized mailer utility

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

// 5. Add a test email route for development only:
// GET /api/auth/test-email that sends a test email to EMAIL_USER itself
router.get('/test-email', async (req, res) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    if (!emailUser || emailUser.trim() === '' || emailUser === 'your_gmail_username@gmail.com') {
      return res.status(400).json({ success: false, error: 'EMAIL_USER environment variable is not configured.' });
    }

    const mailOptions = {
      from: `"TravelEase Support" <${emailUser}>`,
      to: emailUser,
      subject: 'TravelEase Mail Test',
      text: 'If you see this, Nodemailer is working correctly.'
    };

    await transporter.sendMail(mailOptions);
    console.log(`Test email successfully sent to: ${emailUser}`);
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Nodemailer test email failed:', error);
    res.status(500).json({ success: false, error: `Failed to send test email: ${error.message}` });
  }
});

module.exports = router;

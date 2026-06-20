const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
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

module.exports = router;

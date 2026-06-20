const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Comment = require('./models/Comment');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const flightRoutes = require('./routes/flights');
app.use('/api/flights', flightRoutes);

// Serve static files from the root directory
app.use(express.static(__dirname));

// Connect to MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelease';
mongoose.connect(dbUri)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Ensure MongoDB is installed and running on your system.');
  });

// Route for serving the main index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for serving the destination.html file
app.get('/destination.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'destination.html'));
});

// Authentication Middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelease_secure_jwt_secret_token_key_2026');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
};

// POST Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, passportCountry, passportExpiry, destination, travelDateFrom, travelDateTo, tripPurpose, isFirstTimeAbroad, travelersCount, budgetRange } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      passportCountry: passportCountry || 'India',
      passportExpiry,
      destination: destination || '',
      travelDateFrom,
      travelDateTo,
      tripPurpose: tripPurpose || 'tourism',
      isFirstTimeAbroad: !!isFirstTimeAbroad,
      travelersCount: travelersCount || 1,
      budgetRange: budgetRange || 'mid-range'
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'travelease_secure_jwt_secret_token_key_2026', { expiresIn: '7d' });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to register traveler. Please try again.' });
  }
});

// POST Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'travelease_secure_jwt_secret_token_key_2026', { expiresIn: '7d' });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// GET profile
app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Traveler not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to load traveler profile.' });
  }
});

// PUT profile
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, passportCountry, passportExpiry, destination, travelDateFrom, travelDateTo, tripPurpose, isFirstTimeAbroad, travelersCount, budgetRange } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Traveler not found.' });
    }

    if (name !== undefined) user.name = name;
    if (passportCountry !== undefined) user.passportCountry = passportCountry;
    if (passportExpiry !== undefined) user.passportExpiry = passportExpiry;
    if (destination !== undefined) user.destination = destination;
    if (travelDateFrom !== undefined) user.travelDateFrom = travelDateFrom;
    if (travelDateTo !== undefined) user.travelDateTo = travelDateTo;
    if (tripPurpose !== undefined) user.tripPurpose = tripPurpose;
    if (isFirstTimeAbroad !== undefined) user.isFirstTimeAbroad = !!isFirstTimeAbroad;
    if (travelersCount !== undefined) user.travelersCount = travelersCount;
    if (budgetRange !== undefined) user.budgetRange = budgetRange;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update traveler profile. Please check inputs and try again.' });
  }
});

// Database verification endpoint
app.get('/api/db-test', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  if (dbStatus !== 1) {
    return res.status(500).json({
      status: 'error',
      connection: statusNames[dbStatus] || 'unknown',
      message: 'Database is not connected. Please ensure MongoDB is running locally or check your MONGODB_URI connection string.'
    });
  }

  try {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `test-${randomSuffix}@travelease.com`;

    const newUser = new User({
      email: testEmail,
      name: 'Traveler Test User'
    });

    await newUser.save();

    const foundUser = await User.findOne({ email: testEmail });

    res.json({
      status: 'success',
      connection: 'connected',
      message: 'Successfully connected to MongoDB, wrote a test document, and read it back!',
      data: {
        id: foundUser._id,
        email: foundUser.email,
        name: foundUser.name,
        createdAt: foundUser.createdAt
      }
    });
  } catch (error) {
    console.error('Database write/read error during test:', error);
    res.status(500).json({
      status: 'error',
      connection: 'connected',
      message: 'Failed to write or read test document.',
      error: error.message
    });
  }
});

// GET Comments by Country Code
app.get('/api/comments/:countryCode', async (req, res) => {
  const { countryCode } = req.params;
  try {
    const comments = await Comment.find({ countryCode: countryCode.toUpperCase() })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch community comments.' });
  }
});

// POST a New Comment
app.post('/api/comments', async (req, res) => {
  const { countryCode, userName, userEmail, category, text, tripPeriod } = req.body;

  if (!countryCode || !userName || !text) {
    return res.status(400).json({ error: 'Country, Name, and Comment text are required.' });
  }

  try {
    const newComment = new Comment({
      countryCode: countryCode.toUpperCase(),
      userName,
      userEmail,
      category: category || 'general',
      text,
      tripPeriod
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// POST to Upvote/Like a Comment
app.post('/api/comments/:commentId/like', async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    comment.likes += 1;
    await comment.save();
    res.json(comment);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to upvote comment.' });
  }
});

// Helper function to handle fetch retries on transient errors like HTTP 503 (high demand)
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (response.status === 503 && retries > 0) {
      console.warn(`Gemini API returned 503 (High Demand). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch connection error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Proxy route for communicating with the Google Gemini API
app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return res.status(500).json({
      error: 'Gemini API key is not configured. Please add your real API key to the .env file and restart the server.'
    });
  }

  // Map incoming messages to Gemini's contents format
  const contents = (messages || []).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const systemInstruction = system ? { parts: [{ text: system }] } : undefined;

  try {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && { systemInstruction })
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (${response.status}):`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return res.status(response.status).json({
          error: errorJson.error?.message || `Gemini API error: ${response.statusText}`
        });
      } catch (parseError) {
        return res.status(response.status).json({
          error: `Gemini API error: ${response.statusText}`
        });
      }
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    res.json({ text: generatedText });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    res.status(500).json({ error: 'Failed to communicate with the travel assistant.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`TravelEase server running at http://localhost:${PORT}`);
});

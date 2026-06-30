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

const checklistRoutes = require('./routes/checklist');
app.use('/api/checklist', checklistRoutes);

const tripRoutes = require('./routes/trip');
app.use('/api/trip', tripRoutes);

// Serve static files from the root directory
app.use(express.static(__dirname));

// Connect to MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelease';
mongoose.connect(dbUri)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    await seedCommentsIfNeeded();
  })
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

// Database Seeder for Community Comments
async function seedCommentsIfNeeded() {
  try {
    const count = await Comment.countDocuments();
    if (count > 5) {
      console.log('Comments database already contains data. Skipping seed.');
      return;
    }

    console.log('Seeding initial community comments...');
    const seedData = [
      {
        countryCode: 'THAILAND',
        userName: 'Sujit Kumar',
        tripPeriod: 'May 2026',
        category: 'visa',
        text: 'Indian passport holders currently get visa-free entry for up to 30 days. Immigration at Suvarnabhumi was very fast—just show your return ticket and passport valid for 6 months. Make sure you print a copy of your return flight ticket, they asked me for it.',
        likes: 8
      },
      {
        countryCode: 'THAILAND',
        userName: 'Meera Nair',
        tripPeriod: 'April 2026',
        category: 'currency',
        text: 'For Thailand, Forex cards work in major malls but local street vendors and night markets only take Cash (Thai Baht). Standard ATM withdrawal fee is 220 Baht per transaction, so withdraw larger amounts to save on fees. Also, Superrich exchange shops have the best rates.',
        likes: 12
      },
      {
        countryCode: 'THAILAND',
        userName: 'Karan Johar',
        tripPeriod: 'June 2026',
        category: 'sim',
        text: 'Buy an eSIM online before you land or get a physical DTAC tourist SIM at the airport. It costs about 299 Baht for unlimited 5G data for 8 days. Avoid hotel SIMs, they are double the price.',
        likes: 5
      },
      {
        countryCode: 'THAILAND',
        userName: 'Anish G.',
        tripPeriod: 'March 2026',
        category: 'transport',
        text: 'Download the Grab and Bolt apps before travelling. Taxis at tourist hubs like Bangkok Sukhumvit will try to quote flat rates instead of using the meter. Bolt is usually cheaper than Grab, but Grab has more drivers.',
        likes: 7
      },
      {
        countryCode: 'UAE',
        userName: 'Rohan Gupta',
        tripPeriod: 'May 2026',
        category: 'visa',
        text: 'Applied for the 30-day tourist e-visa. It got approved in less than 48 hours. Make sure you upload a clear color photo and passport front/back pages. Keep a printed copy with you when boarding, the airline checked it during counter check-in.',
        likes: 15
      },
      {
        countryCode: 'UAE',
        userName: 'Kunal Shah',
        tripPeriod: 'Feb 2026',
        category: 'currency',
        text: 'Dubai is heavily digital. My Niyo Forex card worked everywhere—from the metro stations to corner shawarma shops. Kept only 200 AED cash and barely used it. Tap-to-pay is accepted everywhere.',
        likes: 9
      },
      {
        countryCode: 'UAE',
        userName: 'Sneha Patil',
        tripPeriod: 'April 2026',
        category: 'transport',
        text: 'Buy a Silver Nol Card as soon as you land at Dubai Airport (DXB). The Dubai Metro is very clean, efficient, and cheap. Avoid cabs during rush hours (5-7 PM) near Downtown Dubai, traffic is gridlocked.',
        likes: 11
      },
      {
        countryCode: 'USA',
        userName: 'Priyanka S.',
        tripPeriod: 'April 2026',
        category: 'visa',
        text: 'Immigration officer at JFK asked to see my return flight details and hotel bookings. They also asked what business meetings I was attending. Be polite, direct, and keep all documents printed in a folder handy.',
        likes: 21
      },
      {
        countryCode: 'USA',
        userName: 'Amit Patel',
        tripPeriod: 'June 2026',
        category: 'transport',
        text: 'In NYC, do not bother with cabs. Just download the Transit app or Google Maps and use the MTA subway. You can pay directly at the turnstiles using contactless credit cards via OMNY. Much cheaper and faster.',
        likes: 14
      },
      {
        countryCode: 'UK',
        userName: 'Vikram Malhotra',
        tripPeriod: 'May 2026',
        category: 'currency',
        text: "London is completely cashless now! Many pubs and cafes have signs saying 'Card Only'. Don't convert too much cash. Forex card or standard contactless international card is all you need.",
        likes: 18
      },
      {
        countryCode: 'UK',
        userName: 'Nisha Sharma',
        tripPeriod: 'May 2026',
        category: 'transport',
        text: 'If you are planning to travel between London and cities like Edinburgh or Manchester, book your train tickets weeks in advance via LNER or Trainline. On-the-day tickets are outrageously expensive.',
        likes: 13
      },
      {
        countryCode: 'SINGAPORE',
        userName: 'Arun Iyer',
        tripPeriod: 'June 2026',
        category: 'visa',
        text: "Don't forget to submit the SG Arrival Card (SGAC) online within 3 days before your arrival. It's free of cost on the ICA website. Airlines will not let you check in without the email confirmation. Automated gates at Changi are amazing!",
        likes: 16
      },
      {
        countryCode: 'SINGAPORE',
        userName: 'Rajesh M.',
        tripPeriod: 'April 2026',
        category: 'transport',
        text: "Get the Ez-Link card or use your contactless international credit card directly on buses and the MRT. Singapore's transit system is top tier. Cabs are expensive, especially during peak hour surcharges.",
        likes: 8
      },
      {
        countryCode: 'JAPAN',
        userName: 'Tanya Sen',
        tripPeriod: 'May 2026',
        category: 'sim',
        text: 'Pocket Wi-Fi or eSIM is a MUST in Japan. Google Maps is essential for navigating the complex Tokyo subway exits and train lines. Picked up a Ninja WiFi pocket router at Narita airport and returned it at Haneda, very convenient.',
        likes: 19
      },
      {
        countryCode: 'JAPAN',
        userName: 'Rahul Verma',
        tripPeriod: 'May 2026',
        category: 'currency',
        text: 'Japan is still a cash-heavy country despite modern appearances. Small ramen shops, coin lockers, and shrines only take coins/cash. Load cash onto a Suica or Pasmo card on your phone (Apple Wallet) to easily pay at convenience stores.',
        likes: 25
      },
      {
        countryCode: 'CANADA',
        userName: 'Girish Rawat',
        tripPeriod: 'May 2026',
        category: 'general',
        text: 'If visiting national parks like Banff, buy your park passes online in advance. Also, check weather notices daily as mountain conditions change in minutes. Layers are your best friend!',
        likes: 10
      },
      {
        countryCode: 'AUSTRALIA',
        userName: 'Deepa Rao',
        tripPeriod: 'March 2026',
        category: 'general',
        text: 'Australia biosecurity rules are incredibly strict. Declare all food items, seeds, and wooden souvenirs at customs. Fines are very high for undeclared fresh food or plants.',
        likes: 14
      }
    ];

    await Comment.insertMany(seedData);
    console.log(`Successfully seeded ${seedData.length} community comments.`);
  } catch (error) {
    console.error('Error seeding comments database:', error);
  }
}

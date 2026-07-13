const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

const newsletterRoutes = require('./routes/newsletter');
app.use('/api/newsletter', newsletterRoutes);

const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);

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

// Route for serving the explore.html file
app.get('/explore.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'explore.html'));
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

  // 1. Strict frontend-backend matching Regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // 2. DNS MX domain verification
  const emailParts = email.split('@');
  const domain = emailParts[emailParts.length - 1];
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return res.status(400).json({ error: 'Email domain does not exist — please use a real email address' });
    }
  } catch (dnsErr) {
    console.warn(`DNS MX lookup failed for ${domain}:`, dnsErr.message);
    return res.status(400).json({ error: 'Email domain does not exist — please use a real email address' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationTokenRaw = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationTokenRaw).digest('hex');

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
      budgetRange: budgetRange || 'mid-range',
      isEmailVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry: Date.now() + 86400000 // 24 hours
    });

    await newUser.save();

    // Send verification email via Nodemailer
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${origin}/api/auth/verify-email/${verificationTokenRaw}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"TravelEase Support" <${process.env.EMAIL_USER || 'no-reply@travelease.com'}>`,
      to: email.toLowerCase(),
      subject: 'TravelEase - Verify Your Email Address',
      html: `
        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dbe4f0; border-radius: 8px;">
          <h2 style="color: #1a73e8; margin-top: 0;">Email Verification Required</h2>
          <p>Hi ${name || 'Traveler'},</p>
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
        console.log(`Verification email successfully sent to: ${email}`);
      } else {
        console.warn('EMAIL_USER and EMAIL_PASS environment variables are not configured for verification email.');
        console.log(`[DEVELOPMENT MODE] Verification link: ${verifyUrl}`);
      }
    } catch (emailErr) {
      console.error('Nodemailer verification email failed to send:', emailErr);
      console.log(`[DEVELOPMENT MODE] Verification link: ${verifyUrl}`);
    }

    res.status(201).json({ message: 'Verification email sent, please check your inbox' });
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

    // Block unverified local accounts
    if (user.authProvider !== 'google' && !user.isEmailVerified) {
      return res.status(400).json({ error: 'Please verify your email first' });
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

// GET Top 3 Community Comments for Testimonials Strip
app.get('/api/comments/top/testimonials', async (req, res) => {
  try {
    const topComments = await Comment.find({})
      .sort({ likes: -1 })
      .limit(3);
    res.json(topComments);
  } catch (error) {
    console.error('Error fetching top comments for testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials.' });
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

// Proxy route for fetching country details securely via REST Countries v5 API
app.get('/api/countries/:countryName', async (req, res) => {
  const { countryName } = req.params;
  const apiKey = process.env.REST_COUNTRIES_API_KEY;

  // Fallback to public v3.1 API if API key is not configured
  if (!apiKey || apiKey === 'YOUR_REST_COUNTRIES_API_KEY' || apiKey.trim() === '') {
    console.log(`REST Countries API key not configured, falling back to public v3.1 for: ${countryName}`);
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch country details from public API' });
      }
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error fetching public REST Countries v3.1 data:', error);
      return res.status(500).json({ error: 'Failed to fetch country details' });
    }
  }

  try {
    const url = `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(countryName)}`;
    console.log(`Fetching from REST Countries v5: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`REST Countries v5 API returned status ${response.status}: ${errText}. Falling back to public v3.1.`);
      
      // Fallback to public v3.1
      const publicResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        return res.json(publicData);
      }
      return res.status(response.status).json({ error: `REST Countries API returned error: ${response.statusText}` });
    }

    const result = await response.json();

    // Normalise v5 response format `{"data":{"objects":[...]}}` to match v3.1 format `[...]`
    if (result && result.data && result.data.objects && Array.isArray(result.data.objects)) {
      const normalized = result.data.objects.map(country => {
        const normalizedCountry = {
          name: country.names ? {
            common: country.names.common || '',
            official: country.names.official || ''
          } : undefined,
          cca2: country.codes ? country.codes.alpha_2 : undefined,
          capital: Array.isArray(country.capitals) ? country.capitals.map(c => c.name) : undefined,
          region: country.region,
          languages: {},
          currencies: {},
          flag: country.flag ? country.flag.emoji : undefined
        };

        if (Array.isArray(country.languages)) {
          country.languages.forEach(l => {
            if (l.name) {
              normalizedCountry.languages[l.bcp47 || l.name] = l.name;
            }
          });
        }

        if (Array.isArray(country.currencies)) {
          country.currencies.forEach(c => {
            if (c.code) {
              normalizedCountry.currencies[c.code] = {
                name: c.name || '',
                symbol: c.symbol || ''
              };
            }
          });
        }

        return normalizedCountry;
      });

      return res.json(normalized);
    }

    res.json([]);
  } catch (error) {
    console.error('Error calling REST Countries API proxy:', error);
    // Attempt last-resort fallback to public v3.1
    try {
      const publicResponse = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        return res.json(publicData);
      }
    } catch (fallbackError) {
      console.error('Last-resort fallback to public v3.1 failed:', fallbackError);
    }
    res.status(500).json({ error: 'Failed to retrieve country details' });
  }
});

// Proxy route for fetching high-quality landscape photos from Unsplash
app.get('/api/images/:query', async (req, res) => {
  const { query } = req.params;
  const apiKey = process.env.UNSPLASH_API_KEY;

  if (!apiKey || apiKey === 'YOUR_UNSPLASH_API_KEY' || apiKey.trim() === '') {
    console.warn("Unsplash API key not configured, returning empty image list.");
    return res.json([]);
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' travel landscape')}&per_page=6&orientation=landscape`;
    console.log(`Fetching photos from Unsplash for: ${query}`);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Unsplash API Error (${response.status}):`, errText);
      return res.json([]);
    }

    const data = await response.json();
    if (data && Array.isArray(data.results)) {
      const imageUrls = data.results.map(img => img.urls.regular || img.urls.full);
      return res.json(imageUrls);
    }
    res.json([]);
  } catch (error) {
    console.error('Error fetching from Unsplash API:', error);
    res.json([]);
  }
});

// Cache for the full countries list to avoid querying the external API on every page load
let countriesCache = null;

app.get('/api/countries-list', async (req, res) => {
  if (countriesCache) {
    return res.json(countriesCache);
  }

  const apiKey = process.env.REST_COUNTRIES_API_KEY;

  // Fallback static list of countries if key not configured or API fails
  const staticFallback = [
    { name: "United Arab Emirates", officialName: "United Arab Emirates", cca2: "AE", flag: "🇦🇪" },
    { name: "United States", officialName: "United States of America", cca2: "US", flag: "🇺🇸" },
    { name: "United Kingdom", officialName: "United Kingdom of Great Britain and Northern Ireland", cca2: "GB", flag: "🇬🇧" },
    { name: "Thailand", officialName: "Kingdom of Thailand", cca2: "TH", flag: "🇹🇭" },
    { name: "Singapore", officialName: "Republic of Singapore", cca2: "SG", flag: "🇸🇬" },
    { name: "Japan", officialName: "Japan", cca2: "JP", flag: "🇯🇵" },
    { name: "Canada", officialName: "Canada", cca2: "CA", flag: "🇨🇦" },
    { name: "Australia", officialName: "Commonwealth of Australia", cca2: "AU", flag: "🇦🇺" },
    { name: "Germany", officialName: "Federal Republic of Germany", cca2: "DE", flag: "🇩🇪" },
    { name: "France", officialName: "French Republic", cca2: "FR", flag: "🇫🇷" },
    { name: "Italy", officialName: "Italian Republic", cca2: "IT", flag: "🇮🇹" },
    { name: "Spain", officialName: "Kingdom of Spain", cca2: "ES", flag: "🇪🇸" },
    { name: "Switzerland", officialName: "Swiss Confederation", cca2: "CH", flag: "🇨🇭" },
    { name: "South Africa", officialName: "Republic of South Africa", cca2: "ZA", flag: "🇿🇦" },
    { name: "India", officialName: "Republic of India", cca2: "IN", flag: "🇮🇳" }
  ];

  if (!apiKey || apiKey === 'YOUR_REST_COUNTRIES_API_KEY' || apiKey.trim() === '') {
    console.log("REST Countries API key not configured, returning static fallback list.");
    return res.json(staticFallback);
  }

  try {
    const allObjects = [];
    const limit = 100;
    
    // Paginate through REST Countries v5 API
    for (let offset = 0; offset < 300; offset += limit) {
      const url = `https://api.restcountries.com/countries/v5?limit=${limit}&offset=${offset}`;
      console.log(`Caching countries from REST Countries v5 offset ${offset}...`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`REST Countries API returned status ${response.status}`);
      }
      
      const result = await response.json();
      if (result && result.data && Array.isArray(result.data.objects)) {
        allObjects.push(...result.data.objects);
        if (result.data.objects.length < limit) {
          break;
        }
      } else {
        break;
      }
    }

    if (allObjects.length > 0) {
      countriesCache = allObjects.map(country => ({
        name: country.names?.common || '',
        officialName: country.names?.official || '',
        cca2: country.codes?.alpha_2 || '',
        flag: country.flag?.emoji || '🌍'
      })).filter(c => c.name !== '');
      console.log(`Cached ${countriesCache.length} countries successfully.`);
      return res.json(countriesCache);
    }

    res.json(staticFallback);
  } catch (error) {
    console.error('Error fetching countries list from API, using fallback:', error);
    res.json(staticFallback);
  }
});

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

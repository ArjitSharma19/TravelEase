const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

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

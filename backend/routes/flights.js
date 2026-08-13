const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// Global variables for cached Amadeus API token
let cachedToken = null;
let tokenExpiry = null;

const AIRLINES = {
  EK: "Emirates",
  AI: "Air India",
  UK: "Vistara",
  "6E": "IndiGo",
  EY: "Etihad Airways",
  QR: "Qatar Airways",
  AA: "American Airlines",
  DL: "Delta Air Lines",
  LH: "Lufthansa",
  AF: "Air France",
  CX: "Cathay Pacific",
  SQ: "Singapore Airlines",
  BA: "British Airways",
  TG: "Thai Airways",
  JL: "Japan Airlines",
  AC: "Air Canada",
  QF: "Qantas",
  FZ: "flydubai"
};

const typicalPrices = {
  'DEL-DXB': 25000, 'DXB-DEL': 25000,
  'DEL-JFK': 75000, 'JFK-DEL': 75000,
  'DEL-LHR': 55000, 'LHR-DEL': 55000,
  'DEL-BKK': 18000, 'BKK-DEL': 18000,
  'DEL-SIN': 25000, 'SIN-DEL': 25000,
  'DEL-NRT': 40000, 'NRT-DEL': 40000,
  'DEL-YYZ': 85000, 'YYZ-DEL': 85000,
  'DEL-SYD': 70000, 'SYD-DEL': 70000,
  'BOM-DXB': 22000, 'DXB-BOM': 22000,
  'BOM-JFK': 78000, 'JFK-BOM': 78000,
  'BOM-LHR': 52000, 'LHR-BOM': 52000
};

// Require Auth Middleware
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

// Helper: Format ISO duration
function formatDuration(isoDuration) {
  if (!isoDuration) return '';
  const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!matches) return isoDuration;
  const hours = matches[1] ? `${matches[1]}h` : '';
  const minutes = matches[2] ? `${matches[2]}m` : '';
  return `${hours} ${minutes}`.trim();
}

// Fetch Amadeus Auth Token
async function getAmadeusToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry - 10000) {
    return cachedToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'your_amadeus_client_id_here' || clientSecret === 'your_amadeus_client_secret_here') {
    throw new Error('Amadeus API credentials are not configured.');
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch token from Amadeus: ${errText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  return cachedToken;
}

// Format Amadeus API flight offers
function formatAmadeusOffers(offers) {
  return offers.map(offer => {
    const formattedItineraries = offer.itineraries.map(itinerary => {
      const segments = itinerary.segments || [];
      const firstSegment = segments[0] || {};
      const lastSegment = segments[segments.length - 1] || {};
      
      const departureTime = firstSegment.departure ? new Date(firstSegment.departure.at) : new Date();
      const arrivalTime = lastSegment.arrival ? new Date(lastSegment.arrival.at) : new Date();
      
      const layovers = segments.slice(0, -1).map(seg => seg.arrival.iataCode);
      const carrierCode = firstSegment.carrierCode || '6E';
      const airlineName = AIRLINES[carrierCode] || carrierCode;
      
      return {
        duration: formatDuration(itinerary.duration),
        stops: segments.length - 1,
        airline: airlineName,
        airlineLogo: `https://pics.avs.io/al_ico/30/30/${carrierCode}.png`,
        flightNumber: `${carrierCode} ${firstSegment.number || ''}`.trim(),
        departure: {
          time: departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          date: departureTime.toISOString().split('T')[0],
          iata: firstSegment.departure ? firstSegment.departure.iataCode : '',
          rawDateTime: firstSegment.departure ? firstSegment.departure.at : ''
        },
        arrival: {
          time: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          date: arrivalTime.toISOString().split('T')[0],
          iata: lastSegment.arrival ? lastSegment.arrival.iataCode : '',
          rawDateTime: lastSegment.arrival ? lastSegment.arrival.at : ''
        },
        layovers,
        segments: segments.map(seg => ({
          carrier: AIRLINES[seg.carrierCode] || seg.carrierCode,
          carrierCode: seg.carrierCode,
          flightNumber: `${seg.carrierCode} ${seg.number}`,
          departure: seg.departure.iataCode,
          departureTime: new Date(seg.departure.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          arrival: seg.arrival.iataCode,
          arrivalTime: new Date(seg.arrival.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: formatDuration(seg.duration || '')
        }))
      };
    });

    const primaryItinerary = formattedItineraries[0] || {};

    return {
      id: offer.id,
      price: Math.round(parseFloat(offer.price.total) * 90),
      currency: 'INR',
      itineraries: formattedItineraries,
      airline: primaryItinerary.airline || 'Unknown Airline',
      airlineLogo: primaryItinerary.airlineLogo || '',
      flightNumber: primaryItinerary.flightNumber || '',
      stops: primaryItinerary.stops || 0
    };
  });
}

// Generate realistic mock flight offers
function generateMockFlights(origin, destination, departure, returnDate, adults) {
  const routes = [`${origin}-${destination}`];
  if (returnDate) {
    routes.push(`${destination}-${origin}`);
  }

  const routeKey = `${origin}-${destination}`;
  const basePrice = typicalPrices[routeKey] || typicalPrices[`${destination}-${origin}`] || 350;

  const options = [];
  const airlinePool = ['EK', 'AI', 'UK', '6E', 'BA', 'SQ', 'QR', 'EY', 'LH'];

  for (let i = 0; i < 6; i++) {
    let carrierCode = 'AI';
    if (destination === 'DXB') carrierCode = ['EK', 'AI', '6E', 'FZ'][i % 4];
    else if (destination === 'JFK') carrierCode = ['AI', 'UA', 'EK', 'BA', 'QR'][i % 5];
    else if (destination === 'LHR') carrierCode = ['BA', 'AI', 'UK', 'QR'][i % 4];
    else if (destination === 'BKK') carrierCode = ['TG', 'AI', '6E'][i % 3];
    else carrierCode = airlinePool[i % airlinePool.length];

    const airlineName = AIRLINES[carrierCode] || carrierCode;
    const flightNo = `${carrierCode} ${Math.floor(100 + Math.random() * 899)}`;

    const priceMultiplier = 0.85 + (i * 0.1) + (Math.random() * 0.1);
    const flightPrice = Math.round(basePrice * priceMultiplier * adults);

    const itineraries = [];
    
    // Outbound itinerary
    itineraries.push(generateMockItinerary(origin, destination, departure, i, carrierCode, airlineName));

    // Inbound itinerary if round-trip
    if (returnDate) {
      itineraries.push(generateMockItinerary(destination, origin, returnDate, i + 1, carrierCode, airlineName));
    }

    const primaryItinerary = itineraries[0];

    options.push({
      id: `mock-${i + 1}-${origin}-${destination}-${departure.replace(/-/g, '')}`,
      price: flightPrice,
      currency: 'INR',
      itineraries,
      airline: airlineName,
      airlineLogo: `https://pics.avs.io/al_ico/30/30/${carrierCode}.png`,
      flightNumber: flightNo,
      stops: primaryItinerary.stops
    });
  }

  return options;
}

function generateMockItinerary(from, to, dateStr, index, carrierCode, airlineName) {
  const times = [
    { dep: '06:15', arr: '09:30', stops: 0 },
    { dep: '08:30', arr: '11:45', stops: 0 },
    { dep: '10:45', arr: '18:15', stops: 1, layover: 'BOM' },
    { dep: '13:20', arr: '16:50', stops: 0 },
    { dep: '16:00', arr: '23:30', stops: 1, layover: 'DXB' },
    { dep: '21:05', arr: '08:30', stops: 1, layover: 'LHR' },
    { dep: '23:45', arr: '03:15', stops: 0 }
  ];

  const schedule = times[index % times.length];
  const depTimeParts = schedule.dep.split(':');
  const arrTimeParts = schedule.arr.split(':');

  const departureDate = new Date(`${dateStr}T${schedule.dep}:00`);
  const arrivalDate = new Date(`${dateStr}T${schedule.arr}:00`);
  if (parseInt(arrTimeParts[0]) < parseInt(depTimeParts[0])) {
    arrivalDate.setDate(arrivalDate.getDate() + 1);
  }

  const stops = schedule.stops;
  const layovers = stops > 0 ? [schedule.layover] : [];

  const diffMs = arrivalDate - departureDate;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const durationStr = `${hours}h ${mins}m`;

  const segments = [];
  if (stops === 0) {
    segments.push({
      carrier: airlineName,
      carrierCode,
      flightNumber: `${carrierCode} ${Math.floor(100 + Math.random() * 899)}`,
      departure: from,
      departureTime: schedule.dep,
      arrival: to,
      arrivalTime: schedule.arr,
      duration: durationStr
    });
  } else {
    const layover = schedule.layover;
    const midTimeHours = Math.floor((parseInt(depTimeParts[0]) + parseInt(arrTimeParts[0])) / 2);
    const midTime = `${midTimeHours.toString().padStart(2, '0')}:30`;
    const nextTime = `${(midTimeHours + 2).toString().padStart(2, '0')}:30`;

    segments.push({
      carrier: airlineName,
      carrierCode,
      flightNumber: `${carrierCode} ${Math.floor(100 + Math.random() * 899)}`,
      departure: from,
      departureTime: schedule.dep,
      arrival: layover,
      arrivalTime: midTime,
      duration: `${Math.abs(midTimeHours - parseInt(depTimeParts[0]))}h 15m`
    });

    segments.push({
      carrier: airlineName,
      carrierCode,
      flightNumber: `${carrierCode} ${Math.floor(100 + Math.random() * 899)}`,
      departure: layover,
      departureTime: nextTime,
      arrival: to,
      arrivalTime: schedule.arr,
      duration: `${Math.abs(parseInt(arrTimeParts[0]) - (midTimeHours + 2))}h 00m`
    });
  }

  return {
    duration: durationStr,
    stops,
    airline: airlineName,
    airlineLogo: `https://pics.avs.io/al_ico/30/30/${carrierCode}.png`,
    flightNumber: `${carrierCode} ${Math.floor(100 + Math.random() * 899)}`,
    departure: {
      time: schedule.dep,
      date: dateStr,
      iata: from
    },
    arrival: {
      time: schedule.arr,
      date: arrivalDate.toISOString().split('T')[0],
      iata: to
    },
    layovers,
    segments
  };
}

function buildKiwiUrl(origin, destination, departureDate, returnDate, adults = 1) {
  const orig = (origin || '').toLowerCase();
  const dest = (destination || '').toLowerCase();
  let path = `${orig}-${dest}/${departureDate}`;
  if (returnDate) {
    path += `/${returnDate}`;
  }
  return `https://www.kiwi.com/en/search/results/${path}?adults=${adults}&affilid=travelease`;
}

function buildSkyscannerUrl(origin, destination, departureDate, returnDate, adults = 1) {
  const orig = (origin || '').toLowerCase();
  const dest = (destination || '').toLowerCase();
  const depFormatted = departureDate ? departureDate.replace(/-/g, '').slice(2) : '';
  const retFormatted = returnDate ? returnDate.replace(/-/g, '').slice(2) : '';
  let path = `${orig}/${dest}/${depFormatted}`;
  if (retFormatted) {
    path += `/${retFormatted}`;
  }
  return `https://www.skyscanner.co.in/transport/flights/${path}/?adults=${adults}&tag=travelease`;
}

// GET Flight Offers Search
router.get('/search', async (req, res) => {
  const { origin, destination, departure, returnDate, adults } = req.query;

  if (!origin || !destination || !departure) {
    return res.status(400).json({ error: 'Origin, destination, and departure date are required.' });
  }

  const kiwiSearchUrl = buildKiwiUrl(origin, destination, departure, returnDate, adults || 1);
  const skyscannerSearchUrl = buildSkyscannerUrl(origin, destination, departure, returnDate, adults || 1);

  const attachDeepLinks = (offers) => {
    return offers.map(offer => ({
      ...offer,
      kiwiUrl: kiwiSearchUrl,
      skyscannerUrl: skyscannerSearchUrl
    }));
  };

  try {
    const token = await getAmadeusToken();
    let url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departure}&adults=${adults || 1}&max=10&currencyCode=EUR`;
    
    if (returnDate) {
      url += `&returnDate=${returnDate}`;
    }

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.warn(`Amadeus flight API returned ${apiRes.status}: ${errText}. Falling back to mock.`);
      throw new Error(`Amadeus response status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const formatted = attachDeepLinks(formatAmadeusOffers(data.data || []));
    return res.json({
      success: true,
      source: 'amadeus',
      data: formatted,
      deepLinks: { kiwiUrl: kiwiSearchUrl, skyscannerUrl: skyscannerSearchUrl }
    });

  } catch (error) {
    console.warn(`Amadeus flight search failed (${error.message}). Serving realistic mock data.`);
    const mockData = attachDeepLinks(generateMockFlights(origin, destination, departure, returnDate, adults || 1));
    return res.json({
      success: true,
      source: 'mock',
      data: mockData,
      deepLinks: { kiwiUrl: kiwiSearchUrl, skyscannerUrl: skyscannerSearchUrl }
    });
  }
});

// POST Book Flight
router.post('/book', requireAuth, async (req, res) => {
  const { airline, flightNumber, origin, destination, departureTime, arrivalTime, price, currency, seat, passengerName } = req.body;

  if (!airline || !flightNumber || !origin || !destination || !departureTime) {
    return res.status(400).json({ error: 'Incomplete flight details provided.' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Generate random PNR
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const flightBooking = {
      airline,
      flightNumber,
      origin,
      destination,
      departureTime: new Date(departureTime),
      arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
      price: price || 0,
      currency: currency || 'EUR',
      seat: seat || '12A',
      pnr,
      passengerName: passengerName || user.name
    };

    user.bookedFlights = user.bookedFlights || [];
    user.bookedFlights.push(flightBooking);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({ success: true, booking: flightBooking, user: userResponse });
  } catch (error) {
    console.error('Flight Booking Error:', error);
    return res.status(500).json({ error: 'Failed to process flight booking.' });
  }
});

module.exports = router;

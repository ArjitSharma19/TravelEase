const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET User Trip Summary Details
router.get('/summary/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if tripDetails is populated. If not, construct it dynamically from top-level fields
    let tripDetails = user.tripDetails;
    if (!tripDetails || !tripDetails.destination) {
      tripDetails = {
        destination: user.destination || '',
        purpose: user.tripPurpose || 'tourism',
        departureDate: user.travelDateFrom || null,
        returnDate: user.travelDateTo || null,
        passportExpiry: user.passportExpiry || null,
        firstTimeAbroad: user.isFirstTimeAbroad || false
      };
    }

    res.json({
      tripDetails,
      checklist: user.checklist || [],
      bookedFlights: user.bookedFlights || [],
      passportExpiry: user.passportExpiry || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

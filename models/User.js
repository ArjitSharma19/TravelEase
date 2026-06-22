const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String
  },
  name: {
    type: String,
    trim: true
  },
  passportCountry: {
    type: String,
    default: 'India',
    trim: true
  },
  passportExpiry: {
    type: Date
  },
  destination: {
    type: String,
    default: '',
    trim: true
  },
  travelDateFrom: {
    type: Date
  },
  travelDateTo: {
    type: Date
  },
  tripPurpose: {
    type: String,
    enum: ['tourism', 'business', 'education', 'other'],
    default: 'tourism'
  },
  isFirstTimeAbroad: {
    type: Boolean,
    default: false
  },
  travelersCount: {
    type: Number,
    default: 1
  },
  budgetRange: {
    type: String,
    enum: ['budget', 'mid-range', 'luxury'],
    default: 'mid-range'
  },
  emailVisaAlerts: {
    type: Boolean,
    default: true
  },
  emailCurrencyAlerts: {
    type: Boolean,
    default: true
  },
  photo: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  bookedFlights: [{
    airline: String,
    flightNumber: String,
    origin: String,
    destination: String,
    departureTime: Date,
    arrivalTime: Date,
    price: Number,
    currency: String,
    seat: String,
    pnr: String,
    passengerName: String,
    bookedAt: {
      type: Date,
      default: Date.now
    }
  }],
  checklist: [
    {
      id: String,
      text: String,
      completed: { type: Boolean, default: false }
    }
  ],
  tripDetails: {
    destination: String,
    purpose: String,
    departureDate: Date,
    returnDate: Date,
    passportExpiry: Date,
    firstTimeAbroad: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);

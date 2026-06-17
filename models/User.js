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
    type: String,
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);

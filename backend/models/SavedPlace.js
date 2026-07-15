const mongoose = require('mongoose');

const SavedPlaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  estimatedDuration: {
    type: String,
    trim: true
  },
  tip: {
    type: String,
    trim: true
  },
  relevanceReason: {
    type: String,
    trim: true
  },
  photoUrl: {
    type: String,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  id: {
    type: String // Google place ID
  },
  rating: {
    type: Number
  },
  address: {
    type: String
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user cannot save the same place multiple times for the same destination
SavedPlaceSchema.index({ userId: 1, name: 1, destination: 1 }, { unique: true });

module.exports = mongoose.model('SavedPlace', SavedPlaceSchema);

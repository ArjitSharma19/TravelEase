const mongoose = require('mongoose');

const PlaceRecommendationSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    trim: true
  },
  travelPurpose: {
    type: String,
    required: true,
    trim: true
  },
  interestsHash: {
    type: String,
    default: '',
    trim: true
  },
  recommendations: [
    {
      id: { type: String }, // Google place ID
      name: { type: String, required: true },
      category: { type: String, required: true },
      description: { type: String, required: true },
      estimatedDuration: { type: String },
      tip: { type: String },
      relevanceReason: { type: String },
      photoUrl: { type: String },
      rating: { type: Number },
      address: { type: String },
      location: {
        latitude: { type: Number },
        longitude: { type: Number }
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // TTL index to expire cache entries after 7 days
  }
});

// Compound index for lookup performance
PlaceRecommendationSchema.index({ destination: 1, travelPurpose: 1, interestsHash: 1 });

module.exports = mongoose.model('PlaceRecommendation', PlaceRecommendationSchema);

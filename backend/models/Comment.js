const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: true,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    enum: ['general', 'visa', 'currency', 'sim', 'transport'],
    default: 'general'
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  tripPeriod: {
    type: String,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', CommentSchema);

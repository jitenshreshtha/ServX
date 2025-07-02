// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // Who is involved
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  
  // Rating and review content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Review status
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'pending'],
    default: 'active'
  },
  
  // Reviewee response
  response: {
    comment: {
      type: String,
      maxlength: 500
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ listing: 1 });
reviewSchema.index({ rating: -1 });

// Prevent duplicate reviews for same listing between same users
reviewSchema.index({ reviewer: 1, reviewee: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
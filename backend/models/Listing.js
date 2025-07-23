const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"]
  },
  skillOffered: {
    type: String,
    required: [true, "Offered skill is required"],
    trim: true
  },
  skillWanted: {
    type: String,
    required: [true, "Wanted skill is required"],
    trim: true
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "Web Development",
      "Mobile Development",
      "Design",
      "Writing",
      "Marketing",
      "Photography",
      "Video Editing",
      "Tutoring",
      "Home Services",
      "Crafts",
      "Consulting",
      "Other"
    ]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["active", "in_progress", "completed", "cancelled"],
    default: "active"
  },
  estimatedDuration: {
    type: String,
    enum: ["1-3 hours", "1 day", "2-3 days", "1 week", "2+ weeks"]
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    isRemote: {
      type: Boolean,
      default: false
    },
    maxDistance: {
      type: Number, // in kilometers
      default: 50
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isService: {
    type: Boolean,
    default: false
  },
  salaryMin: {
    type: Number,
    default: null
  },
  salaryMax: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better search performance
listingSchema.index({ skillOffered: "text", skillWanted: "text", title: "text", description: "text" });
listingSchema.index({ category: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ author: 1 });
listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Listing", listingSchema);
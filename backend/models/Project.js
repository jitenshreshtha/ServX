const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  skills: {
    offered: {
      type: String,
      required: true
    },
    wanted: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled", "disputed"],
    default: "pending"
  },
  timeline: {
    startDate: Date,
    expectedEndDate: Date,
    actualEndDate: Date
  },
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  agreement: {
    terms: String,
    agreedAt: Date,
    requesterAgreed: {
      type: Boolean,
      default: false
    },
    providerAgreed: {
      type: Boolean,
      default: false
    }
  },
  reviews: {
    requesterReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    },
    providerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    }
  },
  deliverables: [{
    title: String,
    description: String,
    fileUrl: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ requester: 1 });
projectSchema.index({ provider: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ lastActivity: -1 });

// Update lastActivity on save
projectSchema.pre("save", function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model("Project", projectSchema);
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500,
    trim: true
  },
  requestType: {
    type: String,
    enum: ['collaboration', 'service_inquiry', 'general'],
    default: 'collaboration'
  },
  responseMessage: {
    type: String,
    maxlength: 500,
    trim: true
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Indexes for better performance
requestSchema.index({ sender: 1, createdAt: -1 });
requestSchema.index({ recipient: 1, status: 1, createdAt: -1 });
requestSchema.index({ listing: 1 });
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent duplicate pending requests
requestSchema.index(
  { sender: 1, recipient: 1, listing: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

module.exports = mongoose.model('Request', requestSchema);
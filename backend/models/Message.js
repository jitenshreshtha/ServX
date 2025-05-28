const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  },
  content: {
    type: String,
    required: [true, "Message content is required"],
    trim: true,
    maxlength: [1000, "Message cannot exceed 1000 characters"]
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "system"],
    default: "text"
  },
  fileUrl: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ project: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1 });

// Conversation schema for grouping messages
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ project: 1 });

const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Message, Conversation };
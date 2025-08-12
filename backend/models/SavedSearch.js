const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, trim: true, default: "Saved search" },
  enabled: { type: Boolean, default: true },

  // simple criteria
  category: { type: String, default: "" },
  isService: { type: Boolean, default: null }, // null = any
  status: { type: String, default: "active" }, // default to active listings
  text: { type: String, trim: true, default: "" },
  tags: [{ type: String, trim: true }],

  // optional budget
  minBudget: { type: Number, default: null },
  maxBudget: { type: Number, default: null },

  // optional geo
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },
  radiusKm: { type: Number, default: null }
}, { timestamps: true });

savedSearchSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("SavedSearch", savedSearchSchema);

// models/Listing.js
const mongoose = require("mongoose");
const SavedSearch = require("../models/SavedSearch");
const { matches } = require("../utils/matchListingToSearch");
const { push } = require("../utils/sseHub");

const listingSchema = new mongoose.Schema(
  {
    // Basics
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Skills
    skillOffered: { type: String, trim: true },
    skillWanted: { type: String, trim: true },

    // Meta
    category: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    isService: { type: Boolean, default: false },

    // Owner
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Budget (optional; used for service listings)
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },

    // Tags
    tags: [{ type: String, trim: true }],

    // Geo (optional)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [lng, lat]
        type: [Number],
        default: undefined,
      },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      addressLine1: { type: String, trim: true },
    },

    // Applicants (optional)
    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        appliedAt: { type: Date, default: Date.now },
        message: { type: String },
      },
    ],

    // Misc
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text + other indexes
listingSchema.index({
  skillOffered: "text",
  skillWanted: "text",
  title: "text",
  description: "text",
});
listingSchema.index({ category: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ author: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ location: "2dsphere" });

/** ---------- capture newness BEFORE save ---------- */
listingSchema.pre("save", function markNew(next) {
  this._wasNew = this.isNew; // Mongoose flips isNew=false inside post('save')
  next();
});

/** ---------- Saved Search fan-out on NEW listing ---------- */
listingSchema.post("save", async function savedSearchFanout(doc, next) {
  try {
    if (!doc._wasNew) return next?.(); // only on brand-new docs

    const DEBUG = String(process.env.DEBUG_SAVED_SEARCH || "") === "1";

    const listingForMatch = {
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      status: doc.status,
      isService: doc.isService,
      tags: doc.tags || [],
      salaryMin: doc.salaryMin ?? null,
      salaryMax: doc.salaryMax ?? null,
      location: doc.location?.coordinates
        ? { type: "Point", coordinates: doc.location.coordinates }
        : null,
    };

    // prefilter: only enabled saved searches
    const candidates = await SavedSearch.find({ enabled: { $ne: false } }).lean();
    if (DEBUG) console.log(`[SavedSearch][hook] candidates=${candidates.length} for listing ${doc._id}`);

    for (const s of candidates) {
      let ok = false;
      try {
        ok = matches(listingForMatch, s);
      } catch (e) {
        if (DEBUG) console.warn("[SavedSearch][hook] match error", e);
      }
      if (!ok) continue;

      if (DEBUG)
        console.log(`[SavedSearch][hook] MATCH for user ${s.user} (search: ${s.name || s._id})`);

      // >>> payload shape that the frontend expects <<<
      push(String(s.user), "saved_search_match", {
        searchId: String(s._id),
        searchName: s.name || "Saved search",
        listing: {
          _id: String(doc._id), // use _id for the client
          title: doc.title,
          description: doc.description,
          category: doc.category,
          isService: doc.isService,
          salaryMin: doc.salaryMin ?? null,
          salaryMax: doc.salaryMax ?? null,
          author: doc.author,
          createdAt: doc.createdAt,
        },
      });
    }

    next?.();
  } catch (err) {
    console.error("[SavedSearch][hook] error", err);
    next?.(err);
  }
});

module.exports = mongoose.model("Listing", listingSchema);

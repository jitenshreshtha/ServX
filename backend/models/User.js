const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },

  // ✅ Updated: Allow Google-auth users to skip password
  password: {
    type: String,
    required: function () {
      return !this.isGoogleAuth;
    },
    validate: {
      validator: function (value) {
        // Skip minlength check for Google-auth users
        if (this.isGoogleAuth) return true;
        return typeof value === 'string' && value.length >= 6;
      },
      message: "Password must be at least 6 characters"
    }
  },

  skills: [{
    type: String,
    trim: true
  }],
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"]
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
        default: [0, 0]
      }
    },
    isLocationPublic: {
      type: Boolean,
      default: false
    }
  },
  profileImage: {
    type: String,
    default: ""
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isGoogleAuth: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // ✅ Added for 2FA
  twoFactorSecret: {
    type: String,
  },
  twoFactorTempSecret: {
    type: String,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  }

}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ "location.coordinates": "2dsphere" });

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/*
// 🔐 Legacy manual password validation — now replaced with schema-based validator above
userSchema.pre("save", function (next) {
  if (this.isGoogleAuth && !this.isModified("password")) return next();
  if (!this.isGoogleAuth && (!this.password || this.password.length < 6)) {
    throw new Error("Password must be at least 6 characters");
  }
  next();
});
*/

// 🔁 Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ⭐ Rating calculation
userSchema.statics.updateUserRating = async function (userId) {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  const rating = result.length > 0 ? {
    average: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].totalReviews
  } : { average: 0, count: 0 };
  await this.findByIdAndUpdate(userId, { rating });
  return rating;
};

// 🧼 Strip password from response
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);

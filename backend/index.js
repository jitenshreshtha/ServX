require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


//chat module
const setupSocketIO = require("./controllers/chatController");

// Import models
const User = require("./models/User");
const Listing = require("./models/Listing");
const Project = require("./models/Project");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const Otp = require("./models/Otp");
const sendOTPEmail = require("./utils/sendEmail");
const app = express();
const server = require("http").createServer(app);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" Database connected successfully"))
  .catch((err) => console.error(" Database connection error:", err));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: "Email already exists" });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  res.status(500).json({ error: "Internal server error" });
};

setupSocketIO(server);
// Routes

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "ServX API is running",
    version: "1.0.0",
    endpoints: ["/signup", "/login", "/listings", "/projects", "/messages"],
  });
});


// Configure Passport Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`, // ✅ Send code to backend
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: '', // Google users won't have passwords
          isGoogleAuth: true,
          profileImage: profile.photos[0]?.value || '',
          isVerified: true
        });
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Google Auth Initiation
app.get('/auth/google', 
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google Auth Callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const isNewUser = !user.skills || user.skills.length === 0;

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log(`[Google Auth] User ${user.email} logged in successfully.`);

      // ✅ Final redirect to frontend
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userId=${user._id}&isNewUser=${isNewUser}`);
    } catch (error) {
      console.error("[Google Auth] Error during Google authentication:", error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(error.message)}`);
    }
  }
);
app.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, skills, bio, location, isGoogleAuth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isGoogleAuth) {
        return res.status(400).json({ 
          error: "This email is registered with Google. Please sign in with Google.",
          isGoogleAuth: true
        });
      }
      return res.status(400).json({ error: "Email already registered" });
    }

    // Validate password only if NOT Google signup
    if (!isGoogleAuth) {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
    }

    // Create user, skip password if Google signup
    const userData = {
      name,
      email,
      skills: skills || [],
      bio: bio || "",
      location: location || {},
      isGoogleAuth: !!isGoogleAuth,
      isVerified: !!isGoogleAuth
    };

    if (!isGoogleAuth) {
      userData.password = password; // Save password only for non-Google users
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: isGoogleAuth ? "Google signup successful" : "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        isGoogleAuth: user.isGoogleAuth,
      }
    });

  } catch (error) {
    next(error);
  }
});


app.post("/login", async (req, res, next) => {
  try {
    const { email, password, isGoogleAuth } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If the account was created with Google
    if (user.isGoogleAuth && !isGoogleAuth) {
      return res.status(401).json({
        error: "This account was created with Google. Please use Google Sign-In.",
        isGoogleAuth: true
      });
    }

    // If not Google, validate password
    if (!user.isGoogleAuth) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        isGoogleAuth: user.isGoogleAuth,
      }
    });
  } catch (error) {
    next(error);
  }
});
// Request otp Routes
app.post("/admin/request-otp", async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(`[Admin OTP] Received OTP request for email: ${email}`);

    if (email !== process.env.ADMIN_EMAIL) {
      console.log(
        `[Admin OTP] Unauthorized OTP request attempt for email: ${email}`
      );
      return res.status(403).json({ error: "Not authorized" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);
    console.log(`[Admin OTP] OTP email sent to: ${email} with OTP: ${otp}`);

    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("[Admin OTP] Error sending OTP:", err);
    next(err);
  }
});

// Verify otp Routes
app.post("/admin/verify-otp", async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    console.log(
      `[Admin OTP] Verification attempt for email: ${email} with OTP: ${otp}`
    );

    const record = await Otp.findOne({ email });

    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      console.log(`[Admin OTP] Invalid or expired OTP for email: ${email}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await Otp.deleteOne({ email }); // Remove used OTP
    console.log(`[Admin OTP] OTP verified for email: ${email}`);

    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "OTP verified", token });
  } catch (err) {
    console.error("[Admin OTP] Error verifying OTP:", err);
    next(err);
  }
});

// authenticate admin token
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.admin = true;
    next();
  });
};
// ───── Admin: Read (R) ─────────────────────────────────────────────────
app.get("/admin/dashboard", authenticateAdmin, (req, res) => {
  res.json({ message: "Welcome Admin!" });
});
app.get("/admin/users", authenticateAdmin, async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (err) { next(err); }
});
app.get("/admin/all-listings", authenticateAdmin, async (req, res, next) => {
  try {
    const listings = await Listing.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) { next(err); }
});
app.get("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

// ───── Admin: Create (C) ───────────────────────────────────────────────
app.post("/admin/listings", authenticateAdmin, async (req, res, next) => {
  try {
    const defaultAuthor = await User.findOne(); // get first user

    if (!defaultAuthor) {
      return res.status(400).json({ error: "No users found to assign as author" });
    }

    const listing = new Listing({
      ...req.body,
      author: defaultAuthor._id
    });

    await listing.save();
    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
});
app.post("/admin/users", authenticateAdmin, async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.status(201).json({ user: safe });
  } catch (err) { next(err); }
});

// ───── Admin: Update (U) ───────────────────────────────────────────────
// Validate ObjectId before update
app.put("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }
  const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json({ listing });
});
app.put("/admin/users/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) { next(err); }
});

// ───── Admin: Delete (D) ───────────────────────────────────────────────
// Validate ObjectId before delete
app.delete("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }
  const listing = await Listing.findByIdAndDelete(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json({ message: "Listing deleted" });
});
app.delete("/admin/users/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) { next(err); }
})

// Get current user profile
app.get("/profile", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
app.put("/profile", authenticateToken, async (req, res, next) => {
  try {
    const { name, skills, bio, location } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, skills, bio, location },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Listing Routes
app.post("/listings", authenticateToken, async (req, res, next) => {
  try {
    const {
      title,
      description,
      skillOffered,
      skillWanted,
      category,
      estimatedDuration,
      location,
      tags,
    } = req.body;

    const listing = new Listing({
      title,
      description,
      skillOffered,
      skillWanted,
      category,
      estimatedDuration,
      location,
      tags: tags || [],
      author: req.user.userId,
    });

    await listing.save();
    await listing.populate("author", "name email skills rating");

    res.status(201).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
});

app.get("/listings", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 6,
      category,
      skillOffered,
      skillWanted,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Convert page and limit to numbers and validate
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(48, Math.max(1, parseInt(limit))); // Max 48 items per page
    const skip = (currentPage - 1) * itemsPerPage;

    // Build filter object
    const filter = { isActive: true };

    // Category filter
    if (category && category.trim()) {
      filter.category = category;
    }
    
    // Skill filters (case-insensitive partial match)
    if (skillOffered && skillOffered.trim()) {
      filter.skillOffered = new RegExp(skillOffered.trim(), 'i');
    }
    
    if (skillWanted && skillWanted.trim()) {
      filter.skillWanted = new RegExp(skillWanted.trim(), 'i');
    }
    
    // Text search across multiple fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      filter.$or = [
        { title: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') },
        { skillOffered: new RegExp(searchTerm, 'i') },
        { skillWanted: new RegExp(searchTerm, 'i') },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    // Build sort object
    const validSortFields = ['createdAt', 'title', 'skillOffered', 'skillWanted', 'views'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Execute queries in parallel for better performance
    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .populate('author', 'name email skills rating location')
        .sort(sort)
        .limit(itemsPerPage)
        .skip(skip)
        .lean(), // Use lean() for better performance when we don't need full Mongoose documents
      
      Listing.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Pagination metadata
    const pagination = {
      current: currentPage,
      pages: totalPages,
      total: totalCount,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage,
      limit: itemsPerPage,
      showing: {
        start: totalCount === 0 ? 0 : skip + 1,
        end: Math.min(skip + itemsPerPage, totalCount)
      }
    };

    // Response with listings and pagination info
    res.json({
      success: true,
      listings,
      pagination,
      filters: {
        category: category || null,
        skillOffered: skillOffered || null,
        skillWanted: skillWanted || null,
        search: search || null,
        sortBy: sortField,
        sortOrder: sortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    next(error);
  }
});

// Get user's own listings
app.get("/my-listings", authenticateToken, async (req, res, next) => {
  try {
    const listings = await Listing.find({ author: req.user.userId })
      .populate("author", "name email skills rating")
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    next(error);
  }
});

app.get("/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.query;
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "name");

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Add this to your routes section
app.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const { user1, user2, listing } = req.query;

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [user1, user2], $size: 2 },
      listing,
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = new Conversation({
        participants: [user1, user2],
        listing,
      });
      await conversation.save();
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

app.get("/conversations/user", authenticateToken, async (req, res) => {
  try {
    // Correct: Access userId directly from req.user (JWT payload)
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email")
      .populate("listing", "title")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("Error loading conversations:", error);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

app.get(
  "/conversations/user/:id/unread",
  authenticateToken,
  async (req, res, next) => {
    try {
      const userId = req.params.id;

      const conversations = await Conversation.find({
        participants: userId,
      }).populate("lastMessage");

      const unread = conversations.filter(
        (conv) =>
          conv.lastMessage &&
          conv.lastMessage.sender.toString() !== userId &&
          !conv.lastMessage.readBy?.includes(userId)
      );

      res.json({ count: unread.length });
    } catch (error) {
      next(error);
    }
  }
);

// Apply error handling middleware
app.use(errorHandler);

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.BACK_PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

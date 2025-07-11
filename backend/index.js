require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: '',
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
      userData.password = password;
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

// Updated admin users route with pagination
app.get("/admin/users", authenticateAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = {};
    
    if (role && role !== 'all') filter.role = role;
    
    if (search && search.trim()) {
      const searchTerm = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchTerm },
        { email: searchTerm }
      ];
    }

    const sortField = ['createdAt', 'name', 'email', 'role'].includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .limit(itemsPerPage)
        .skip(skip)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    res.json({
      success: true,
      users,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        limit: itemsPerPage,
        showing: {
          start: totalCount === 0 ? 0 : skip + 1,
          end: Math.min(skip + itemsPerPage, totalCount)
        }
      },
      filters: {
        search: search || null,
        role: role || null,
        sortBy: sortField,
        sortOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

// Updated admin all listings route with pagination
app.get("/admin/all-listings", authenticateAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    
    if (search && search.trim()) {
      const searchTerm = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchTerm },
        { description: searchTerm },
        { skillOffered: searchTerm },
        { skillWanted: searchTerm }
      ];
    }

    const sortField = ['createdAt', 'title', 'status', 'views'].includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .populate("author", "name email")
        .sort(sort)
        .limit(itemsPerPage)
        .skip(skip)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    res.json({
      success: true,
      listings,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        limit: itemsPerPage,
        showing: {
          start: totalCount === 0 ? 0 : skip + 1,
          end: Math.min(skip + itemsPerPage, totalCount)
        }
      },
      filters: {
        status: status || null,
        category: category || null,
        search: search || null,
        sortBy: sortField,
        sortOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("author", "name email");

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

// ───── Admin: Create (C) ───────────────────────────────────────────────
app.post("/admin/listings", authenticateAdmin, async (req, res, next) => {
  try {
    const defaultAuthor = await User.findOne();

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
  } catch (err) { 
    next(err); 
  }
});

// ───── Admin: Update (U) ───────────────────────────────────────────────
app.put("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
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
  } catch (err) { 
    next(err); 
  }
});

// ───── Admin: Delete (D) ───────────────────────────────────────────────
app.delete("/admin/listings/:id", authenticateAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ message: "Listing deleted" });
  } catch (err) {
    next(err);
  }
});

app.delete("/admin/users/:id", authenticateAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Delete Listings authored by the user
    await Listing.deleteMany({ author: userId });

    // Delete Projects involving the user
    await Project.deleteMany({ 
      $or: [{ requester: userId }, { provider: userId }] 
    });

    // Find Conversations involving the user
    const conversations = await Conversation.find({ participants: userId });

    // Delete all related Messages and Conversations
    const conversationIds = conversations.map(conv => conv._id);
    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });

    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User and related data deleted" });
  } catch (err) {
    next(err);
  }
});

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
      location,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(48, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = { isActive: true };

    if (category && category.trim()) filter.category = category;
    if (skillOffered && skillOffered.trim()) filter.skillOffered = new RegExp(skillOffered.trim(), 'i');
    if (skillWanted && skillWanted.trim()) filter.skillWanted = new RegExp(skillWanted.trim(), 'i');

    const orConditions = [];

    if (search && search.trim()) {
      const searchTerm = new RegExp(search.trim(), 'i');
      orConditions.push(
        { title: searchTerm },
        { description: searchTerm },
        { skillOffered: searchTerm },
        { skillWanted: searchTerm },
        { tags: { $in: [searchTerm] } }
      );
    }

    if (location && location.trim()) {
      const locRegex = new RegExp(location.trim(), 'i');
      orConditions.push(
        { "location.city": locRegex },
        { "location.state": locRegex },
        { "location.country": locRegex }
      );
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    const sortField = ['createdAt', 'title', 'skillOffered', 'skillWanted', 'views'].includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .populate('author', 'name email skills rating location')
        .sort(sort)
        .limit(itemsPerPage)
        .skip(skip)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    res.json({
      success: true,
      listings,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        limit: itemsPerPage,
        showing: {
          start: totalCount === 0 ? 0 : skip + 1,
          end: Math.min(skip + itemsPerPage, totalCount)
        }
      },
      filters: {
        category: category || null,
        skillOffered: skillOffered || null,
        skillWanted: skillWanted || null,
        search: search || null,
        location: location || null,
        sortBy: sortField,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    next(error);
  }
});

app.get("/my-listings", authenticateToken, async (req, res, next) => {
  try {
    console.log("🔍 [MyListings Debug] Request received");
    console.log("🔍 [MyListings Debug] User from token:", req.user);
    console.log("🔍 [MyListings Debug] User ID:", req.user.userId);
    
    const {
      page = 1,
      limit = 6,
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(48, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    const filter = { author: req.user.userId };
    console.log("🔍 [MyListings Debug] Base filter:", filter);

    // Add filters
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    
    if (search && search.trim()) {
      const searchTerm = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchTerm },
        { description: searchTerm },
        { skillOffered: searchTerm },
        { skillWanted: searchTerm },
        { tags: { $in: [searchTerm] } }
      ];
    }

    console.log("🔍 [MyListings Debug] Final filter:", JSON.stringify(filter, null, 2));

    const sortField = ['createdAt', 'title', 'status', 'views'].includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // Check total listings for this user first
    const totalUserListings = await Listing.countDocuments({ author: req.user.userId });
    console.log("🔍 [MyListings Debug] Total listings for user:", totalUserListings);

    // Check if any listings exist at all and what their author IDs look like
    if (totalUserListings === 0) {
      const sampleListings = await Listing.find({}).select('author title').populate('author', 'name email').limit(5);
      console.log("🔍 [MyListings Debug] Sample listings with authors:", 
        sampleListings.map(l => ({
          title: l.title,
          authorId: l.author?._id?.toString(),
          authorName: l.author?.name,
          authorEmail: l.author?.email
        }))
      );
      
      console.log("🔍 [MyListings Debug] Current user ID type:", typeof req.user.userId);
      console.log("🔍 [MyListings Debug] Current user ID value:", req.user.userId);
    }

    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .populate("author", "name email skills rating")
        .sort(sort)
        .limit(itemsPerPage)
        .skip(skip)
        .lean(),
      Listing.countDocuments(filter)
    ]);

    console.log("🔍 [MyListings Debug] Found listings count:", listings.length);
    console.log("🔍 [MyListings Debug] Total count:", totalCount);

    if (listings.length > 0) {
      console.log("🔍 [MyListings Debug] First listing:", {
        title: listings[0].title,
        authorId: listings[0].author?._id?.toString(),
        authorName: listings[0].author?.name
      });
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Return the response in the expected format
    res.json({
      // Keep backward compatibility
      listings,
      // Add pagination info
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        limit: itemsPerPage,
        showing: {
          start: totalCount === 0 ? 0 : skip + 1,
          end: Math.min(skip + itemsPerPage, totalCount)
        }
      },
      filters: {
        status: status || null,
        category: category || null,
        search: search || null,
        sortBy: sortField,
        sortOrder
      },
      debug: {
        userId: req.user.userId,
        userIdType: typeof req.user.userId,
        totalUserListings,
        filterUsed: filter
      }
    });
  } catch (error) {
    console.error("❌ [MyListings Debug] Error:", error);
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

const { sendContactEmail, sendContactAutoReply } = require('./utils/contactEmailService');

app.post("/messages/:id/report", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Prevent duplicate reports by same user
    const alreadyReported = message.reports?.some(
      r => r.reportedBy.toString() === req.user.userId
    );
    if (alreadyReported) {
      return res.status(400).json({ error: "You already reported this message" });
    }

    message.reports.push({
      reportedBy: req.user.userId,
      reason,
    });

    await message.save();
    res.json({ success: true, message: "Message reported to admin" });
  } catch (error) {
    next(error);
  }
});
app.get("/admin/reported-messages", authenticateAdmin, async (req, res, next) => {
  try {
    const reported = await Message.find({ "reports.0": { $exists: true } })
      .populate("sender", "name email")
      .populate("reports.reportedBy", "name email")
      .populate("conversation", "listing participants")
      .sort({ updatedAt: -1 });

    res.json({ reported });
  } catch (err) {
    next(err);
  }
});

// Contact form submission route
app.post('/contact', async (req, res, next) => {
  try {
    const { name, email, message, subject } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required'
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      subject: subject ? subject.trim() : 'General Inquiry'
    };
    
    // Additional validation
    if (sanitizedData.name.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name must be at least 2 characters long'
      });
    }
    
    if (sanitizedData.message.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Message must be at least 10 characters long'
      });
    }
    
    console.log('📧 Processing contact form submission:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      messageLength: sanitizedData.message.length
    });
    
    // Send email to admin using SendGrid
    await sendContactEmail(sanitizedData);
    
    // Send auto-reply to user (optional, but recommended)
    try {
      await sendContactAutoReply(
        sanitizedData.email, 
        sanitizedData.name, 
        sanitizedData.subject
      );
    } catch (autoReplyError) {
      console.log('⚠️ Auto-reply failed but continuing:', autoReplyError.message);
      // Don't fail the whole request if auto-reply fails
    }
    
    console.log('✅ Contact form processed successfully');
    
    res.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24-48 hours.'
    });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    
    // Check if it's a SendGrid specific error
    let errorMessage = 'Unable to send message at this time. Please try again later.';
    
    if (error.message && error.message.includes('SendGrid')) {
      console.error('SendGrid API Error Details:', error);
      errorMessage = 'Email service temporarily unavailable. Please try again in a few minutes.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test contact email functionality (admin only)
app.post('/admin/test-contact-email', authenticateAdmin, async (req, res) => {
  try {
    const testData = {
      name: 'Test User',
      email: process.env.ADMIN_EMAIL,
      message: 'This is a test message to verify the contact form email functionality using SendGrid.',
      subject: 'Contact Form Test'
    };
    
    console.log('🧪 Testing contact email functionality...');
    
    // Send test email
    const result = await sendContactEmail(testData);
    
    // Send test auto-reply
    await sendContactAutoReply(testData.email, testData.name, testData.subject);
    
    res.json({
      success: true,
      message: 'Test emails sent successfully!',
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('❌ Test contact email failed:', error);
    res.status(500).json({
      success: false,
      error: 'Contact email test failed',
      details: error.message
    });
  }
});

// Get contact email service status (admin only)
app.get('/admin/contact-email-status', authenticateAdmin, (req, res) => {
  const requiredEnvVars = [
    'SENDGRID_API_KEY',
    'ADMIN_EMAIL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  const status = {
    service: 'SendGrid',
    configured: missingVars.length === 0,
    missingVariables: missingVars,
    sendgridApiKey: process.env.SENDGRID_API_KEY ? '✓ Configured' : '✗ Missing',
    adminEmail: process.env.ADMIN_EMAIL ? '✓ Configured' : '✗ Missing',
    frontendUrl: process.env.FRONTEND_URL ? '✓ Configured' : '⚠️ Using default'
  };
  
  res.json(status);
});

// Contact form analytics (admin only) - optional
app.get('/admin/contact-stats', authenticateAdmin, async (req, res) => {
  try {
    // If you want to track contact submissions, you could store them in database
    // For now, just return a simple response
    res.json({
      success: true,
      message: 'Contact form is using SendGrid email service',
      service: 'SendGrid',
      features: [
        'Professional HTML emails',
        'Auto-reply confirmations',
        'Email delivery tracking',
        'Reply-to functionality'
      ]
    });
  } catch (error) {
    next(error);
  }
});

//Review Routes
const Review = require("./models/Review");

// Create a new review
app.post("/reviews", authenticateToken, async (req, res, next) => {
  try {
    const { revieweeId, listingId, rating, title, comment } = req.body;
    const reviewerId = req.user.userId;

    // Validation
    if (!revieweeId || !listingId || !rating || !title || !comment) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    if (reviewerId === revieweeId) {
      return res.status(400).json({ error: "You cannot review yourself" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      reviewee: revieweeId,
      listing: listingId
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this user for this listing" });
    }

    // Verify the listing exists and user has interacted with it
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Create the review
    const review = new Review({
      reviewer: reviewerId,
      reviewee: revieweeId,
      listing: listingId,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim()
    });

    await review.save();

    // Update reviewee's rating summary
    await User.updateUserRating(revieweeId);

    // Populate the review for response
    await review.populate([
      { path: 'reviewer', select: 'name email' },
      { path: 'reviewee', select: 'name email' },
      { path: 'listing', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already reviewed this user for this listing" });
    }
    next(error);
  }
});

// Get reviews for a specific user (received reviews)
app.get("/reviews/user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const [reviews, totalCount] = await Promise.all([
      Review.find({ reviewee: userId, status: 'active' })
        .populate('reviewer', 'name email')
        .populate('listing', 'title')
        .sort({ createdAt: -1 })
        .limit(itemsPerPage)
        .skip(skip),
      Review.countDocuments({ reviewee: userId, status: 'active' })
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    res.json({
      success: true,
      reviews,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get reviews written by a user
app.get("/reviews/by-user/:userId", authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is requesting their own reviews or is admin
    if (req.user.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Not authorized to view these reviews" });
    }

    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(20, Math.max(1, parseInt(limit)));
    const skip = (currentPage - 1) * itemsPerPage;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ reviewer: userId })
        .populate('reviewee', 'name email')
        .populate('listing', 'title')
        .sort({ createdAt: -1 })
        .limit(itemsPerPage)
        .skip(skip),
      Review.countDocuments({ reviewer: userId })
    ]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    res.json({
      success: true,
      reviews,
      pagination: {
        current: currentPage,
        pages: totalPages,
        total: totalCount,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Add response to a review
app.post("/reviews/:reviewId/response", authenticateToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Response comment is required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only the reviewee can respond to their review
    if (review.reviewee.toString() !== userId) {
      return res.status(403).json({ error: "You can only respond to reviews about you" });
    }

    // Check if response already exists
    if (review.response && review.response.comment) {
      return res.status(400).json({ error: "You have already responded to this review" });
    }

    review.response = {
      comment: comment.trim(),
      respondedAt: new Date()
    };

    await review.save();

    await review.populate([
      { path: 'reviewer', select: 'name email' },
      { path: 'reviewee', select: 'name email' },
      { path: 'listing', select: 'title' }
    ]);

    res.json({
      success: true,
      message: "Response added successfully",
      review
    });

  } catch (error) {
    next(error);
  }
});

// Get review statistics for a user
app.get("/reviews/stats/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const stats = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: 'active' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const totalReviews = await Review.countDocuments({ 
      reviewee: userId, 
      status: 'active' 
    });

    const averageRating = await Review.aggregate([
      { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: 'active' } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' }
        }
      }
    ]);

    // Format rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0;
    }
    stats.forEach(stat => {
      ratingDistribution[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: {
        totalReviews,
        averageRating: averageRating.length > 0 ? 
          Math.round(averageRating[0].average * 10) / 10 : 0,
        ratingDistribution
      }
    });

  } catch (error) {
    next(error);
  }
});

// Check if user can review another user for a specific listing
app.get("/reviews/can-review/:userId/:listingId", authenticateToken, async (req, res, next) => {
  try {
    const { userId: revieweeId, listingId } = req.params;
    const reviewerId = req.user.userId;

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      reviewee: revieweeId,
      listing: listingId
    });

    // Check if there's been an interaction (conversation exists)
    const conversation = await Conversation.findOne({
      participants: { $all: [reviewerId, revieweeId] },
      listing: listingId
    });

    res.json({
      success: true,
      canReview: !existingReview && !!conversation,
      hasExistingReview: !!existingReview,
      hasInteraction: !!conversation
    });

  } catch (error) {
    next(error);
  }
});

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
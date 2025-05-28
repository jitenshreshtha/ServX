require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Import models
const User = require("./models/User");
const Listing = require("./models/Listing");
const Project = require("./models/Project");
const { Message, Conversation } = require("./models/Message");

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true 
}));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection error:", err));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: "Email already exists" });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  res.status(500).json({ error: "Internal server error" });
};

// Routes

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "ServX API is running", 
    version: "1.0.0",
    endpoints: ["/signup", "/login", "/listings", "/projects", "/messages"]
  });
});

// User Authentication Routes
app.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, skills, bio, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      skills: skills || [],
      bio: bio || "",
      location: location || {}
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills
      }
    });

  } catch (error) {
    next(error);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
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
        skills: user.skills
      }
    });

  } catch (error) {
    next(error);
  }
});

// Protected Routes

// Get current user profile
app.get("/profile", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
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
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Listing Routes
app.post("/listings", authenticateToken, async (req, res, next) => {
  try {
    const { title, description, skillOffered, skillWanted, category, estimatedDuration, location, tags } = req.body;
    
    const listing = new Listing({
      title,
      description,
      skillOffered,
      skillWanted,
      category,
      estimatedDuration,
      location,
      tags: tags || [],
      author: req.user.userId
    });

    await listing.save();
    await listing.populate('author', 'name email skills rating');

    res.status(201).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
});

app.get("/listings", async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      skillOffered, 
      skillWanted, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (skillOffered) filter.skillOffered = new RegExp(skillOffered, 'i');
    if (skillWanted) filter.skillWanted = new RegExp(skillWanted, 'i');
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const listings = await Listing.find(filter)
      .populate('author', 'name email skills rating location')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's own listings
app.get("/my-listings", authenticateToken, async (req, res, next) => {
  try {
    const listings = await Listing.find({ author: req.user.userId })
      .populate('author', 'name email skills rating')
      .sort({ createdAt: -1 });

    res.json({ listings });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.BACK_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Post = require("./models/createPost");

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(" DB connected"))
  .catch((err) => console.error(" DB error:", err));

app.get("/", (req, res) => {
  console.log(" GET / called");
  res.send("HomePage");
});

app.post("/signup", async (req, res) => {
  console.log("POST /signup called with:", req.body);
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    //  Log user data
    console.log("New user registered:", {
      id: user._id,
      email: user.email,
    });

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    console.error(" Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  console.log(`User ${user.email} is logged in successfully`);

  res.json({
    message: "Login successful",
    user: { email: user.email, id: user._id },
  });
});

app.post("/posts", async (req, res) => {
  const { title, description, offeredSkill, wantedSkill, category } = req.body;
  const post = new Post({
    title,
    description,
    offeredSkill,
    wantedSkill,
    category,
    author: "GX",
  });
  await post.save();
});

app.get("/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.listen(process.env.BACK_PORT, () => {
  console.log(` Server running on http://localhost:${process.env.BACK_PORT}`);
});

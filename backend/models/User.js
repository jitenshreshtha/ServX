const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);

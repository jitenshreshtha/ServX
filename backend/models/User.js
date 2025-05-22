const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: String,
  passowrd: String,
  role: String,
  createdat: { type: Date, default: Date.now },
});

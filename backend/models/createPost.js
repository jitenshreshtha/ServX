const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  offeredSkill: String,
  wantedSkill: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
  author: { type: String },
});

module.exports = mongoose.model("Post", postSchema);

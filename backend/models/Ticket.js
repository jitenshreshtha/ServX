
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", ticketSchema);

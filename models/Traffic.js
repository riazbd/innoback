const mongoose = require("mongoose");

const trafficSchema = new mongoose.Schema({
  ip: { type: String, required: true }, // Hashed IP for privacy
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  timestamp: { type: Date, default: Date.now, expires: "30d" }, // TTL: 30 days
});

module.exports = mongoose.model("Traffic", trafficSchema);
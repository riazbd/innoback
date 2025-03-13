const mongoose = require("mongoose");

const trafficStatsSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // e.g., 2025-03-13
  visits: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
});

module.exports = mongoose.model("TrafficStats", trafficStatsSchema);
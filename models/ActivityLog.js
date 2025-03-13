const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
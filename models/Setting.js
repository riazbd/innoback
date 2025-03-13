const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  siteTitle: { type: String, default: "TradeX" },
  supportEmail: { type: String, default: "support@tradex.com" },
});

module.exports = mongoose.model("Setting", settingSchema);
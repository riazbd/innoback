const crypto = require("crypto");
const Traffic = require("../models/Traffic");

const logTraffic = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const hashedIp = crypto.createHash("sha256").update(ip).digest("hex"); // Anonymize IP
    const userId = req.user ? req.user.userId : null; // From auth middleware if logged in

    const traffic = new Traffic({
      ip: hashedIp,
      endpoint: req.path,
      method: req.method,
      userId,
    });

    await traffic.save();
    req.io.emit("newTraffic", { endpoint: req.path, timestamp: new Date() }); // Real-time update
  } catch (err) {
    console.error("Traffic logging error:", err);
  }
  next();
};

module.exports = logTraffic;
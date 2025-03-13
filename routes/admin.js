const express = require("express");
const router = express.Router();
const User = require("../models/User");
const FormSubmission = require("../models/FormSubmission");
const Setting = require("../models/Setting");
const ActivityLog = require("../models/ActivityLog");
const authMiddleware = require("../middleware/auth");
const Traffic = require("../models/Traffic"); // New
const TrafficStats = require("../models/TrafficStats");
require("dotenv").config();

// Role-based access control middleware
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

const logActivity = async (userId, action) => {
    try {
      await ActivityLog.create({ userId, action });
    } catch (err) {
      console.error("Error saving activity log:", err);
    }
  };

// Get all users (Admin only)
router.get("/users", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role (Admin only)
router.put("/users/:id", authMiddleware, restrictTo("Admin"), async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    // Log activity
    await logActivity(req.user._id, `Updated role of user ${user._id} to ${role}`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (Admin only)
router.delete("/users/:id", authMiddleware, restrictTo("Admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Log activity
    await logActivity(req.user._id, `Deleted user ${user._id}`);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all form submissions (Admin, Editor)
router.get("/forms", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
  try {
    const forms = await FormSubmission.find();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete form submission (Admin, Editor)
router.delete("/forms/:id", authMiddleware, restrictTo("Admin", "Editor"), async (req, res) => {
  try {
    const form = await FormSubmission.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json({ message: "Form deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get analytics (updated with real traffic data)
router.get("/analytics", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
    try {
      const signups = await User.countDocuments();
      const submissions = await FormSubmission.countDocuments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const trafficStats = await TrafficStats.findOne({ date: today }) || { visits: 0 };
      res.json({ signups, submissions, traffic: trafficStats.visits });
    } catch (err) {
      res.status(500).json({ message: "Server error", err: err.message });
    }
  });
  
  // Get detailed traffic data (Admin only)
  router.get("/traffic", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
    try {
      const rawTraffic = await Traffic.find().sort({ timestamp: -1 }).limit(100); // Last 100 visits
      const dailyStats = await TrafficStats.find().sort({ date: -1 }).limit(30); // Last 30 days
      res.json({ rawTraffic, dailyStats });
    } catch (err) {
      res.status(500).json({ message: "Server error", err: err.message });
    }
  });

// Get settings (Admin only)
router.get("/settings", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update settings (Admin only)
router.put("/settings", authMiddleware, restrictTo("Admin"), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get activity log (Admin only)
router.get("/activity", authMiddleware, restrictTo("Admin", "Editor", "Viewer"), async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
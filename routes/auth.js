const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
require("dotenv").config();

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
    const { email, password, rememberMe } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
      const payload = { userId: user._id, role: user.role }; // Include role
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: rememberMe ? "30d" : "1h",
      });
  
      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

// Forgot Password - Send Reset Link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = require("crypto").randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "InnoHedge Password Reset",
      html: `
        <h2>Reset Your InnoHedge Password</h2>
        <p>Click the link below to reset your password. This link will expire in 1 hour:</p>
        <a href="${resetUrl}" style="color: #ffd700; text-decoration: underline;">Reset Password</a>
        <p>If you didn’t request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// // Get All Users (Admin Only)
// router.get("/users", authMiddleware, async (req, res) => {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }
//     try {
//       const users = await User.find().select("-password -resetPasswordToken -resetPasswordExpires");
//       res.status(200).json(users);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Server error" });
//     }
//   });
  
//   // Update User Role (Admin Only)
//   router.put("/users/:id/role", authMiddleware, async (req, res) => {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }
//     const { role } = req.body;
//     try {
//       const user = await User.findById(req.params.id);
//       if (!user) return res.status(404).json({ message: "User not found" });
//       user.role = role;
//       await user.save();
//       res.status(200).json({ message: "Role updated successfully" });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Server error" });
//     }
//   });

module.exports = router;
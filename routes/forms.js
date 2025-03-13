const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormSubmission = require("../models/FormSubmission");
require("dotenv").config();

router.post("/submit", async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;
  if (!name || !email || !message || !recaptchaToken) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ message: "reCAPTCHA verification failed" });
    }

    const formSubmission = new FormSubmission({
      name,
      email,
      message,
      recaptchaToken,
    });
    await formSubmission.save();

    req.io.emit("newSubmission", { email }); // Emit WebSocket event
    res.status(200).json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

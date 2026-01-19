const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== ThingSpeak =====
const CHANNEL_ID = "3099976";
const READ_API_KEY = "5MLB5JS8PUMPDSRL";

// ===== Email from Render ENV =====
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Debug (safe)
console.log("EMAIL_USER:", EMAIL_USER ? "SET" : "NOT SET");
console.log("EMAIL_PASS:", EMAIL_PASS ? "SET" : "NOT SET");

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

let alertSent = false;

// ===== Health route =====
app.get("/", (req, res) => {
  res.send("✅ ThingSpeak Alert System is LIVE (1-Minute Threshold)");
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ===== Background monitoring =====
setInterval(async () => {
  try {
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=1`;
    const response = await axios.get(url);

    const lastEntry = response.data.feeds[0];
    if (!lastEntry) return;

    const lastTime = new Date(lastEntry.created_at);
    const now = new Date();
    const diffMin = (now - lastTime) / (1000 * 60);

    console.log(`Last update: ${diffMin.toFixed(2)} minutes ago`);

    // 🔴 THRESHOLD CHANGED TO 1 MINUTE
    if (diffMin > 1 && !alertSent) {
      console.log("🚨 ALERT CONDITION MET (1 minute) – sending email");

      await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_USER,
        subject: "⚠ ThingSpeak Alert (1-Minute Threshold)",
        text:
          "ALERT!\n\nNo data received from ThingSpeak Channel (ID: 3099976) for more than 1 minute.",
      });

      alertSent = true;
      console.log("📧 Alert email sent");
    }

    // Reset when data resumes
    if (diffMin <= 1) {
      alertSent = false;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}, 60000); // still checking every 1 minute


const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

const app = express();

// ✅ REQUIRED FOR RENDER
const PORT = process.env.PORT || 3000;

// ThingSpeak details
const CHANNEL_ID = "3099976";
const READ_API_KEY = "5MLB5JS8PUMPDSRL";

// Email credentials (from Render ENV)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// 🔴 SAFETY CHECK (VERY IMPORTANT)
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌ EMAIL_USER or EMAIL_PASS not set in environment variables");
}

// Setup mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

let alertSent = false;

// 🟢 Health route (Render checks this)
app.get("/", (req, res) => {
  res.send("ThingSpeak Alert System is running");
});

// 🟢 Start server FIRST (IMPORTANT)
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// 🟢 Run ThingSpeak check AFTER server starts
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

    if (diffMin > 5 && !alertSent) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_USER,
        subject: "⚠ ThingSpeak Alert",
        text: "No data received for more than 5 minutes.",
      });

      alertSent = true;
      console.log("📧 Alert email sent");
    }

    if (diffMin <= 5) alertSent = false;
  } catch (err) {
    console.error("❌ Runtime error:", err.message);
  }
}, 60000);


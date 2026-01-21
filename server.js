const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== ThingSpeak Details =====
const CHANNEL_ID = "3099976";
const READ_API_KEY = "5MLB5JS8PUMPDSRL";

// ===== Email from ENV =====
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Debug
console.log("EMAIL_USER:", EMAIL_USER ? "SET" : "NOT SET");
console.log("EMAIL_PASS:", EMAIL_PASS ? "SET" : "NOT SET");

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing");
  process.exit(1);
}

// ===== Gmail SMTP =====
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ===== TOGGLE STATE =====
let monitoringEnabled = true; // ON by default
let alertSent = false;

// ===== HOME PAGE WITH TOGGLE BUTTON =====
app.get("/", (req, res) => {
  res.send(`
    <h2>ThingSpeak Alert System</h2>
    <p>Status: <b>${monitoringEnabled ? "ON ✅" : "OFF ❌"}</b></p>
    <p>Alert Threshold: <b>5 Minutes</b></p>

    <form action="/toggle" method="POST">
      <button style="padding:10px;font-size:16px;">
        ${monitoringEnabled ? "Turn OFF Monitoring" : "Turn ON Monitoring"}
      </button>
    </form>
  `);
});

// ===== TOGGLE ROUTE =====
app.post("/toggle", (req, res) => {
  monitoringEnabled = !monitoringEnabled;
  alertSent = false; // reset alert state
  console.log(`🔁 Monitoring ${monitoringEnabled ? "ENABLED" : "DISABLED"}`);
  res.redirect("/");
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ===== BACKGROUND MONITORING =====
setInterval(async () => {
  try {
    if (!monitoringEnabled) {
      console.log("⏸ Monitoring is OFF");
      return;
    }

    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=1`;
    const response = await axios.get(url);

    const lastEntry = response.data.feeds[0];
    if (!lastEntry) return;

    const lastTime = new Date(lastEntry.created_at);
    const now = new Date();
    const diffMin = (now - lastTime) / (1000 * 60);

    console.log(`⏱ Last update: ${diffMin.toFixed(2)} minutes ago`);

    // 🔴 5-MINUTE THRESHOLD
    if (diffMin > 5 && !alertSent) {
      console.log("🚨 ALERT CONDITION MET (5 minutes)");

      await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_USER,
        subject: "⚠ ThingSpeak Alert (5-Minute Threshold)",
        text:
          "ALERT!\n\nNo data received from ThingSpeak Channel 3099976 for more than 5 minutes.",
      });

      alertSent = true;
      console.log("📧 Alert email sent");
    }

    if (diffMin <= 5) {
      alertSent = false;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}, 60000); // check every 1 minute





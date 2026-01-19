// =======================================
// ThingSpeak Alert System (Customized)
// Channel ID: 3099976
// Alert if no data for 5 minutes
// Email: kunalraj.soma@research.iiit.ac
// =======================================

// 1. Import required libraries
const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");

// 2. Create Express app
const app = express();
const PORT = 3000;

// 3. ======== THINGSPEAK DETAILS ========
const CHANNEL_ID = "3099976";
const READ_API_KEY = "5MLB5JS8PUMPDSRL";
// =====================================

// 4. ======== EMAIL DETAILS ========
const EMAIL_USER = "kunalraj.soma@research.iiit.ac";
const EMAIL_PASS = "PASTE_GMAIL_APP_PASSWORD_HERE"; // 🔴 IMPORTANT
// ==================================

// 5. Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// 6. Prevent repeated alerts
let alertSent = false;

// 7. Check ThingSpeak every 1 minute
setInterval(async () => {
  try {
    // Build ThingSpeak API URL
    const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=1`;

    // Fetch data
    const response = await axios.get(url);

    const lastEntry = response.data.feeds[0];
    if (!lastEntry) {
      console.log("No data available in ThingSpeak channel yet.");
      return;
    }

    // Time calculation
    const lastTime = new Date(lastEntry.created_at);
    const now = new Date();
    const diffMinutes = (now - lastTime) / (1000 * 60);

    console.log(
      `Last data received: ${diffMinutes.toFixed(2)} minutes ago`
    );

    // 8. Alert condition (5 minutes)
    if (diffMinutes > 5 && !alertSent) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_USER,
        subject: "⚠ ThingSpeak Data Alert",
        text:
          "ALERT!\n\nNo data has been received from ThingSpeak Channel (ID: 3099976) for more than 5 minutes.\n\nPlease check the IoT device or network connection.",
      });

      alertSent = true;
      console.log("✅ Alert email sent successfully.");
    }

    // 9. Reset alert when data resumes
    if (diffMinutes <= 5) {
      alertSent = false;
    }
  } catch (error) {
    console.error("❌ Error checking ThingSpeak:", error.message);
  }
}, 60000); // 60000 ms = 1 minute

// 10. Simple webpage
app.get("/", (req, res) => {
  res.send(`
    <h2>ThingSpeak Alert System</h2>
    <p><b>Status:</b> Running</p>
    <p><b>Channel ID:</b> 3099976</p>
    <p><b>Alert:</b> If no data for 5 minutes</p>
    <p><b>Email:</b> kunalraj.soma@research.iiit.ac</p>
  `);
});

// 11. Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


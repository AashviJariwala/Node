const jwt = require("jsonwebtoken");
require("dotenv").config();
const { google } = require("googleapis");
const admin = require("../ADMIN/models/admin");
const user = require("../models/user");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.generateToken = (id, email, type) => {
  const token = jwt.sign({ id, email, type }, process.env.JWT_SECRET);
  return token;
};

exports.verifyToken = (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    const token = bearerToken.split(" ")[1];
    if (!bearerToken || !bearerToken.startsWith("Bearer"))
      throw new Error("Invalid token");
    else {
      jwt.verify(token, process.env.JWT_SECRET, async (err, decode) => {
        if (err) throw new Error("Error in decoding");
        else {
          if (decode.type == "admin") {
            const verifyAdmin = await admin.findOne({ email: decode.email });
            if (verifyAdmin) {
              req.admin = verifyAdmin;
              next();
            } else {
              throw new Error("No email id found");
            }
          } else {
            const verifyUser = await user.findOne({ email: decode.email });
            if (verifyUser) {
              req.user = verifyUser;
              next();
            } else {
              throw new Error("No email id found");
            }
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.errors[0].message });
  }
};

exports.getGoogleClient = async (req, res, next) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const googleTokens = await user
      .findOne({ _id: req.user.id })
      .populate("gid");
    oAuth2Client.setCredentials({
      access_token: googleTokens.gid.accessToken,
      refresh_token: googleTokens.gid.refreshToken,
    });

    return google.calendar({ version: "v3", auth: oAuth2Client });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.errors[0].message });
  }
};

exports.sendMail = async (email, mlink, startTime, title, name, users) => {
  const mailOptions = {
    to: users,
    subject: "Meeting Notification",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
  
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #ddd;">
      
      <!-- Header -->
      <div style="background:#ffffff; padding:20px;">
        <p style="color:#1a73e8; font-size:16px; font-weight:500;">
          You have an upcoming event
        </p>
      </div>
  
      <!-- Main Card -->
      <div style="padding:20px; border-top:1px solid #eee;">
        
        <!-- Button -->
        <div style="text-align:center; margin-bottom:20px;">
          <a href=${mlink}
             style="background:#1a73e8; color:#fff; padding:12px 24px; 
                    border-radius:6px; text-decoration:none; font-weight:bold;">
            Join with Google Meet
          </a>
        </div>
  
        <!-- Meeting Link -->
        <p style="color:#555; font-size:14px; margin-bottom:5px;">
          <strong>Meeting link</strong>
        </p>
        <p style="color:#1a73e8; font-size:14px;">
          ${mlink}
        </p>
  
        <!-- Title -->
        <h2 style="margin:15px 0 10px 0;">${title}</h2>
  
        <!-- Date -->
        <p style="color:#555;">
          Friday, May 1, 2026 · 2:45pm - 3:45pm (IST)
          ${startTime}
        </p>
  
        <!-- Organizer -->
        <p style="margin-top:20px;"><strong>Organizer</strong></p>
        <p style="color:#555;">
          ${name} <br/>
          ${email}
        </p>
  
        <!-- Guests -->
        <p style="margin-top:20px;"><strong>Guests</strong></p>
        <p style="color:#1a73e8;">View all event details</p>
  
      </div>
  
    </div>
  
    <!-- Footer -->
    <div style="max-width:600px; margin:auto; padding:15px; font-size:12px; color:#777;">
      <p>Invitation from Google Calendar</p>
      <p>
        You are receiving this email because you are subscribed to calendar notifications.
      </p>
    </div>
  
  </div>
        `,
  };
  try {
    const sendMail = await transporter.sendMail(mailOptions);
    return sendMail;
  } catch (err) {
    return err;
  }
};

exports.formatToISTRange = (startISO, durationMinutes = 60) => {
  const start = new Date(startISO);

  // Convert to IST using Intl
  const optionsDate = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  };

  const optionsTime = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };

  // Format date
  const datePart = new Intl.DateTimeFormat("en-IN", optionsDate).format(start);

  // Start time
  const startTime = new Intl.DateTimeFormat("en-IN", optionsTime).format(start);

  return `${datePart} · ${startTime} (IST)`;
};

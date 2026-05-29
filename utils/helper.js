const jwt = require("jsonwebtoken");
require("dotenv").config();
const { google } = require("googleapis");
const admin = require("../ADMIN/models/admin");
const user = require("../models/user");
const googleTokens = require("../models/googleTokens");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_ID,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

exports.generateToken = (id, email, type) => {
  const token = jwt.sign({ id, email, type }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
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

exports.getGoogleClient = async (req, res, id) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  let googleUser;
  if (id == null) {
    googleUser = await user.findOne({ _id: req.user._id }).populate("gid");
  } else {
    googleUser = await user.findOne({ _id: id }).populate("gid");
  }

  const tokenData = googleUser.gid;

  oAuth2Client.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
    expiry_date: tokenData.expiryDate,
  });

  const isExpired = tokenData.expiryDate
    ? Date.now() >= tokenData.expiryDate - 5 * 60 * 1000
    : true;

  if (isExpired) {
    console.log("Access token expired, refreshing...");
    const { credentials } = await oAuth2Client.refreshAccessToken();

    await googleTokens.findByIdAndUpdate(tokenData._id, {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
    });

    oAuth2Client.setCredentials(credentials);
  }

  return google.calendar({ version: "v3", auth: oAuth2Client });
};

exports.sendMail = async (email, mlink, startTime, title, name, users) => {
  try {
    console.log("mail");
    console.log(email);
    console.log(users);
    const mailOptions = await resend.emails.send({
      from: "Synchro <onboarding@resend.dev>",
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
          ${startTime}
        </p>
  
        <!-- Organizer -->
        <p style="margin-top:20px;"><strong>Organizer</strong></p>
        <p style="color:#555;">
          ${name} <br/>
          ${email}
        </p>
  
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
    });
    console.log(mailOptions);
    return mailOptions;
  } catch (err) {
    console.error("MAIL ERROR CODE:", err.code);
    console.error("MAIL ERROR MESSAGE:", err.message);
    console.error("MAIL ERROR RESPONSE:", err.response);
    return err;
  }
};

exports.formatToISTRange = (startISO, endISO, durationMinutes = 60) => {
  const start = new Date(startISO);
  const end = new Date(endISO);
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

  // End time
  const endTime = new Intl.DateTimeFormat("en-IN", optionsTime).format(end);

  return `${datePart} · ${startTime} - ${endTime} (IST)`;
};

exports.uploadOnCloud = async (file) => {
  const uniqueFileName = uuidv4();
  let folderName = "";
  let dataURI;

  folderName = "CompanyUserIDCard";
  const b64 = Buffer.from(file.buffer).toString("base64");
  dataURI = "data:" + file.mimetype + ";base64," + b64;

  const result = await cloudinary.v2.uploader.upload(dataURI, {
    folder: folderName,
    public_id: uniqueFileName,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    resource_type: "auto",
  });

  console.log("helper");
  console.log(result.url);

  return {
    url: result.url,
  };
};

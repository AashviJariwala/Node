const jwt = require("jsonwebtoken");
require("dotenv").config();
const { google } = require("googleapis");
const admin = require("../ADMIN/models/admin");
const user = require("../models/user");

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

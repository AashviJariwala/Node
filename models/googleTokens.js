const mongoose = require("mongoose");

const googleTokens = mongoose.model(
  "googleTokens",
  new mongoose.Schema({
    googleId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
  })
);

module.exports = googleTokens;

const mongoose = require("mongoose");
const validator = require("validator");

const user = mongoose.model(
  "user",
  new mongoose.Schema({
    googleId: { type: String },
    googleAccessToken: { type: String },
    username: { type: String },
  })
);

module.exports = user;

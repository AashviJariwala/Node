const mongoose = require("mongoose");
const validator = require("validator");

const admin = mongoose.model(
  "admin",
  new mongoose.Schema({
    email: {
      type: String,
      validate: [validator.isEmail, "Incorrect email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password should be minimum 4 characters"],
    },
  })
);

module.exports = admin;

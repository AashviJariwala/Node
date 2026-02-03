const mongoose = require("mongoose");
const validator = require("validator");

const role = mongoose.model(
  "role",
  new mongoose.Schema({
    name: { type: String },
  })
);

module.exports = role;

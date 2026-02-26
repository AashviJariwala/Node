const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.generateToken = (id, email) => {
  const token = jwt.sign({ id, email }, process.env.JWT_SECRET);
  return token;
};

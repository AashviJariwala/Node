const admin = require("../models/admin");
const ApiError = require("../../utils/ApiError");
const { generateToken } = require("../../utils/helper");
const jwt = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  try {
    const admin1 = await admin.findOne({
      email: req.body.email,
      password: req.body.password,
    });
    if (!admin1)
      return res
        .status(404)
        .send({ success: true, error: "Invalid credentials" });
    else {
      const token = generateToken(admin1._id, admin1.email,"admin");
      return res
        .status(200)
        .send({ success: true, msg: "Login successful", data: token });
    }
  } catch (err) {
    return next(new ApiError(err));
  }
};

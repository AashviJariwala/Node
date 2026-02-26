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
      const token = generateToken(admin1._id, admin1.email);
      return res
        .status(200)
        .send({ success: true, msg: "Login successful", data: token });
    }
  } catch (err) {
    return next(new ApiError(err));
  }
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
          const verifyAdmin = await admin.findOne({ email: decode.email });
          console.log(verifyAdmin);

          if (verifyAdmin) {
            req.admin = verifyAdmin.dataValues;
            next();
          } else {
            throw new Error("No email id found");
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ error: err.errors[0].message });
  }
};

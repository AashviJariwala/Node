const express = require("express");
const myPass = require("../auth/passport");
const { generateToken } = require("../utils/helper");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/google",
  myPass.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/auth/google/callback",
  myPass.authenticate("google", {
    session: false,

    failureRedirect: `${process.env.REACT_URL}/?error=calendar_permission_denied`,
  }),
  (req, res) => {
    const token = generateToken(req.user.user._id, req.user.user.email, null);
    const msg = req.user.isNewUser ? "User is new" : "User exists";

    res.redirect(
      `${process.env.REACT_URL}/google/callback?msg=${encodeURIComponent(
        msg
      )}&token=${token}`
    );
  }
);

module.exports = router;

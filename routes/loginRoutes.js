const express = require("express");
const myPass = require("../auth/passport");
const { generateToken } = require("../utils/helper");
const jwt = require("jsonwebtoken");

const router = express.Router();

// 🔥 Google login route (start OAuth)
router.get(
  "/google",
  myPass.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar"
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

// 🔥 Google callback route
"email",
router.get(
  "/auth/google/callback",
  myPass.authenticate("google", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    const token = generateToken(req.user.user._id,req.user.user.email,null);
    const msg = req.user.isNewUser
      ? "User is new"
      : "User exists";

    res.redirect(`http://localhost:5173/google/callback?msg=${encodeURIComponent(msg)}&token=${token}`);

  }
);

module.exports = router;

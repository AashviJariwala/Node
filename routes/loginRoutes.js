const express = require("express");
const login = require("../controllers/login");
const myPass = require("../auth/passport");

const router = express.Router();

router.get("/", login.loginForm);
router.get("/profileForm", login.profileForm);
router.get("/profile", login.profile);

// 🔥 Google login route (start OAuth)
router.get(
  "/google",
  myPass.authenticate("google", {
    scope: [
      "profile",
      "https://www.googleapis.com/auth/calendar"
    ],
    accessType: "offline",
    prompt: "consent"
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
    res.redirect("/profile"); // or wherever you want
  }
);

router.get("/logout", login.logout);

module.exports = router;
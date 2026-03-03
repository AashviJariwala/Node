const express = require("express");
const myPass = require("../auth/passport");

const router = express.Router();

// 🔥 Google login route (start OAuth)
router.get(
  "/google",
  myPass.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);

// 🔥 Google callback route
"email",
  router.get(
    "/auth/google/callback",
    myPass.authenticate("google", {
      failureRedirect: "/login",
    }),
    (req, res) => {
      res.redirect("/profile"); // or wherever you want
    }
  );

module.exports = router;

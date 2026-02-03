const express = require("express");
const login = require("../controllers/login");
const myPass = require("../auth/passport");

const router = express.Router();
router.get("/", login.loginForm);
router.get("/profileForm", login.profileForm);
router.get("/profile", login.profile);
router.get("/google", myPass.authenticate("google", { scope: ["profile"] }));
router.get(
  "/auth/google/callback",
  myPass.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/login/profile");
  }
);

router.get("/logout",login.logout);
module.exports = router;

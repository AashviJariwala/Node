const user = require("../models/user");

exports.loginForm = (req, res) => {
  return res.render("login.ejs");
};

exports.profileForm = (req, res) => {
  return res.render("profile.ejs");
};

exports.login = (req, res) => {
  if (req.user) return res.redirect("profileForm");
  return res.render("login.ejs");
};

exports.profile = (req, res) => {
  if (!req.user) {
    console.log("user not found");
    return res.redirect("/login");
  }
  return res.render("profile.ejs", { username: req.user.username });
};

exports.logout = (req, res, next) => {
  return res.redirect("/login");
};

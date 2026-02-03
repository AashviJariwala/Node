const express = require("express");
const path = require("path");
require("dotenv").config();
require("./config/myconn");
require("./models/role");
const session = require("express-session");
// const loginRoutes = require("./routes/loginRoutes");
// const passport = require("./auth/passport");

const app = express();
// app.use(
//   session({
//     secret: "session_secret",
//     saveUninitialized: true,
//     resave: false,
//   })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());
// app.use(passport.session());

// app.use("/login", loginRoutes);

app.listen(3000, () => console.log("Listening on 3000"));

const express = require("express");
const path = require("path");
const cors=require("cors");
require("dotenv").config();
require("./config/myconn");
const roles=require("./models/role");
require("./models/googleTokens");
require("./models/department");
const session = require("express-session");
const loginRoutes = require("./routes/loginRoutes");
const passport = require("./auth/passport");


const app = express();
app.use(
  session({
    secret: "session_secret",
    saveUninitialized: true,
    resave: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(passport.initialize());
app.use(passport.session());

app.use("/login", loginRoutes);

app.listen(3000, () => console.log("Listening on 3000"));

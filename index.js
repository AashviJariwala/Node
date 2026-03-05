const express = require("express");
const cors=require("cors");
const morgan=require("morgan");
const {errorHandler}=require("./middleware/errorHandler");
const session=require("express-session");
require("dotenv").config();
require("./config/myconn");
const adminRoutes=require("./ADMIN/routes/adminRoutes");
const loginRoutes = require("./routes/loginRoutes");
const authenticationRoutes = require("./routes/authenticationRoutes");

const passport = require("./auth/passport");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);
app.use("/public", express.static("public"));
app.use(cors());
app.use(morgan("dev"));

app.use(passport.initialize());
app.use(passport.session());

app.use("/admin", adminRoutes);
app.use("/login", loginRoutes);
app.use("/auth", authenticationRoutes);
app.use(errorHandler);

app.listen(3000, () => console.log("Listening on 3000"));

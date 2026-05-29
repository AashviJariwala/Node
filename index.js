console.log("=== APP STARTING ===");
const express = require("express");
console.log("express ok");
const cors = require("cors");
console.log("cors ok");
const morgan = require("morgan");
console.log("morgan ok");
const { errorHandler } = require("./middleware/errorHandler");
console.log("error ok");
require("dotenv").config();
console.log("env ok");
require("./config/myconn");
console.log("conn ok");
const cloudinary=require("cloudinary");
console.log("cloudinary ok");

const { sendReminders } = require("./jobs/sendReminders");
console.log("sendReminders ok");

const adminRoutes = require("./ADMIN/routes/adminRoutes");
console.log("adminRoutes ok");

const loginRoutes = require("./routes/loginRoutes");
console.log("loginRoutes ok");

const authenticationRoutes = require("./routes/authenticationRoutes");
console.log("authenticationRoutes ok");

const calendarRoutes = require("./routes/calendarRoutes");
console.log("calendarRoutes ok");

const searchRoutes = require("./routes/searchRoutes");
console.log("searchRoutes ok");
;
const userRoutes = require("./routes/userRoutes");
console.log("userRoutes ok");

const meetingRoutes = require("./routes/meetingRoutes");
console.log("meetingRoutes ok");

const passport = require("./auth/passport");
console.log("passport ok");


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/public", express.static("public"));
app.use(cors());
app.use(morgan("dev"));

app.use(passport.initialize());

app.use("/admin", adminRoutes);
app.use("/login", loginRoutes);
app.use("/auth", authenticationRoutes);
app.use("/calendar", calendarRoutes);
app.use("/search", searchRoutes);
app.use("/user", userRoutes);
app.use("/meeting", meetingRoutes);

sendReminders();

app.use((err, req, res, next) => {
  if (
    err &&
    err.message &&
    err.message.toLowerCase().includes("failed to obtain access token")
  ) {
    return res.redirect(
      `${process.env.REACT_URL}/?error=calendar_permission_denied`
    );
  }
  next(err);
});

cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret:process.env.API_SECRET,
});

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => console.log("Listening on 3000"));

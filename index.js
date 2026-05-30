const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");
require("dotenv").config();
require("./config/myconn");
const cloudinary=require("cloudinary");
const { sendReminders } = require("./jobs/sendReminders");
const { updateMeetingStatus } = require("./jobs/updateMeetingStatus");
const adminRoutes = require("./ADMIN/routes/adminRoutes");
const loginRoutes = require("./routes/loginRoutes");
const authenticationRoutes = require("./routes/authenticationRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const searchRoutes = require("./routes/searchRoutes");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const passport = require("./auth/passport");


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
updateMeetingStatus();

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

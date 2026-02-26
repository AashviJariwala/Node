const express = require("express");
const cors=require("cors");
const morgan=require("morgan");
const {errorHandler}=require("./middleware/errorHandler");
require("dotenv").config();
require("./config/myconn");
require("./models/role");
require("./ADMIN/models/admin");
const adminRoutes=require("./ADMIN/routes/adminRoutes");
// const loginRoutes = require("./routes/loginRoutes");
// const passport = require("./auth/passport");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev")); 
// app.use(passport.initialize());
// app.use(passport.session());

app.use("/admin", adminRoutes);
// app.use("/login", loginRoutes);
app.use(errorHandler);


app.listen(3000, () => console.log("Listening on 3000"));

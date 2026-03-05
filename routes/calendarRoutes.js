const express = require("express");
const path = require("path");
const {verifyToken}=require("../utils/helper");

const calendarController=require("../controllers/calendarController");

const router = express.Router();

router.get("/syncFromGoogle",verifyToken,calendarController.syncFromGoogle);

module.exports = router;
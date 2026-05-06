const express = require("express");
const path = require("path");
const { verifyToken } = require("../utils/helper");

const meetingController = require("../controllers/meetingController");

const router = express.Router();

router.get("/getAllMeetings",verifyToken, meetingController.getAllMeetings);
router.post("/sendNoti", verifyToken, meetingController.sendNoti);

module.exports = router;

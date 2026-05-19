const express = require("express");
const path = require("path");
const { verifyToken } = require("../utils/helper");

const meetingController = require("../controllers/meetingController");

const router = express.Router();

router.post("/creatInstantMeetingEvent", verifyToken, meetingController.creatInstantMeetingEvent);
router.get("/getAllMeetings",verifyToken, meetingController.getAllMeetings);
router.post("/sendNoti", verifyToken, meetingController.sendNoti);
router.post("/scheduleMeeting", verifyToken, meetingController.scheduleMeeting);

module.exports = router;

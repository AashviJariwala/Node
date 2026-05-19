const express = require("express");
const path = require("path");
const { verifyToken } = require("../utils/helper");

const calendarController = require("../controllers/calendarController");

const router = express.Router();

router.get("/syncFromGoogle", verifyToken, calendarController.syncFromGoogle);
router.post("/createEvent", verifyToken, calendarController.createEvent);
router.delete("/deleteEvent/:id", verifyToken, calendarController.deleteEvent);
router.put(
  "/editEventVisibility/:id/:visibility",
  verifyToken,
  calendarController.editEventVisibility
);
router.get("/getVisibility/:id", verifyToken, calendarController.getVisibility);
router.put(
  "/editEvent/:id/:googleId",
  verifyToken,
  calendarController.editEvent
);
router.post(
  "/createCollaborativeEvent",
  verifyToken,
  calendarController.createCollaborativeEvent
);
router.get(
  "/checkCollabEvent/:id",
  verifyToken,
  calendarController.checkCollabEvent
);

module.exports = router;

const express = require("express");
const router = express.Router();
const { sendReminders } = require("../jobs/sendReminders");
const { updateMeetingStatus } = require("../jobs/updateMeetingStatus");

// Only Cloud Scheduler should be able to trigger these. Scheduler sends a
// shared secret in the X-Tasks-Secret header; reject anything that doesn't match.
function verifyTaskSecret(req, res, next) {
  const secret = req.get("X-Tasks-Secret");
  if (!process.env.TASKS_SECRET || secret !== process.env.TASKS_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

router.post("/send-reminders", verifyTaskSecret, async (req, res) => {
  try {
    await sendReminders();
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("send-reminders error:", err);
    res.status(500).json({ error: "failed" });
  }
});

router.post("/update-meeting-status", verifyTaskSecret, async (req, res) => {
  try {
    await updateMeetingStatus();
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("update-meeting-status error:", err);
    res.status(500).json({ error: "failed" });
  }
});

module.exports = router;

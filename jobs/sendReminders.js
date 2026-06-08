const meeting = require("../models/meeting");
const meetingUser = require("../models/meetingUser");
const { sendMail, formatToISTRange } = require("../utils/helper");

// Sends reminder emails for meetings whose reminderTime falls in the last minute.
// Invoked via HTTP (POST /tasks/send-reminders) by Cloud Scheduler, once per minute.
exports.sendReminders = async () => {
  console.log("send reminder", new Date());
  let emails = [];
  let now = Date.now();
  let oneMinuteAgo = now - 60 * 1000;

  const m1 = await meeting
    .find({ status: "scheduled" })
    .populate({ path: "eid", populate: { path: "uid" } });

  if (m1.length != 0) {
    for (let m of m1) {
      const d1 = await formatToISTRange(m.eid.start, m.eid.end);
      const users = await meetingUser.findOne({ mid: m._id }).populate("uid");
      if (users) {
        for (u of users.uid) {
          emails.push(u.email);
        }
        if (m.eid.reminderTime >= oneMinuteAgo && m.eid.reminderTime <= now) {
          console.log("inside");
          sendMail(
            m.eid.uid.email,
            m.eid.mlink,
            d1,
            m.eid.title,
            m.eid.uid.name,
            emails
          );
        }
      }
    }
  }
};

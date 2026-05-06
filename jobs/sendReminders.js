const cron = require("node-cron");
const meeting = require("../models/meeting");
const meetingUser = require("../models/meetingUser");
const { sendMail, formatToISTRange } = require("../utils/helper");

exports.sendReminders = () => {
  cron.schedule("* * * * *", async () => {
    try {
      let emails = [];
      let now = Date.now();
      const m1 = await meeting
        .find({ status: "scheduled" })
        .populate({ path: "eid", populate: { path: "uid" } });

      for (m of m1) {
        const d1 = await formatToISTRange(m.eid.start);
        const users = await meetingUser.findOne({ mid: m._id }).populate("uid");
        if (users) {
          for (u of users.uid) {
            emails.push(u.email);
          }
          if (now===m.eid.reminderTime) {
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
    } catch (error) {
      console.log("Reminders error : ", error);
    }
  });
};

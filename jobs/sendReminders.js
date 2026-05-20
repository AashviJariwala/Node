const cron = require("node-cron");
const meeting = require("../models/meeting");
const meetingUser = require("../models/meetingUser");
const { sendMail, formatToISTRange } = require("../utils/helper");

exports.sendReminders = () => {
  cron.schedule("* * * * *", async () => {
    console.log("send reminder", new Date());
    try {
      let emails = [];
      let now = Date.now();
      let oneMinuteAgo = now - 60 * 1000;

      const m1 = await meeting
        .find({ status: "scheduled" })
        .populate({ path: "eid", populate: { path: "uid" } });

      if(m1.length!=0){
        for (let m of m1) {
          const d1 = await formatToISTRange(m.eid.start,m.eid.end);
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

    } catch (error) {
      console.log("Reminders error : ", error);
    }
  });
};

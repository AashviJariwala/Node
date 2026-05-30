const cron = require("node-cron");
const meeting = require("../models/meeting");
const calendarEvents = require("../models/calendarEvents");

exports.updateMeetingStatus = () => {
  cron.schedule("* * * * *", async () => { 
    try {
      const now = new Date();
  
      const expiredEvents = await calendarEvents.find({
        end: { $lt: now },
      }).lean();
  
      if (!expiredEvents.length) return;
  
      const expiredIds = expiredEvents.map((e) => e._id);
  
      const m1=await meeting.updateMany(
        { eid: { $in: expiredIds } },
        { $set: { status: "completed" } }
      );
      
      console.log(`Updated ${expiredIds.length} meetings to completed`);
    } catch (err) {
      console.error("Update Meeting Status error:", err);
    }
  });
};

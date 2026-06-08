const meeting = require("../models/meeting");
const calendarEvents = require("../models/calendarEvents");

// Marks meetings as "completed" once their calendar event has ended.
// Invoked via HTTP (POST /tasks/update-meeting-status) by Cloud Scheduler, once per minute.
exports.updateMeetingStatus = async () => {
  const now = new Date();

  const expiredEvents = await calendarEvents
    .find({ end: { $lt: now } })
    .lean();

  if (!expiredEvents.length) return;

  const expiredIds = expiredEvents.map((e) => e._id);

  await meeting.updateMany(
    { eid: { $in: expiredIds } },
    { $set: { status: "completed" } }
  );

  console.log(`Updated ${expiredIds.length} meetings to completed`);
};

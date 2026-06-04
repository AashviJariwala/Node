const calendarEvents = require("../models/calendarEvents");
const collaborativeEvents = require("../models/collaborativeEvents");
const meetingUser = require("../models/meetingUser");
const user = require("../models/user");
const ApiError = require("../utils/ApiError");

exports.showAllEmployee = async (req, res, next) => {
  try {
    const users = await user
      .find({ _id: { $ne: req.user._id } }, "name")
      .lean();
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.searchProfile = async (req, res, next) => {
  try {
    const users = await user.aggregate([
      {
        $search: {
          autocomplete: {
            query: req.params.name,
            path: "name",
          },
        },
      },
      {
        $match: {
          _id: {
            $ne: req.user._id,
          },
        },
      },
    ]);
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.userProfile = async (req, res, next) => {
  try {
    const user1 = await user.find({ _id: req.params.id });
    const events = await calendarEvents.find({ uid: req.params.id });
    const data1 = {
      name: user1[0].name,
      events: events,
      visibility: user1[0].visibility,
    };
    return res.status(200).send({ success: true, data: data1 });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

function generateHourlySlots(date) {
  const slots = [];

  const ist = new Date(
    new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
      "T00:00:00+05:30"
  );

  for (let i = 0; i < 24; i++) {
    const start = new Date(ist.getTime() + i * 60 * 60 * 1000);
    const end = new Date(ist.getTime() + (i + 1) * 60 * 60 * 1000);
    const label = `${i}:00`; // i=0 → "0:00" IST, i=19 → "19:00" IST

    slots.push({ start, end, label });
  }

  return slots;
}

function isUserBusy(events, slotStart, slotEnd) {
  return events.some((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    return slotStart < eventEnd && slotEnd > eventStart;
  });
}

exports.searchByTimeslot = async (req, res, next) => {
  try {
    const { uid } = req.body;
    const slots = generateHourlySlots(Date.now());
    const freeSlots = [];
    const currentTime = new Date();

    for (let slot of slots) {
      if (new Date(slot.start) <= currentTime) continue;
      let allFree = true;

      for (let id of uid) {
        let allEvents = []; // ✅ reset for each user on each slot

        const events = await calendarEvents.find({ uid: id });

        const collabEvents = await collaborativeEvents
          .find({ uid: id })
          .populate("eid")
          .lean();

        const meetings = await meetingUser
          .find({ uid: id })
          .populate({ path: "mid", populate: { path: "eid" } })
          .lean();

        for (let e1 of collabEvents) allEvents.push(e1.eid);
        for (let e2 of meetings) allEvents.push(e2.mid.eid);

        if (
          isUserBusy(allEvents, slot.start, slot.end) ||
          isUserBusy(events, slot.start, slot.end)
        ) {
          allFree = false;
          break;
        }
      }

      if (allFree) freeSlots.push(slot.label);
    }

    return res.status(200).send({ success: true, data: freeSlots });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

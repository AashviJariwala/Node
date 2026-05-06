const calendarEvents = require("../models/calendarEvents");
const user = require("../models/user");
const ApiError = require("../utils/ApiError");

exports.showAllEmployee = async (req, res, next) => {
  try {
    const users = await user.find({_id:{$ne:req.user._id}});
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
    ]);
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.userProfile= async (req, res, next) => {
  try {
    const user1=await user.find({_id:req.params.id});
    const events=await calendarEvents.find({uid:req.params.id});
    const data1={
      name:user1[0].name,
      events:events,
      visibility:user1[0].visibility
    };
    return res.status(200).send({ success: true, data: data1 });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

function generateHourlySlots(date) {
  
  const slots = [];

  for (let i = 0; i < 24; i++) {
    const start = new Date(date);
    start.setHours(i, 0, 0, 0);

    const end = new Date(date);
    end.setHours(i + 1, 0, 0, 0);

    slots.push({ start, end, label: `${i}:00` });
  }

  return slots;
}

function isUserBusy(events, slotStart, slotEnd) {
  return events.some(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    return slotStart < eventEnd && slotEnd > eventStart;
  });
}

exports.searchByTimeslot= async (req, res, next) => {
   try {
      const  {uid}  = req.body;
      // for (let id of uid) {
      // console.log(id);
      // }
      
    const slots = generateHourlySlots(Date.now());

    const freeSlots = [];

    for (let slot of slots) {
      let allFree = true;

       for (let id of uid) {
        const events = await calendarEvents.find({
          uid: id,
        });

        if (isUserBusy(events, slot.start, slot.end)) {
          allFree = false;
          break;
        }
      }

      if (allFree) {
        freeSlots.push(slot.label);
      }
    }
    return res.status(200).send({ success: true, data: freeSlots });
    } catch (err) {
        console.error(err.message);
        return next(new ApiError(err));
    }
};






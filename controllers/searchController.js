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

function getSlotStatus(events, slotStart, slotEnd) {
  let hasOverlap = false;
  let fullyCovered = false;

  for (let event of events) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (slotStart < eventEnd && slotEnd > eventStart) {
      hasOverlap = true;

      if (eventStart <= slotStart && eventEnd >= slotEnd) {
        fullyCovered = true;
        break;
      }
    }
  }

  if (fullyCovered) return "BUSY";
  if (hasOverlap) return "PARTIAL";
  return "FREE";
}

exports.searchByTimeslot= async (req, res, next) => {
   try {
    const  uid  = req.params.id;
    
    const slots = generateHourlySlots(Date.now());

    const result = [];

    for (let id of uid) {
      const events = await calendarEvents.find({uid:id})
      events.map((e)=>{
        console.log(events);
      })

      const slotStatus = slots.map((slot) => ({
        time: slot.label,
        status: getSlotStatus(events, slot.start, slot.end),
      }));

      result.push({
        name,
        slots: slotStatus,
      });
      console.log(result);
      
    }

    // return res.status(200).send({ success: true, data: events2 });
    } catch (err) {
        console.error(err.message);
        return next(new ApiError(err));
    }
};



// exports.searchByTimeslot= async (req, res, next) => {
//   try {
//     const now = new Date();
//     // Get first day of week (Sunday)
//     const firstDay = new Date(now);
//     firstDay.setDate(now.getDate() - now.getDay());
//     firstDay.setHours(0, 0, 0, 0);

//     // Get last day of week (Saturday)
//     const lastDay = new Date(now);
//     lastDay.setDate(now.getDate() + (6 - now.getDay()));
//     lastDay.setHours(23, 59, 59, 999);
//     const events=await calendarEvents.find();
//     var events2=[];
//     const e1=events.map((e)=>{
//       if (e.start >= firstDay && e.start <= lastDay) {
//            events2.push(e);
//       } 
//       else
//         return null;
//     })
//     return res.status(200).send({ success: true, data: events2 });
//   } catch (err) {
//     console.error(err.message);
//     return next(new ApiError(err));
//   }
// };






const { getGoogleClient ,formatToISTRange} = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const collaborativeEvents = require("../models/collaborativeEvents");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const meeting = require("../models/meeting");

exports.syncFromGoogle = async (req, res, next) => {
  try {
    let s1;
    let end1;
    let d1 = Date.now();
    let status;
    let rt;
    let startTime=[];
    const calendar = await getGoogleClient(req, res, null);

    const googleEvents = await calendar.events.list({
       calendarId: "primary",
  maxResults: 2500,          // increase the limit
  singleEvents: true,        // expand recurring events
  orderBy: "startTime",
    });

    const ids = [];

    for (let e1 of googleEvents.data.items) {
      const isCollabPartcipant = await collaborativeEvents.findOne({
        uid: req.user._id,
        hostGoogleEventID: e1.id,
      });
      if (isCollabPartcipant) {
        console.log("event already existss!!!!!!");
        continue;
      }
      const existingEvent = await calendarEvents.findOne({
        googleEventID: e1.id,
        uid: req.user._id,
      });

      if ("date" in e1.start) {
        s1 = new Date(e1.start.date);

        let tmpEnd = new Date(e1.end.date);
        tmpEnd.setDate(tmpEnd.getDate() - 1);
        end1 = tmpEnd;
      } else {
        s1 = new Date(e1.start.dateTime);
        end1 = new Date(e1.end.dateTime);
      }

      if (!existingEvent) {
        const newEvent = await calendarEvents.create({
          title: e1.summary,
          description: e1.description,
          start: s1,
          end: end1,
          uid: req.user._id,
          googleEventID: e1.id,
          mlink: e1.hangoutLink,
          visibility: req.user.visibility,
          created: e1.created,
          updated: e1.updated,
        });

        if (newEvent.mlink) {
          status = new Date(end1) < d1 ? "completed" : "scheduled";
          rt = new Date(s1.getTime() - 10 * 60 * 1000);
          const editReminTime = await calendarEvents.findOneAndUpdate(
            { _id: newEvent._id },
            {
              $set: {
                reminderTime: rt,
              },
            },
            { new: true }
          );
          const newMeeting = await meeting.create({
            eid: newEvent._id,
            status,
            created: e1.created,
            updated: e1.updated,
          });
        }
      } else {
        const c1 = new Date(e1.created);
        const format1 = c1.toISOString().split(".")[0];
        const u1 = new Date(e1.updated);
        const format2 = u1.toISOString().split(".")[0];
        if (format1.match(format2));
        else {
          const editedEvents = await calendarEvents.findOneAndUpdate(
            { _id: existingEvent._id },
            {
              $set: {
                title: e1.summary,
                description: e1.description,
                start: s1,
                end: end1,
                uid: req.user._id,
                googleEventID: e1.id,
                mlink: e1.hangoutLink,
                visibility: req.user.visibility,
                created: e1.created,
                updated: e1.updated,
              },
            },
            { new: true }
          );

          if (editedEvents.mlink) {
            status = new Date(end1) < d1 ? "completed" : "scheduled";
            rt = new Date(s1.getTime() - 10 * 60 * 1000);
            const editReminTime = await calendarEvents.findOneAndUpdate(
              { _id: editedEvents._id },
              {
                $set: {
                  reminderTime: rt,
                },
              },
              { new: true }
            );
            const newMeeting = await meeting.findOneAndUpdate(
              {
                eid: editedEvents._id,
              },
              {
                $set: {
                  status,
                  created: e1.created,
                  updated: e1.updated,
                },
              }
            );
          }
        }
      }
    }

    const events1 = await calendarEvents.find({ uid: req.user._id });
const googleEventIds = new Set(googleEvents.data.items.map(e => e.id));


    for (let e2 of events1) {
  if (e2.googleEventID && !googleEventIds.has(e2.googleEventID)) {
    await meeting.findOneAndDelete({ eid: e2._id });
    await collaborativeEvents.findOneAndDelete({ eid: e2._id });
    await calendarEvents.findOneAndDelete({ _id: e2._id });
  }
}
    const googleEvents1= await calendarEvents.find({ uid: req.user._id }).lean();
      const eventData=await Promise.all(
        googleEvents1.map(async(raw)=>{
        return {
          ...raw,
          dateTime: formatToISTRange(raw.start, raw.end)
        }

      }))
    const collabRec = await collaborativeEvents
      .find({
        uid: req.user._id,
      })
      .populate("eid");

    if (collabRec) {
      const collabEvents = collabRec.map((e) => e.eid);
      const allEvents = [...eventData, ...collabEvents];
      return res.status(200).send({ success: true, data: allEvents });
    } else{ 
      return res.status(200).send({ success: true, data: eventData })}
  } catch (err) {
    console.error(err);
     console.error("DB create failed for event:", e1.id, err.message);
    return next(new ApiError(err));
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, date, start, end, description } = req.body;
    const calendar = await getGoogleClient(req, res, null);
    const startDate = `${date}T${start}:00+05:30`;
    const endDate = `${date}T${end}:00+05:30`;
    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDate,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDate,
        timeZone: "Asia/Kolkata",
      },
    };
    const eventAdded = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
console.log("Google insert response:", JSON.stringify(eventAdded.data, null, 2));
    // await calendarEvents.create({
    //   title,
    //   description,
    //   start: startDate,
    //   end: endDate,
    //   uid: req.user._id,
    //   googleEventID: eventAdded.data.id,
    //   visibility: req.user.visibility,
    //   created: eventAdded.data.created,
    //   updated: eventAdded.data.updated,
    // });

    const payload = {
  title,
  description,
  start: startDate,
  end: endDate,
  uid: req.user._id,
  googleEventID: eventAdded.data.id,  // Is this undefined?
  visibility: req.user.visibility,
  created: eventAdded.data.created,
  updated: eventAdded.data.updated,
};
console.log("DB payload:", JSON.stringify(payload, null, 2));

const saved = await calendarEvents.create(payload);
console.log("Saved to DB:", saved._id);
    return res.status(200).send({ success: true, msg: "Event added" });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    let id1 = req.params.id;

    const calendar = await getGoogleClient(req, res, null);
    const e1 = await calendar.events.get({
      calendarId: "primary",
      eventId: id1,
    });

    const events1 = await calendarEvents.findOne({
      uid: req.user._id,
      googleEventID: id1,
    });

    const collabEvent = await collaborativeEvents
      .find({ eid: events1._id })
      .populate("uid");
    if (collabEvent.length != 0) {
      console.log("collab");
      await collaborativeEvents.deleteMany({ eid: events1._id });

      for (let e of collabEvent) {
        const calendar1 = await getGoogleClient(req, res, e.uid._id);
        const e2 = await calendar1.events.list({
          calendarId: "primary",
          iCalUID: e1.data.iCalUID,
        });

        if (e2.data.items.length > 0) {
          const deleted1 = await calendar1.events.delete({
            calendarId: "primary",
            eventId: e2.data.items[0].id,
          });
        }
      }
    }
    const deleted = await calendar.events.delete({
      calendarId: "primary",
      eventId: id1,
    });
    if (events1.mlink) await meeting.findOneAndDelete({ eid: events1._id });
    const dbDelete = await calendarEvents.findOneAndDelete({
      uid: req.user._id,
      googleEventID: id1,
    });
    return res.status(200).send({ success: true, msg: "Event deleted" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.editEvent = async (req, res, next) => {
  try {
    const { title, date, start, end, description } = req.body;
    const calendar = await getGoogleClient(req, res, next);
    const startDate = `${date}T${start}:00+05:30`;
    const endDate = `${date}T${end}:00+05:30`;
    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDate,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDate,
        timeZone: "Asia/Kolkata",
      },
    };
    const eventUpdated = await calendar.events.update({
      calendarId: "primary",
      eventId: req.params.googleId,
      resource: event,
    });

    const editEvents = await calendarEvents.findOneAndUpdate(
      { _id: req.params.id },
      {
        title,
        description,
        start: startDate,
        end: endDate,
        uid: req.user._id,
        googleEventID: req.params.googleId,
        visibility: req.user.visibility,
        created: eventUpdated.created,
        updated: eventUpdated.updated,
      },
      { new: true }
    );

    return res.status(200).send({ success: true, data: editEvents });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.editEventVisibility = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const visibility = req.params.visibility === "true" ? 1 : 0;

    const editVisibility = await calendarEvents.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { visibility: visibility } },
      { new: true }
    );
    return res.status(200).send({ success: true, data: editVisibility });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.getVisibility = async (req, res, next) => {
  try {
    const e1 = await calendarEvents.find({ _id: req.params.id });
    return res.status(200).send({ success: true, data: e1[0].visibility });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.createCollaborativeEvent = async (req, res, next) => {
  try {
    const { title, date, start, end, description, users } = req.body;

    const calendar = await getGoogleClient(req, res, null);

    const startDate = `${date}T${start}:00+05:30`;
    const endDate = `${date}T${end}:00+05:30`;

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: startDate,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDate,
        timeZone: "Asia/Kolkata",
      },
    };

    const eventAdded = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    const createdEvent = await calendarEvents.create({
      title,
      description,
      start: startDate,
      end: endDate,
      uid: req.user._id, // host id
      googleEventID: eventAdded.data.id,
      visibility: req.user.visibility,
      created: eventAdded.data.created,
      updated: eventAdded.data.updated,
    });

    const collaborativeData = users.map((userId) => ({
      eid: createdEvent._id,
      uid: userId,
      hostGoogleEventID: eventAdded.data.id,
      created: eventAdded.data.created,
      updated: eventAdded.data.updated,
    }));

    await collaborativeEvents.insertMany(collaborativeData);

    await Promise.all(
      users.map(async (userId) => {
        const collabCalendar = await getGoogleClient(req, res, userId);
        await collabCalendar.events.import({
          calendarId: "primary",
          resource: {
            ...event,
            iCalUID: eventAdded.data.iCalUID,
          },
        });
      })
    );

    return res.status(200).send({
      success: true,
      msg: "Collaborative event created",
    });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.checkCollabEvent = async (req, res, next) => {
  try {
    const calEvent = await calendarEvents.findOne({ _id: req.params.id });
    if (!calEvent)
      return res.status(404).send({ success: false, msg: "Event not found" });
    const collabRec = await collaborativeEvents
      .findOne({
        hostGoogleEventID: calEvent.googleEventID,
      })
      .populate("eid");
    if (!collabRec) return res.status(200).send({ success: true, msg: true });
    else if (collabRec.eid.uid.equals(req.user._id))
      return res.status(200).send({ success: true, msg: true });
    else return res.status(200).send({ success: true, msg: false });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

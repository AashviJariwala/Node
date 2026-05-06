const { getGoogleClient } = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const ApiError = require("../utils/ApiError");
const meeting = require("../models/meeting");

exports.syncFromGoogle = async (req, res, next) => {
  try {
    let s1;
    let end1;
    let d1 = Date.now();
    let status;
    let rt;
    const calendar = await getGoogleClient(req, res, next);

    const googleEvents = await calendar.events.list({
      calendarId: "primary",
      maxResults: 100,
    });

    const ids = [];

    for (let e1 of googleEvents.data.items) {
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

    for (let e2 of events1) {
      for (let e1 of googleEvents.data.items) {
        if (e2.googleEventID === e1.id) {
          ids.push(e2.googleEventID);
        }
      }
      if (!ids.includes(e2.googleEventID)) {
        await meeting.findOneAndDelete({ eid: e2._id });
        await calendarEvents.findOneAndDelete({ _id: e2._id });
      }
    }
    const events = await calendarEvents.find({ uid: req.user._id });

    return res.status(200).send({ success: true, data: events });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.createEvent = async (req, res, next) => {
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
    const eventAdded = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    await calendarEvents.create({
      title,
      description,
      start: startDate,
      end: endDate,
      uid: req.user._id,
      googleEventID: eventAdded.id,
      visibility: req.user.visibility,
      created: eventAdded.created,
      updated: eventAdded.updated,
    });
    return res.status(200).send({ success: true, msg: "Event added" });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    let id1 = req.params.id;
    const calendar = await getGoogleClient(req, res, next);
    const deleted = await calendar.events.delete({
      calendarId: "primary",
      eventId: id1,
    });
    const events1 = await calendarEvents.findOne({
      uid: req.user._id,
      googleEventID: id1,
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

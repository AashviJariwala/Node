const { getGoogleClient } = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const ApiError = require("../utils/ApiError");

exports.syncFromGoogle = async (req, res, next) => {
  try {
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

      if (!existingEvent) {
        await calendarEvents.create({
          title: e1.summary,
          description: e1.description,
          start: e1.start.dateTime,
          end: e1.end.dateTime,
          uid: req.user._id,
          googleEventID: e1.id,
          created: e1.created,
          updated: e1.updated,
        });
      } else {
        const c1 = new Date(e1.created);
        const format1 = c1.toISOString().split(".")[0];
        const u1 = new Date(e1.updated);
        const format2 = u1.toISOString().split(".")[0];
        if (format1.match(format2));
        else {
          await calendarEvents.findOneAndUpdate(
            { _id: existingEvent._id },
            {
              $set: {
                title: e1.summary,
                description: e1.description,
                start: e1.start.dateTime,
                end: e1.end.dateTime,
                uid: req.user._id,
                googleEventID: e1.id,
                created: e1.created,
                updated: e1.updated,
              },
            },
            { new: true }
          );
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
    console.log(id1);
    const calendar = await getGoogleClient(req, res, next);
    const deleted = await calendar.events.delete({
      calendarId: "primary",
      eventId: id1,
    });
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
    const newRole = await role.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true },
      { rawValidation: true }
    );
    return res
      .status(200)
      .send({ success: true, data: newRole, msg: "Updated" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

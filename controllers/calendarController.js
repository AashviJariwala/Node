const { getGoogleClient, formatToISTRange } = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const collaborativeEvents = require("../models/collaborativeEvents");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const meeting = require("../models/meeting");

exports.syncFromGoogle = async (req, res, next) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    const calendar = await getGoogleClient(req, res, null);

    const [googleEventsRes, existingEvents, collabParticipants] = await Promise.all([
      calendar.events.list({
        calendarId: "primary",
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
      }),
      calendarEvents.find({ uid: userId }).lean(),
      collaborativeEvents.find({ uid: userId }).lean(),
    ]);

    const googleItems = googleEventsRes.data.items;

    const existingEventMap = new Map(
      existingEvents.map((e) => [e.googleEventID, e])
    );
    const collabHostIds = new Set(
      collabParticipants.map((e) => e.hostGoogleEventID?.toString())
    );

    const toInsert = [];
    const toUpdate = [];
    const googleEventIds = new Set();

    for (const e1 of googleItems) {
      if (collabHostIds.has(e1.id)) continue;

      googleEventIds.add(e1.id);

      let s1, end1;
      if ("date" in e1.start) {
        s1 = toIST(e1.start.date);
        const tmpEnd = toIST(e1.end.date);
        tmpEnd.setDate(tmpEnd.getDate() - 1);
        tmpEnd.setHours(23, 59, 59, 999); 
        end1 = tmpEnd;
      } else {
        s1 = new Date(e1.start.dateTime); 
        end1 = new Date(e1.end.dateTime);
      }

      const eventPayload = {
        title: e1.summary,
        description: e1.description,
        start: s1,
        end: end1,
        uid: userId,
        googleEventID: e1.id,
        mlink: e1.hangoutLink,
        visibility: req.user.visibility,
        created: e1.created,
        updated: e1.updated,
      };

      const existing = existingEventMap.get(e1.id);

      if (!existing) {
        toInsert.push({ googleData: e1, payload: eventPayload, s1, end1 });
      } else {
        const c1 = new Date(e1.created).toISOString().split(".")[0];
        const u1 = new Date(e1.updated).toISOString().split(".")[0];
        if (c1 !== u1) {
          toUpdate.push({ googleData: e1, payload: eventPayload, existing, s1, end1 });
        }
      }
    }

    const insertedEvents = await Promise.all(
      toInsert.map(async ({ googleData, payload, s1, end1 }) => {
        const newEvent = await calendarEvents.create(payload);
        if (newEvent.mlink) {
          const status = end1 < now ? "completed" : "scheduled";
          const rt = new Date(s1.getTime() - 10 * 60 * 1000);
          await Promise.all([
            calendarEvents.findByIdAndUpdate(newEvent._id, { $set: { reminderTime: rt } }),
            meeting.create({
              eid: newEvent._id,
              status,
              created: googleData.created,
              updated: googleData.updated,
            }),
          ]);
        }
        return newEvent;
      })
    );

    await Promise.all(
      toUpdate.map(async ({ googleData, payload, existing, s1, end1 }) => {
        const updated = await calendarEvents.findByIdAndUpdate(
          existing._id,
          { $set: payload },
          { new: true }
        );
        if (updated.mlink) {
          const status = end1 < now ? "completed" : "scheduled";
          const rt = new Date(s1.getTime() - 10 * 60 * 1000);
          await Promise.all([
            calendarEvents.findByIdAndUpdate(updated._id, { $set: { reminderTime: rt } }),
            meeting.findOneAndUpdate(
              { eid: updated._id },
              { $set: { status, created: googleData.created, updated: googleData.updated } }
            ),
          ]);
        }
      })
    );

    const toDelete = existingEvents.filter(
      (e) => e.googleEventID && !googleEventIds.has(e.googleEventID)
    );
    await Promise.all(
      toDelete.map(({ _id }) =>
        Promise.all([
          meeting.findOneAndDelete({ eid: _id }),
          collaborativeEvents.findOneAndDelete({ eid: _id }),
          calendarEvents.findOneAndDelete({ _id }),
        ])
      )
    );

    const finalEvents = await calendarEvents.find({ uid: userId }).lean();
    const eventData = finalEvents.map((raw) => ({
      ...raw,
      dateTime: formatToISTRange(raw.start, raw.end),
    }));

    const collabRec = await collaborativeEvents.find({ uid: userId }).populate("eid");
    const collabEvents = collabRec?.map((e) => e.eid) ?? [];
    const allEvents = [...eventData, ...collabEvents];

    return res.status(200).send({ success: true, data: allEvents });
  } catch (err) {
    console.error(err);
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
  
    const payload = {
      title,
      description,
      start: new Date(startDate),
      end: new Date(endDate), 
      uid: req.user._id,
      googleEventID: eventAdded.data.id, 
      visibility: req.user.visibility,
      created: eventAdded.data.created,
      updated: eventAdded.data.updated,
    };

    const saved = await calendarEvents.create(payload);
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
        start: new Date(startDate), 
        end: new Date(endDate),    
        uid: req.user._id,
        googleEventID: req.params.googleId,
        visibility: req.user.visibility,
        created: eventUpdated.data.created,
        updated: eventUpdated.data.updated,
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

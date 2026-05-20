const {
  getGoogleClient,
  sendMail,
  formatToISTRange,
} = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const meeting = require("../models/meeting");
const user = require("../models/user");
const meetingUser = require("../models/meetingUser");
const ApiError = require("../utils/ApiError");
const { randomUUID } = require('crypto');

exports.getAllMeetings = async (req, res, next) => {
  try {
    let arr1 = [];
    let data1;
    const m1 = await meeting.find({ status: "scheduled" }).populate("eid");
    const meetings = m1.filter((m) => m.eid.uid.equals(req.user._id));
    for (m of meetings) {
      data1 = {
        id: m._id,
        title: m.eid.title,
        mlink: m.eid.mlink,
      };
      arr1.push(data1);
    }
    return res.status(200).send({ success: true, data: arr1 });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.sendNoti = async (req, res, next) => {
  try {
    const { meetID, participantID } = req.body;
    let emails = [];

    const newRec = new meetingUser({
      mid: meetID,
      uid: participantID,
    });
    await newRec.save();
    const meetingDetails = await meeting
      .findOne({ _id: meetID })
      .populate("eid");
    const d1 = await formatToISTRange(meetingDetails.eid.start,meetingDetails.eid.end);
    for (m of participantID) {
      const uemail = await user.findOne({ _id: m });
      emails.push(uemail.email);
    }

     sendMail(
      req.user.email,
      meetingDetails.eid.mlink,
      d1,
      meetingDetails.eid.title,
      req.user.name,
      emails
    );
    return res.status(200).send({ success: true, msg: "Notification sent" });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

exports.creatInstantMeetingEvent = async (req, res, next) => {
  try {
    var d=new Date();
    const calendar = await getGoogleClient(req, res, null);
    const event = {
      summary: "Instant Meeting",
      description:  "",
      start: {
        dateTime: d.toISOString(),
      },
      end: {
        dateTime: d.toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
        },
      },
    };
    const eventAdded = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
       conferenceDataVersion: 1
    });
    
    const mlink=eventAdded.data.hangoutLink;
    const mevent=await calendarEvents.create({
      title:eventAdded.data.summary,
      description:'',
      start:eventAdded.data.start.dateTime,
      end:eventAdded.data.end.dateTime,
      uid: req.user._id,
      mlink: eventAdded.data.hangoutLink,
      visibility: req.user.visibility,
      googleEventID: eventAdded.data.id,
      created: eventAdded.data.created,
      updated: eventAdded.data.updated,
    });

    await meeting.create({
      eid:mevent._id,
      status:"instant",
      created: mevent.created,
      updated: mevent.updated
    })
    return res.status(200).send({ success: true, meetLink: mlink});
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};


exports.scheduleMeeting = async (req, res, next) => {
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
      },
      end: {
        dateTime: endDate,
      },
       conferenceData: {
        createRequest: {
          requestId: randomUUID(),
        },
      },
    };
    const eventAdded = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
       conferenceDataVersion: 1
    });
    
    const mevent=await calendarEvents.create({
      title:eventAdded.data.summary,
      description:eventAdded.data.description,
      start:eventAdded.data.start.dateTime,
      end:eventAdded.data.end.dateTime,
      uid: req.user._id,
      mlink: eventAdded.data.hangoutLink,
      visibility: req.user.visibility,
      googleEventID: eventAdded.data.id,
      created: eventAdded.data.created,
      updated: eventAdded.data.updated,
    });

    await meeting.create({
      eid:mevent._id,
      status:"scheduled",
      created: mevent.created,
      updated: mevent.updated
    })
    return res.status(200).send({ success: true, data: mevent});
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

   
 

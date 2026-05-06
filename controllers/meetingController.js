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
    const d1 = await formatToISTRange(meetingDetails.eid.start);
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

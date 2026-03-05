const { getGoogleClient } = require("../utils/helper");
const calendarEvents = require("../models/calendarEvents");
const ApiError = require("../utils/ApiError");

exports.syncFromGoogle = async (req, res, next) => {
  try {
    const calendar = await getGoogleClient(req,res,next);

    const googleEvents = await calendar.events.list({
      calendarId: "primary",
      maxResults: 100,
    });

    const imported = [];

    for (let e1 of googleEvents.data.items) {
      const existingEvent = await calendarEvents.findOne({
        googleEventID: e1.id,
      });

      if (!existingEvent) {
        const localEvent = await calendarEvents.create({
          title: e1.summary,
          description: e1.description,
          start: e1.start.dateTime,
          end: e1.end.dateTime,
          uid: req.user._id,
          googleEventID: e1.id,
        });
        imported.push(localEvent);
      }
    }
    console.log(imported);
    return res.status(200).send({ success: true, data: imported });
  } catch (err) {
    console.error(err);
    return next(new ApiError(err));
  }
};

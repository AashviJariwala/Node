const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  eid: { type: mongoose.Schema.ObjectId, ref: "calendarEvents" },
  status: {
    type: String,
    enum: ["instant", "scheduled", "completed"],
    default: null,
  },
  created: { type: mongoose.Schema.Types.Date },
  updated: { type: mongoose.Schema.Types.Date },
});

// Apply toJSON transform on the schema
meetingSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const meeting = mongoose.model("meeting", meetingSchema);

module.exports = meeting;

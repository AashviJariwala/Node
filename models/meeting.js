const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  mlink: { type: String },
  description: { type: String },
  start: { type: mongoose.Schema.Types.Date },
  end: { type: mongoose.Schema.Types.Date },
  uid: { type: mongoose.Schema.ObjectId, ref: "user" },
  eid: { type: mongoose.Schema.ObjectId, ref: "calendarEvents" },
  status: { type: String, enum: ["instant", "scheduled"], default: null },
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

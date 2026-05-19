const mongoose = require("mongoose");

const collaborativeEventsSchema = new mongoose.Schema({
  eid: { type: mongoose.Schema.ObjectId, ref: "calendarEvents" },
  uid: { type: mongoose.Schema.ObjectId, ref: "user" },
  hostGoogleEventID: { type: String, index: true },
  created: { type: mongoose.Schema.Types.Date },
  updated: { type: mongoose.Schema.Types.Date },
});

// Apply toJSON transform on the schema
collaborativeEventsSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const collaborativeEvents = mongoose.model(
  "collaborativeEvents",
  collaborativeEventsSchema
);

module.exports = collaborativeEvents;

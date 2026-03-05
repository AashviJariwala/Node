const mongoose = require("mongoose");
const validator=require("validator");

const calendarEventsSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    start: { type: mongoose.Schema.Types.Date},
    end: { type: mongoose.Schema.Types.Date},
    uid: { type: mongoose.Schema.ObjectId,ref:"user" },
    googleEventID:{ type: String },
    updatedAt:{ type: mongoose.Schema.Types.Date}
});

// Apply toJSON transform on the schema
calendarEventsSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const calendarEvents = mongoose.model("calendarEvents", calendarEventsSchema);  

module.exports = calendarEvents;


const mongoose = require("mongoose");

const meetingUserSchema = new mongoose.Schema({
  mid: { type: mongoose.Schema.ObjectId, ref: "meeting" },
  uid: [{ type: mongoose.Schema.ObjectId, ref: "user" }],
  created: { type: mongoose.Schema.Types.Date },
  updated: { type: mongoose.Schema.Types.Date },
});

// Apply toJSON transform on the schema
meetingUserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const meetingUser = mongoose.model("meetingUser", meetingUserSchema);

module.exports = meetingUser;

const mongoose = require("mongoose");

const roleDeptSchema = new mongoose.Schema({
  rid: { type: mongoose.Schema.ObjectId,ref:"role" },
  did: { type: mongoose.Schema.ObjectId,ref:"department" },

});

// Apply toJSON transform on the schema
roleDeptSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const roleDept = mongoose.model("roleDept", roleDeptSchema);

module.exports = roleDept;

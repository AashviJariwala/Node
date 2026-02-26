const mongoose = require("mongoose");

const deptSchema = new mongoose.Schema({
  name: { type: String },
});

// Apply toJSON transform on the schema
deptSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const department = mongoose.model("department", deptSchema);

module.exports = department;

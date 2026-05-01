const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: { type: String },
});

// Apply toJSON transform on the schema
permissionSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const permission = mongoose.model("permission", permissionSchema);

module.exports = permission;

const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema({
  rid: { type: mongoose.Schema.ObjectId, ref: "role" },
  pid: { type: mongoose.Schema.ObjectId, ref: "permission" },
});

// Apply toJSON transform on the schema
rolePermissionSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const rolePermission = mongoose.model(" rolePermission", rolePermissionSchema);

module.exports = rolePermission;

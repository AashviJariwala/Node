const mongoose = require("mongoose");
const validator=require("validator");

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String ,validate:[validator.isEmail,"Invalid email"]},
    rdid: { type: mongoose.Schema.ObjectId,ref:"roleDept" },
    gid: { type: mongoose.Schema.ObjectId,ref:"googleTokens" },
    idCard:{type:String},
    isVerified: { type: String,enum:[0,1],default:0 },
});

// Apply toJSON transform on the schema
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const user = mongoose.model("user", userSchema);  

module.exports = user;


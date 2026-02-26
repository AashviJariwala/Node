const mongoose = require("mongoose");
const validator = require("validator");

const user = mongoose.model(
  "user",
  new mongoose.Schema({
    name: { type: String,required:[true,"Name required"] },
    email:{type:String,required:[true,"Email required"]},
    // rid:{type:mongoose.Schema.ObjectId}
   
  })
);

module.exports = user;

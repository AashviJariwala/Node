const mongoose = require("mongoose");
const validator = require("validator");

const idCards = mongoose.model(
  "idCards",
  new mongoose.Schema({
    role: { type: String},
    department:{type:String}
   
  })
);

module.exports = idCards;

const mongoose = require("mongoose");

const googleTokensSchema = new mongoose.Schema({
    googleId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
});

// Apply toJSON transform on the schema
googleTokensSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const googleTokens = mongoose.model("googleTokens", googleTokensSchema);  

module.exports = googleTokens;


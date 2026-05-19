const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URL);
const db = mongoose.connection;
if (db) console.log("Connected");
else console.log("Disconnected");

module.exports = db;

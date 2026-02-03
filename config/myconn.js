const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://aashvijariwala:Aashvi%401701@intracompanymeetingcale.gydkb0n.mongodb.net/calenderDb"
);
const db = mongoose.connection;
if (db) console.log("Connected");
else console.log("Disconnected");

module.exports = db;

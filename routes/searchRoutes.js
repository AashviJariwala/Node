const express = require("express");
const { verifyToken } = require("../utils/helper");

const searchController = require("../controllers/searchController");

const router = express.Router();

router.get("/showAllEmployee", verifyToken, searchController.showAllEmployee);
router.get("/searchProfile/:name", verifyToken, searchController.searchProfile);
router.get("/userProfile/:id",verifyToken, searchController.userProfile);
router.get("/searchByTimeslot/:id",verifyToken, searchController.searchByTimeslot);

// router.post("/createEvent", verifyToken, calendarController.createEvent);
// router.delete("/deleteEvent/:id", verifyToken, calendarController.deleteEvent);

module.exports = router;

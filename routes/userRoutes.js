const express = require("express");
const { verifyToken } = require("../utils/helper");

const userController = require("../controllers/userController");

const router = express.Router();

router.put(
  "/editVisibility/:visibility",
  verifyToken,
  userController.editVisibility
);

router.get("/getVisibility", verifyToken, userController.getVisibility);
router.get("/getUserDetails", verifyToken, userController.getUserDetails);


module.exports = router;

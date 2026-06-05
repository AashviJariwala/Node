const express = require("express");
const multer = require("multer");
const { verifyToken } = require("../utils/helper");

const authenticationController = require("../controllers/authenticationController");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/idCard", verifyToken, upload.single("photo"), authenticationController.idCardVerification);

module.exports = router;
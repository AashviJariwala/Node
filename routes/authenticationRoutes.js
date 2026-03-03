const express = require("express");
const multer = require("multer");
const path = require("path");
const {verifyToken}=require("../utils/helper");

const authenticationController=require("../controllers/authenticationController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public"));
  }, 
  filename: (req, file, cb) => {
    const fname = Date.now() + "-" + file.originalname;
    cb(null, fname);
  },
});

const upload = multer({ storage: storage });

router.post("/idCard",verifyToken,upload.single("photo"),authenticationController.idCardVerification);

module.exports = router;
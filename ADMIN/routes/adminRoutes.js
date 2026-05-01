const express = require("express");
const { verifyToken } = require("../../utils/helper");
const adminLogin = require("../controllers/adminLogin");
const roleController = require("../controllers/roleController");
const departmentController = require("../controllers/departmentController");
const permissionController = require("../controllers/permissionController");
const userController = require("../controllers/userController");

const router = express.Router();
router.post("/", adminLogin.login);
router.post("/insertRole", verifyToken, roleController.insertRole);
router.get("/displayRole", verifyToken, roleController.displayRole);
router.delete("/deleteRole/:id", verifyToken, roleController.deleteRole);
router.put("/editRole/:id", verifyToken, roleController.editRole);

router.post("/insertDept", verifyToken, departmentController.insertDept);
router.get("/displayDept", verifyToken, departmentController.displayDept);
router.delete("/deleteDept/:id", verifyToken, departmentController.deleteDept);
router.put("/editDept/:id", verifyToken, departmentController.editDept);
router.get("/displayUser", verifyToken, userController.displayUsers);

router.post(
  "/insertPermission",
  verifyToken,
  permissionController.insertPermission
);
router.get(
  "/displayPermission",
  verifyToken,
  permissionController.displayPermission
);
router.delete(
  "/deletePermission/:id",
  verifyToken,
  permissionController.deletePermission
);
router.put(
  "/editPermission/:id",
  verifyToken,
  permissionController.editPermission
);

module.exports = router;

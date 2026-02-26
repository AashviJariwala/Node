const express = require("express");
const adminLogin = require("../controllers/adminLogin");
const roleController = require("../controllers/roleController");
const departmentController = require("../controllers/departmentController");

const router = express.Router();
router.post("/", adminLogin.login);
router.post("/insertRole", adminLogin.verifyToken, roleController.insertRole);
router.get("/displayRole", adminLogin.verifyToken, roleController.displayRole);
router.delete(
  "/deleteRole/:id",
  adminLogin.verifyToken,
  roleController.deleteRole
);
router.put("/editRole/:id", adminLogin.verifyToken, roleController.editRole);

router.post(
  "/insertDept",
  adminLogin.verifyToken,
  departmentController.insertDept
);
router.get(
  "/displayDept",
  adminLogin.verifyToken,
  departmentController.displayDept
);
router.delete(
  "/deleteDept/:id",
  adminLogin.verifyToken,
  departmentController.deleteDept
);
router.put(
  "/editDept/:id",
  adminLogin.verifyToken,
  departmentController.editDept
);

module.exports = router;

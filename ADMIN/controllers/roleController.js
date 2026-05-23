const role = require("../../models/role");
const department = require("../../models/department");
const roleDept = require("../../models/roleDept");
const ApiError = require("../../utils/ApiError");

exports.insertRole = async (req, res, next) => {
  try {
    const newRole = new role({ name: req.body.name });
    await newRole.save();
    const depts = await department.find();
    if (!depts) return;
    else {
      for (let d of depts) {
        const newRoleDept = new roleDept({ rid: newRole._id, did: d._id });
        await newRoleDept.save();
      }
    }
    return res.status(200).send({ success: true, msg: "Inserted Role" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.displayRole = async (req, res, next) => {
  try {
    const roles = await role.find();
    return res.status(200).send({ success: true, data: roles });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.editRole = async (req, res, next) => {
  try {
    const newRole = await role.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true },
      { rawValidation: true }
    );
    return res
      .status(200)
      .send({ success: true, data: newRole, msg: "Updated" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

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

exports.deleteRole = async (req, res, next) => {
  try {
    let id1 = req.params.id;
    console.log(id1);
    var roles;
    if (id1.includes(",")) {
      const ids = id1.split(",");
      for (var id of ids) {
        console.log(id);
        roles = await role.findOneAndDelete({ _id: id });
      }
    } else roles = await role.findOneAndDelete({ _id: id1 });
    if (!roles)
      return res
        .status(404)
        .send({ success: true, error: "No such role found" });
    else return res.status(200).send({ success: true, msg: "Role deleted" });
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

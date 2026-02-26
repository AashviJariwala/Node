const department = require("../../models/department");
const role = require("../../models/role");
const roleDept = require("../../models/roleDept");
const ApiError = require("../../utils/ApiError");

exports.insertDept = async (req, res, next) => {
  try {
    const newDept = new department({ name: req.body.name });
    await newDept.save();
    const roles = await role.find();
    if (!roles) return;
    else {
      for (let r of roles) {
        const newRoleDept = new roleDept({ rid: r._id, did: newDept._id });
        await newRoleDept.save();
      }
    }
    return res.status(200).send({ success: true, msg: "Inserted Department" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.displayDept = async (req, res,next) => {
  try {
    const depts = await department.find();
    return res.status(200).send({ success: true, data: depts });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.deleteDept = async (req, res, next) => {
  try {
    let id1 = req.params.id;
    var depts;
    if (id1.includes(",")) {
      const ids = id1.split(",");
      for (var id of ids) {
        depts = await department.findOneAndDelete({ _id: id });
      }
    } else depts = await department.findOneAndDelete({ _id: id1 });
    if (!depts)
      return res
        .status(404)
        .send({ success: true, error: "No such department found" });
    else
      return res.status(200).send({ success: true, msg: "Department deleted" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.editDept = async (req, res, next) => {
  try {
    const newDept = await department.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true },
      { rawValidation: true }
    );
    return res
      .status(200)
      .send({ success: true, data: newDept, msg: "Updated" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

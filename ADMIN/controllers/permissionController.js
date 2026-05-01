const role = require("../../models/role");
const permission = require("../../models/permission");
const ApiError = require("../../utils/ApiError");

exports.insertPermission = async (req, res, next) => {
  try {
    const newPer = new permission({ name: req.body.name });
    await newPer.save();

    return res.status(200).send({ success: true, msg: "Inserted Permission" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.displayPermission = async (req, res, next) => {
  try {
    const pers = await permission.find();
    return res.status(200).send({ success: true, data: pers });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.deletePermission = async (req, res, next) => {
  try {
    let id1 = req.params.id;
    console.log(id1);
    var pers;
    if (id1.includes(",")) {
      const ids = id1.split(",");
      for (var id of ids) {
        console.log(id);
        pers = await permission.findOneAndDelete({ _id: id });
      }
    } else pers = await permission.findOneAndDelete({ _id: id1 });
    if (!pers)
      return res
        .status(404)
        .send({ success: true, error: "No such permission found" });
    else
      return res.status(200).send({ success: true, msg: "Permission deleted" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

exports.editPermission = async (req, res, next) => {
  try {
    const newPermission = await permission.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true },
      { rawValidation: true }
    );
    return res
      .status(200)
      .send({ success: true, data: newPermission, msg: "Updated" });
  } catch (err) {
    return next(new ApiError(err));
  }
};

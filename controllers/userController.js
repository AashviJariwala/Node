const user = require("../models/user");
const ApiError = require("../utils/ApiError");

exports.editVisibility = async (req, res, next) => {
  try {
    const visibility=( req.params.visibility==="true") ? 1 : 0;
    const editUser = await user.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { visibility: visibility} },
      { new: true }
    );
    return res.status(200).send({ success: true, data: editUser });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};


exports.getVisibility = async (req, res, next) => {
  try {
    const user1=await user.find({_id:req.user._id})
    return res.status(200).send({ success: true, data: user1[0].visibility });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};
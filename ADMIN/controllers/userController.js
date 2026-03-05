const user = require("../../models/user");
const ApiError = require("../../utils/ApiError");

exports.displayUsers = async (req, res, next) => {
  try {
    const users = await user.find();
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    return next(new ApiError(err));
  }
};


const calendarEvents = require("../models/calendarEvents");
const user = require("../models/user");
const ApiError = require("../utils/ApiError");

exports.showAllEmployee = async (req, res, next) => {
  try {
    const users = await user.find({_id:{$ne:req.user._id}});
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.searchProfile = async (req, res, next) => {
  try {
    const users = await user.aggregate([
      {
        $search: {
          autocomplete: {
            query: req.params.name,
            path: "name",
          },
        },
      },
    ]);
    return res.status(200).send({ success: true, data: users });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};

exports.userProfile= async (req, res, next) => {
  try {
    const user1=await user.find({_id:req.params.id});
    const events=await calendarEvents.find({uid:req.params.id});
    const data1={
      events:events,
      visibility:user1[0].visibility
    };
    return res.status(200).send({ success: true, data: data1 });
  } catch (err) {
    console.error(err.message);
    return next(new ApiError(err));
  }
};






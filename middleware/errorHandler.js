exports.errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    err.statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server error";
    console.log(err.message);
    return res
      .status(err.statusCode)
      .send({ success: false, statusCode: err.statusCode, msg: message });
  };

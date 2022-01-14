const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`; // Invalid _id: ashdasdj
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: "${err.keyValue.name}", please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError("Invalid token. Please log in again", 401);
};

const handleJWTExpiredError = (err) =>
  new AppError("Your token has expired, please login again!", 401);

const sendErrorDev = (error, res) => {
  res.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error, res) => {
  if (error.isOperational) {
    // isOperational is field of AppError class (trusted error)
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    // Unknown error, don't want to leak details
    // 1. Log error
    console.error(`ERROR 💥:`, error);

    // 2. Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went soooo wrong!",
    });
  }
};

// 4 parameters => error handling middleware
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV.trim() === "development") {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV.trim() === "production") {
    let err = { ...error };
    // Get a tour error when id is not in _id shape
    if (error.name === "CastError") err = handleCastErrorDB(err); // Transform weird error into operational error
    // Duplicate when create a tour
    if (error.code === 11000) err = handleDuplicateFieldsDB(err);
    // schema validation error
    if (error.name === "ValidationError") err = handleValidationErrorDB(err);
    // jsonWebToken error when input wrong jwt
    if (error.name === "JsonWebTokenError") err = handleJWTError(err);
    // jsonwebtoken expired
    if (error.name === "TokenExpiredError") err = handleJWTExpiredError(err);
    sendErrorProd(err, res);
  }
};

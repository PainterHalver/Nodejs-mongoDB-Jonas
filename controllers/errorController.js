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

  if (process.env.NODE_ENV !== "development") {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV !== "production") {
    sendErrorProd(error, res);
  }
};

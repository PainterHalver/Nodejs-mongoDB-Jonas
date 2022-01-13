// catch Error and send to globalErrorHandler so we don't have to repeat try catch block
module.exports = (wrappedFunction) => {
  return (req, res, next) => {
    wrappedFunction(req, res, next).catch(next); // === .catch((error) => next(error))
  };
};

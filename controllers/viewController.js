const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Tour = require("./../models/tourModel");
const catchAsync = require("./../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Render that template using data from step 1

  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name!", 404));
  }

  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "script-src 'self' https://* http://localhost:* 'unsafe-inline' 'unsafe-eval'"
    )
    .render("tour", {
      title: tour.tour,
      tour,
    });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "script-src 'self' https://* http://localhost:* 'unsafe-inline' 'unsafe-eval'"
    )
    .render("login", {
      title: "Login",
    });
});

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "script-src 'self' https://* http://localhost:* 'unsafe-inline' 'unsafe-eval'"
    )
    .render("account", {
      title: "Your Account",
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "script-src 'self' https://* http://localhost:* 'unsafe-inline' 'unsafe-eval'"
    )
    .render("account", {
      title: "Your Account",
      user: updatedUser,
    });
});

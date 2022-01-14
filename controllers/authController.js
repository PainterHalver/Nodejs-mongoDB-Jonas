const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // specifically define to prevent signing up admin role
  // admin role is defined directly in mongodb atlas/compass...
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // jwt token to send to the user
  const token = signToken(newUser._id);

  res.status(201).json({
    // 201: created
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2. Check user exists & password is correct
  const user = await User.findOne({ email: email }).select("+password"); // because password is no selected in Schema we need to add a '+' when selecting it in query

  // const correct = await user.correctPasswordCheck(password, user.password); //true/false
  if (!user || !(await user.correctPasswordCheck(password, user.password))) {
    return next(new AppError("Incorrect email or password!", 401)); // 401: Unauthorized
  }

  // 3. Send jwt to client
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

const { promisify } = require("util");
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

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get jwt and check if its there in the body
  // req.headers.authorization: `Bearer ${jwtToken}`
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in!", 401)); // 401: Unauthorized
  }

  // 2. Verify that jwt is valid
  // promisify turns function with (error, data) => {} callback as last parameter into a promise version
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // THE LAST 2 STEPS IS FOR WHEN JWT IS STOLEN AND SAY THE USER DELETED THE ACCOUNT OR CHANGED THE PASSWORD THEN THE STOLEN JWT SHOULD NOT BE VALID ANYMORE BECAUSE REMEMBER WE USE _id TO SIGN JWT
  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token no longer exists", 401)
    );
  }

  // 4. Check if user changed password after jwt was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // iat: issued at
    return next(
      new AppError(
        "Password has been changed recently, please login again!",
        401
      )
    );
  }

  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = currentUser;
  next();
});

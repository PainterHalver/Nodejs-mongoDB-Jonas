const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const { token } = require("morgan");
const crypto = require("crypto");
const bcrypt = require("bcryptjs/dist/bcrypt");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false, // The cookie will only be send on an encrypted connection if true (https)
    httpOnly: true, // The cookie should not be modified in any way by the browser (XSS attacks)
  };

  user.password = undefined; // not sending password in response

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  // If multiple cookies are sent they override the ones before so there's only 1 with "jwt" name
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // specifically define to prevent signing up admin role
  // admin role is defined directly in mongodb atlas/compass...
  const newUser = await User.create({
    role: req.body.role ? req.body.role : "user",
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createAndSendToken(newUser, 201, res);
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
  createAndSendToken(user, 200, res);
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
  req.user = currentUser; // for later use of restricting routes in middlewares stack with this middleware
  next();
});

// wrap the function to accept different arguments other than req,res,next
exports.restrictTo = (...roles) => {
  return function(req, res, next) {
    // 'roles' is an array
    if (!roles.includes(req.user.role)) {
      // can only access req.user because we added it in the above middleware
      return next(
        new AppError("You do not have permission to perform this action!", 403)
      ); // 403: forbidden
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address!", 404));
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false, // so that mongoose would not complain about password confirmation
  });

  // 3. Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset Token (expires in 10 mins)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to your mail!",
    });
  } catch (err) {
    // reset both token and expire properties if error occurs
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetexpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  // The token sent in the URL is not encrypted
  const resetToken = req.params.token;
  const encryptedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({ passwordResetToken: encryptedToken });

  // 2. If token has not expired, and there is user, set the new password
  if (!user || user.passwordResetexpires < Date.now()) {
    return next(new AppError("No user found or token has expired!", 418));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm; // validator will auto check
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // must not update() but save() to run validators

  // 3. update passwpordChangedAt property
  // 4. Log the user in, send jwt
  createAndSendToken(user, 200, res);
});

// Update password with old password (not forgetting password)
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from database
  // const token = req.headers.authorization.split(" ")[1];
  // const id = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(req.user.id).select("+password"); // req.user is available because of the 'protect' middleware
  if (!user) {
    return next(new AppError("No user found, token may be expired"));
  }

  // 2. Check if POSTed password is correct
  const currentPassword = req.body.passwordCurrent;
  if (!(await user.correctPasswordCheck(currentPassword, user.password))) {
    return next(new AppError("Password is not correct!", 401));
  }

  // 3. If so. update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in ,send JWT
  createAndSendToken(user, 200, res);
});

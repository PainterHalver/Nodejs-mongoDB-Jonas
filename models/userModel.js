const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A name is required!"],
  },
  email: {
    type: String,
    required: [true, "An email is required!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Wrong email format!"],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: {
      values: ["user", "guide", "lead-guide", "admin"],
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A password is required!"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "A confirm password is required!"],
    validate: {
      // 'this' only works on CREATE and SAVE
      validator: function(value) {
        return this.password === value;
      },
      message: "Confirmation password does not match password!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hash the password everytime password is touched
userSchema.pre("save", async function(next) {
  // only run if password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); // 12 is salt (cpu power cost), 12 is standard
  this.passwordConfirm = undefined; // no need anymore
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // so that token is returned after password has been changed
  }
  next();
});

// remove inactive users from showing up
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// THESE ARE CALLED "INSTANCE METHODS"
// define method to use on all documents of schema
// comparing hashed to non hashed passwords
userSchema.methods.correctPasswordCheck = async function(
  candidatePassword,
  userPassword
) {
  // 'this' is document but this.password is not available because we do not select it in the schema
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimestamp > JWTTimestamp; // true if password is changed after JWT is created (issued)
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // does not save into the database so we need to save it in the controller (specifically in forgotPassword function)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;

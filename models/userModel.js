const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

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
});

// Hash the password
userSchema.pre("save", async function(next) {
  // only run if password is modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); // 12 is salt (cpu power cost), 12 is standard
  this.passwordConfirm = undefined; // no need anymore
  next();
});

// define method to use on all documents of schema
// comparing hashed to non hashed passwords
userSchema.methods.correctPasswordCheck = async function(
  candidatePassword,
  userPassword
) {
  // 'this' is document but this.password is not available because we do not select it in the schema
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

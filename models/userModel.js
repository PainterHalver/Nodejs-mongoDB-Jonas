const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new Schema({
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
  },
  passwordConfirm: {
    type: String,
    required: [true, "A confirm password is required!"],
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;

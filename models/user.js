//jshint esversion:6

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  displayName: String,
  givenName: String,
  familyName: String,
  photo: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

module.exports = mongoose.model("User", userSchema);

//jshint esversion:6

const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');
const Farm = require("./farm.js");
const User = require("./user.js");

const roleSchema = new mongoose.Schema ({
  // _id: mongoose.Schema.Types.ObjectId,
  farm: { type: mongoose.Schema.Types.ObjectId, ref: Farm, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: User },
  invitedEmail: {type: String, lowercase: true, trim: true },
  roleType: String,
});

roleSchema.plugin(findOrCreate);

module.exports = mongoose.model("Role", roleSchema);

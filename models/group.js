//jshint esversion:6

const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');

const groupSchema = new mongoose.Schema ({
  _id: mongoose.Schema.Types.ObjectId,
  farm: { type: mongoose.Schema.Types.ObjectId, ref: Farm, required: true }
  name: String,
  previousGrpWeaningDt: Date,
  breedingDt: Date,
  breedingWindow: Number,
  farrowingDt: Date,
  weaningDt: Date,
});

groupSchema.plugin(findOrCreate);

module.exports = mongoose.model("Group", groupSchema);

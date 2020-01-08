//jshint esversion:6
// find findById findOne where deleteOne deleteMany updateOne findOneAndUpdate

const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');

const farmSchema = new mongoose.Schema ({
  // _id: mongoose.Schema.Types.ObjectId,
  creater: String,
  farmName: String,
  customerNo: String,
  gestationDays: { type: Number, default: 114 },
  breedingWindow: { type: Number, default: 6 },
  weaningDays: { type: Number, default: 30 }
});

farmSchema.plugin(findOrCreate);

module.exports = mongoose.model("Farm", farmSchema);


// Person.
//   find({ occupation: /host/ }).
//   where('name.last').equals('Ghost').
//   where('age').gt(17).lt(66).
//   where('likes').in(['vaporizing', 'talking']).
//   limit(10).
//   sort('-occupation').
//   select('name occupation').
//   exec(callback);

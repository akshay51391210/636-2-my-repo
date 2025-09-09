const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  breed: { type: String },
  dob: { type: Date },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

appointmentSchema.index(
  { petId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

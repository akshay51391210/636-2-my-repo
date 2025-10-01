const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  date: { type: Date, required: true },
  consultationFee: { type: Number, default: 50 },
  meds: [{ name: String, price: Number }],
  procedures: [{ name: String, price: Number }],
  discountPercent: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 10 },
  totalBeforeDiscount: Number,
  totalAfterDiscount: Number,
  totalWithTax: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);

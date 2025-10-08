const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema(
  {
    drugName: { type: String, default: '' },
    strength: { type: String, default: '' },      // e.g., 250 mg / 5 mL
    dosageForm: { type: String, default: '' },    // Tablet / Capsule / Liquid / Cream / ...
    quantity: { type: String, default: '' },      // e.g., 20 tablets / 60 mL
    doseEachTime: { type: String, default: '' },  // e.g., 1 tablet / 5 mL
    frequency: { type: String, default: '' },     // e.g., twice daily
    route: { type: String, default: '' },         // Oral / Topical / Eye / Ear / ...
    cautions: { type: String, default: '' },      // precautions
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    petId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },

    // extra info shown in form/PDF
    species: { type: String, default: '' },
    weight:  { type: String, default: '' },        // keep as string for easy PDF formatting
    symptomsDiagnosis: { type: String, default: '' }, // FE uses this; PDF falls back to 'reason' if empty
    reason:  { type: String, default: '' },        // kept for backward compatibility / older rows
    diagnosis: { type: String, default: '' },      // optional if you want to split later

    medication: { type: MedicationSchema, default: {} },

    date:   { type: String, required: true },      // ISO yyyy-mm-dd (from FE converter)
    time:   { type: String, required: true },      // HH:MM
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled'], default: 'Pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', PrescriptionSchema);

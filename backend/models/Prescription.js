const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    petId:   { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    date:    { type: String, required: true },   // yyyy-mm-dd
    time:    { type: String, required: true },   // HH:mm
    reason:  { type: String, default: "" },
    status:  {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending", // ✅ default to Pending
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", PrescriptionSchema);




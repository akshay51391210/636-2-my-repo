const Prescription = require("../models/Prescription");

exports.list = async (_req, res) => {
  const rows = await Prescription.find()
    .populate("ownerId", "name")
    .populate("petId", "name type")
    .sort({ createdAt: -1 });
  res.json(rows);
};

exports.create = async (req, res) => {
  const { ownerId, petId, date, time, reason } = req.body;
  if (!ownerId || !petId || !date || !time)
    return res.status(400).json({ message: "ownerId, petId, date, time required" });

  const row = await Prescription.create({ ownerId, petId, date, time, reason });
  res.status(201).json(row);
};

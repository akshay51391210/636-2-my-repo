const router = require("express").Router();
const Prescription = require("../models/Prescription");

// GET /prescriptions
router.get("/", async (_req, res) => {
  try {
    const rows = await Prescription.find()
      .populate("ownerId", "name")
      .populate("petId", "name type")
      .sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /prescriptions
router.post("/", async (req, res) => {
  try {
    const { ownerId, petId, date, time, reason } = req.body;
    if (!ownerId || !petId || !date || !time)
      return res.status(400).json({ message: "ownerId, petId, date, time required" });

    const row = await Prescription.create({
      ownerId,
      petId,
      date,
      time,
      reason,
      status: "Pending", // ✅ enforce pending on create
    });
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /prescriptions/:id
router.patch("/:id", async (req, res) => {
  try {
    const row = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /prescriptions/:id
router.delete("/:id", async (req, res) => {
  try {
    const row = await Prescription.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Optional explicit endpoints
router.patch("/:id/complete", async (req, res) => {
  try {
    const row = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const row = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: "Cancelled" },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;




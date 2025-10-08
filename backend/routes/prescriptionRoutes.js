const router = require('express').Router();
const Prescription = require('../models/Prescription');

// GET /api/prescriptions  -> list with populate for table & PDF
router.get('/', /*protect,*/ async (req, res) => {
  try {
    const filter = {};
    if (req.query.ownerId) filter.ownerId = req.query.ownerId;
    if (req.query.petId) filter.petId = req.query.petId;

    const rows = await Prescription.find(filter)
      .populate('ownerId', 'name email')
      .populate('petId', 'name type weight')
      .sort({ createdAt: -1 });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/prescriptions  -> accepts medication & symptomsDiagnosis (from FE)
router.post('/', /*protect,*/ async (req, res) => {
  try {
    const {
      ownerId, petId,
      date, time,
      species, weight,
      symptomsDiagnosis, reason, diagnosis,
      medication,
      status, // optional; default 'Pending'
    } = req.body;

    if (!ownerId || !petId || !date || !time) {
      return res.status(400).json({ message: 'ownerId, petId, date, time required' });
    }

    // allow partial medication: if user filled some fields but forgot drugName, set 'N/A'
    let med = medication || {};
    const medAny = Object.values(med).some(v => String(v || '').trim() !== '');
    if (medAny && !String(med.drugName || '').trim()) {
      med.drugName = 'N/A';
    }

    const created = await Prescription.create({
      ownerId, petId,
      date, time,
      species, weight,
      symptomsDiagnosis, reason, diagnosis,
      medication: med,
      status: status || 'Pending',
    });

    // Safe populate: re-fetch then populate
    const populated = await Prescription.findById(created._id)
      .populate('ownerId', 'name email')
      .populate('petId', 'name type weight');

    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /prescriptions error:', err);
    res.status(400).json({ message: err.message || 'Bad Request' });
  }
});

router.patch('/:id', /*protect,*/ async (req, res) => {
  try {
    if (req.body.medication) {
      const m = req.body.medication || {};
      const anyMed = Object.values(m).some(v => String(v || '').trim() !== '');
      if (anyMed && !String(m.drugName || '').trim()) {
        req.body.medication.drugName = 'N/A';
      }
    }

    const updated = await Prescription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Not found' });

    await updated.populate('ownerId', 'name email');
    await updated.populate('petId', 'name type weight');

    res.json(updated);
  } catch (err) {
    console.error('PATCH /prescriptions error:', err);
    res.status(400).json({ message: err.message || 'Bad Request' });
  }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', /*protect,*/ async (req, res) => {
  try {
    const row = await Prescription.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Bad Request' });
  }
});

router.patch('/:id/complete', /*protect,*/ async (req, res) => {
  try {
    const row = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.populate('ownerId', 'name email');
    await row.populate('petId', 'name type weight');
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Bad Request' });
  }
});

router.patch('/:id/cancel', /*protect,*/ async (req, res) => {
  try {
    const row = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.populate('ownerId', 'name email');
    await row.populate('petId', 'name type weight');
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Bad Request' });
  }
});

module.exports = router;

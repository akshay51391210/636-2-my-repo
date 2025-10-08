const express = require('express');
const router = express.Router();
const Appointment = require('../models/AppointmentModel');
const { protect } = require('../middleware/authMiddleware');

// Helper: check conflict
async function findConflict({ petId, date, time, excludeId }) {
  const query = { petId, date, time, status: 'scheduled' };
  if (excludeId) query._id = { $ne: excludeId };
  return Appointment.exists(query);
}

/**
 * GET /appointments
 * Owner sees ONLY their own appointments
 * Admin/Vet see all appointments
 */
router.get('/', protect, async (req, res) => {
  try {
    const { ownerId, petId, status, date } = req.query;
    const filter = {};
    
    // IMPORTANT: Owner can only see their own appointments
    if (req.user.role === 'owner') {
      filter.ownerId = req.user._id;
    } else if (ownerId) {
      // Admin/Vet can filter by ownerId if provided
      filter.ownerId = ownerId;
    }
    
    if (petId) filter.petId = petId;
    if (status) filter.status = status;
    if (date) filter.date = date;

    const items = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .populate('ownerId', 'name phone')
      .populate('petId', 'name type');

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /appointments/summary
 * Owner sees only their data
 */
router.get('/summary', protect, async (req, res) => {
  try {
    let { from, to } = req.query;

    if (!from || !to) {
      const today = new Date();
      const toDate = new Date();
      toDate.setDate(today.getDate() + 6);
      from = today.toISOString().slice(0, 10);
      to = toDate.toISOString().slice(0, 10);
    }

    const filter = { date: { $gte: from, $lte: to } };
    
    // Owner filter
    if (req.user.role === 'owner') {
      filter.ownerId = req.user._id;
    }

    const summary = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { date: "$date", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    const map = {};
    summary.forEach(item => {
      const date = item._id.date;
      if (!map[date]) {
        map[date] = { date, total: 0, scheduled: 0, completed: 0, cancelled: 0 };
      }
      map[date].total += item.count;
      map[date][item._id.status] = item.count;
    });

    const result = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      result.push(map[dateStr] || { date: dateStr, total: 0, scheduled: 0, completed: 0, cancelled: 0 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /appointments/:id
 * Owner can only see their own
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Appointment.findById(req.params.id)
      .populate('ownerId', 'name phone')
      .populate('petId', 'name type');
    
    if (!item) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check ownership
    if (req.user.role === 'owner' && String(item.ownerId._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /appointments
 * Owner can only create for themselves
 */
router.post('/', protect, async (req, res) => {
  try {
    let { petId, ownerId, date, time, reason } = req.body;
    
    // Force owner to use their own ID
    if (req.user.role === 'owner') {
      ownerId = req.user._id;
    }
    
    if (!petId || !ownerId || !date || !time) {
      return res.status(400).json({ message: 'petId, ownerId, date, time are required' });
    }

    const conflict = await findConflict({ petId, date, time });
    if (conflict) {
      return res.status(409).json({ message: 'Double booking detected' });
    }

    const appt = new Appointment({ petId, ownerId, date, time, reason });
    const saved = await appt.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Double booking detected' });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * Owner can only update their own
 */
router.patch('/:id', protect, async (req, res) => {
  try {
    const current = await Appointment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Appointment not found' });

    // Check ownership
    if (req.user.role === 'owner' && String(current.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const nextPetId = req.body.petId ?? String(current.petId);
    const nextDate = req.body.date ?? current.date;
    const nextTime = req.body.time ?? current.time;
    const nextStatus = req.body.status ?? current.status;

    if (nextStatus === 'scheduled') {
      const conflict = await findConflict({
        petId: nextPetId,
        date: nextDate,
        time: nextTime,
        excludeId: current._id
      });
      if (conflict) {
        return res.status(409).json({ message: 'Double booking detected' });
      }
    }

    Object.assign(current, req.body);
    const saved = await current.save();
    res.json(saved);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Double booking detected' });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * Owner can only cancel their own
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check ownership
    if (req.user.role === 'owner' && String(appt.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('ownerId', 'name phone')
     .populate('petId', 'name type');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * Only admin/vet can complete
 */
router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    // Owner cannot complete appointments
    if (req.user.role === 'owner') {
      return res.status(403).json({ message: 'Only staff can complete appointments' });
    }

    if (appt.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot complete a cancelled appointment' });
    }

    appt.status = 'completed';
    await appt.save();
    await appt.populate([
      { path: 'ownerId', select: 'name phone' },
      { path: 'petId', select: 'name type' },
    ]);

    res.json(appt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * Owner can only delete their own
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check ownership
    if (req.user.role === 'owner' && String(appt.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Owner can only update their own
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const current = await Appointment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Appointment not found' });

    // Check ownership
    if (req.user.role === 'owner' && String(current.ownerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const body = req.body || {};
    const petId = body.petId || String(current.petId);
    const date = body.date || current.date;
    const time = body.time || current.time;
    const status = body.status || current.status;

    if (status === 'scheduled') {
      const conflict = await findConflict({
        petId, date, time, excludeId: req.params.id
      });
      if (conflict) {
        return res.status(409).json({ message: 'Double booking detected' });
      }
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(updated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Double booking detected' });
    }
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Appointment = require('../models/AppointmentModel');

/**
 * Helper: Check if there is a conflicting appointment (same pet/date/time with status 'scheduled')
 */
async function findConflict({ petId, date, time, excludeId }) {
  const query = { petId, date, time, status: 'scheduled' };
  if (excludeId) query._id = { $ne: excludeId };
  return Appointment.exists(query);
}

/**
 * PATCH /appointments/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const current = await Appointment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Appointment not found' });

    const nextPetId   = req.body.petId   ?? String(current.petId);
    const nextDate    = req.body.date    ?? current.date;
    const nextTime    = req.body.time    ?? current.time;
    const nextStatus  = req.body.status  ?? current.status;

    if (nextStatus === 'scheduled') {
      const conflict = await findConflict({
        petId: nextPetId,
        date: nextDate,
        time: nextTime,
        excludeId: current._id
      });
      if (conflict) {
        return res.status(409).json({
          message: 'Double booking detected: this pet already has an appointment at the same date/time.'
        });
      }
    }

    Object.assign(current, req.body);
    const saved = await current.save();
    res.json(saved);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: 'Double booking detected by database constraint (pet, date, time).'
      });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * PATCH /appointments/:id/cancel
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('ownerId', 'name phone')
     .populate('petId', 'name type');

    if (!updated) return res.status(404).json({ message: 'Appointment not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * PATCH /appointments/:id/complete
 * (EN) Mark as completed; fix: use array form of document.populate (no chaining)
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (appt.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot complete a cancelled appointment' });
    }

    appt.status = 'completed';
    await appt.save();

    // FIX: do not chain populate() on document; use array syntax instead
    await appt.populate([
      { path: 'ownerId', select: 'name phone' },
      { path: 'petId',   select: 'name type'  },
    ]);

    res.json(appt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * GET /appointments
 */
router.get('/', async (req, res) => {
  try {
    const { ownerId, petId, status, date } = req.query;
    const filter = {};
    if (ownerId) filter.ownerId = ownerId;
    if (petId)   filter.petId   = petId;
    if (status)  filter.status  = status;
    if (date)    filter.date    = date;

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
 * Returns summary of appointments grouped by date & status.
 * Default range: today to next 6 days if not provided.
 * Always returns all days in the range (with 0 values if no appointments)
 */
router.get('/summary', async (req, res) => {
  try {
    let { from, to } = req.query;

    // Default: today to next 6 days
    if (!from || !to) {
      const today = new Date();
      const toDate = new Date();
      toDate.setDate(today.getDate() + 6);

      from = today.toISOString().slice(0, 10);
      to   = toDate.toISOString().slice(0, 10);
    }

    const filter = { date: { $gte: from, $lte: to } };

    const summary = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { date: "$date", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Map results into a lookup object
    const map = {};
    summary.forEach(item => {
      const date = item._id.date;
      if (!map[date]) {
        map[date] = { date, total: 0, scheduled: 0, completed: 0, cancelled: 0 };
      }
      map[date].total += item.count;
      map[date][item._id.status] = item.count;
    });

    // Fill missing days with 0s
    const result = [];
    const start = new Date(from);
    const end   = new Date(to);
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
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Appointment.findById(req.params.id)
      .populate('ownerId', 'name phone')
      .populate('petId', 'name type');
    if (!item) return res.status(404).json({ message: 'Appointment not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /appointments
 */
router.post('/', async (req, res) => {
  try {
    const { petId, ownerId, date, time, reason } = req.body;
    if (!petId || !ownerId || !date || !time) {
      return res.status(400).json({ message: 'petId, ownerId, date, time are required' });
    }

    const conflict = await findConflict({ petId, date, time });
    if (conflict) {
      return res.status(409).json({
        message: 'Double booking detected: this pet already has an appointment at the same date/time.'
      });
    }

    const appt  = new Appointment({ petId, ownerId, date, time, reason });
    const saved = await appt.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: 'Double booking detected by database constraint (pet, date, time).'
      });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /appointments/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const body    = req.body || {};
    const current = await Appointment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Appointment not found' });

    const petId  = body.petId  || String(current.petId);
    const date   = body.date   || current.date;
    const time   = body.time   || current.time;
    const status = body.status || current.status;

    if (status === 'scheduled') {
      const conflict = await findConflict({
        petId, date, time, excludeId: req.params.id
      });
      if (conflict) {
        return res.status(409).json({
          message: 'Double booking detected: this pet already has an appointment at the same date/time.'
        });
      }
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(updated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({
        message: 'Double booking detected by database constraint (pet, date, time).'
      });
    }
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /appointments/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

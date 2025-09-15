const express = require('express');
const router = express.Router();

// IMPORTANT: match the actual file name and case exactly
const Appointment = require('../models/AppointmentModel');

/**
 * GET /history
 * Query params:
 *  - q: text query (owner name / owner phone / pet name)
 *  - from, to: ISO date string 'YYYY-MM-DD'
 *  - status: 'scheduled' | 'completed' | 'cancelled'
 *  - page, limit: pagination
 *
 * Notes:
 *  - We filter date/status in DB, then populate owner/pet and do text filter in-memory.
 *  - This matches the current schema where Appointment stores ownerId/petId refs
 *    and date as 'YYYY-MM-DD' string.
 */
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      from = '',
      to = '',
      status = '',
      page = '1',
      limit = '20',
    } = req.query;

    const match = {};
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = from;
      if (to) match.date.$lte = to;
    }
    if (status) {
      match.status = status;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limNum;

    // fetch candidates by date/status, newest first
    const base = await Appointment.find(match)
      .sort({ date: -1, time: -1 })
      .populate('ownerId', 'name phone')
      .populate('petId', 'name type')
      .lean();

    // text filter over populated fields
    const needle = (q || '').trim().toLowerCase();
    const filtered = needle
      ? base.filter(appt => {
          const ownerName = (appt.ownerId?.name || '').toLowerCase();
          const ownerPhone = (appt.ownerId?.phone || '').toLowerCase();
          const petName = (appt.petId?.name || '').toLowerCase();
          return (
            ownerName.includes(needle) ||
            ownerPhone.includes(needle) ||
            petName.includes(needle)
          );
        })
      : base;

    const items = filtered.slice(skip, skip + limNum);

    return res.json({
      items,
      page: pageNum,
      limit: limNum,
      total: filtered.length,
      hasMore: skip + items.length < filtered.length,
    });
  } catch (err) {
    console.error('[history] error:', err);
    return res.status(500).json({ message: 'History search failed' });
  }
});

module.exports = router;

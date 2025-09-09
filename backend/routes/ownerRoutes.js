const express = require('express');
const router = express.Router();
const Owner = require('../models/ownerModel'); // ต้องสร้าง model ด้วย

// GET all owners
router.get('/', async (req, res) => {
  try {
    const owners = await Owner.find();
    res.json(owners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create owner
router.post('/', async (req, res) => {
  const owner = new Owner({
    name: req.body.name,
    phone: req.body.phone
  });
  try {
    const newOwner = await owner.save();
    res.status(201).json(newOwner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update owner
router.put('/:id', async (req, res) => {
  try {
    const updatedOwner = await Owner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedOwner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE owner
router.delete('/:id', async (req, res) => {
  try {
    await Owner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Owner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

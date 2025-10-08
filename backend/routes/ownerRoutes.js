const express = require('express');
const router = express.Router();
const Owner = require('../models/ownerModel');
const { protect } = require('../middleware/authMiddleware');

// GET all owners
// Admin/Vet: see all owners
// Owner: see only their own record
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    
    // If user is owner role, only show their own data
    if (req.user.role === 'owner') {
      // Link owner record by email matching user email
      filter.email = req.user.email;
    }
    
    const owners = await Owner.find(filter);
    res.json(owners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner role can only create their own record
router.post('/', protect, async (req, res) => {
  try {
    const ownerData = {
      name: req.body.name,
      phone: req.body.phone
    };
    
    // If user is owner, automatically link email
    if (req.user.role === 'owner') {
      ownerData.email = req.user.email;
    } else {
      // Admin/Vet can optionally set email
      if (req.body.email) {
        ownerData.email = req.body.email;
      }
    }
    
    const owner = new Owner(ownerData);
    const newOwner = await owner.save();
    res.status(201).json(newOwner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Owner can only update their own record
router.put('/:id', protect, async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    // Check ownership
    if (req.user.role === 'owner') {
      // Owner can only update their own record
      if (owner.email !== req.user.email) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const updatedOwner = await Owner.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedOwner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Owner cannot delete their own record (only admin can)
router.delete('/:id', protect, async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    // Check ownership - owner cannot delete themselves
    if (req.user.role === 'owner') {
      return res.status(403).json({ 
        message: 'Owners cannot delete records. Contact admin.' 
      });
    }
    
    await Owner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Owner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
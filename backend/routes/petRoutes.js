const express = require('express');
const router = express.Router();
const Pet = require('../models/petModel');
const Owner = require('../models/ownerModel');
const { protect } = require('../middleware/authMiddleware');

// GET all pets
// Admin/Vet: see all pets
// Owner: see only their own pets
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    
    // If user is owner role, only show their pets
    if (req.user.role === 'owner') {
      // Find owner record by email
      const ownerRecord = await Owner.findOne({ email: req.user.email });
      
      if (!ownerRecord) {
        return res.json([]); // No owner record = no pets
      }
      
      // Filter pets by owner ID
      filter.ownerId = ownerRecord._id;
    }
    
    const pets = await Pet.find(filter).populate('ownerId', 'name phone');
    res.json(pets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create pet
// Owner can only create pets under their own owner record
router.post('/', protect, async (req, res) => {
  try {
    let ownerId = req.body.ownerId;
    
    // If user is owner, validate they can only create for themselves
    if (req.user.role === 'owner') {
      const ownerRecord = await Owner.findOne({ email: req.user.email });
      
      if (!ownerRecord) {
        return res.status(400).json({ 
          message: 'Please create your owner profile first' 
        });
      }
      
      // Force owner to use their own owner ID
      ownerId = ownerRecord._id;
    }
    
    const pet = new Pet({
      ...req.body,
      ownerId: ownerId
    });
    
    const newPet = await pet.save();
    res.status(201).json(newPet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update pet
// Owner can only update their own pets
router.put('/:id', protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('ownerId');
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // Check ownership
    if (req.user.role === 'owner') {
      const ownerRecord = await Owner.findOne({ email: req.user.email });
      
      if (!ownerRecord) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Verify pet belongs to this owner
      if (String(pet.ownerId._id) !== String(ownerRecord._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedPet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE pet
// Owner can only delete their own pets
router.delete('/:id', protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    // Check ownership
    if (req.user.role === 'owner') {
      const ownerRecord = await Owner.findOne({ email: req.user.email });
      
      if (!ownerRecord) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Verify pet belongs to this owner
      if (String(pet.ownerId) !== String(ownerRecord._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
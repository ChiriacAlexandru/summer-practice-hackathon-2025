const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../Models/Team'); 

// GET toate echipele
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().populate('members');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET echipă după ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST creează o echipă nouă
router.post('/', async (req, res) => {
  const { name, description, members } = req.body;
  const team = new Team({ name, description, members });
  try {
    const newTeam = await team.save();
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT actualizează o echipă după ID
router.put('/:id', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, members },
      { new: true, runValidators: true }
    );
    if (!updatedTeam) return res.status(404).json({ message: 'Team not found' });
    res.json(updatedTeam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE șterge o echipă după ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeam) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
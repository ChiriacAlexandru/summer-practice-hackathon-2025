const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../Models/Team');
const User = require('../Models/User'); // Presupunând că ai un model User

// GET all teams (cu filtrare opțională după user)
router.get('/', async (req, res) => {
  try {
    // Dacă există userId în query, returnează echipele unde userul e membru
    if (req.query.userId) {
      const teams = await Team.find({ members: req.query.userId })
        .populate('members', 'name email')
        .populate('createdBy', 'name email');
      return res.json(teams);
    }
    // Altfel, returnează toate echipele
    const teams = await Team.find()
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET team by ID cu info detaliată
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email createdAt')
      .populate('createdBy', 'name email')
      .populate('projects', 'name status techStack');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST creare echipă nouă
router.post('/', async (req, res) => {
  try {
    const { name, description, isPublic, tags, createdBy } = req.body;
    // Verificare câmpuri obligatorii
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'Name and creator are required' });
    }

    const team = new Team({
      name,
      description,
      members: [createdBy], // Creatorul devine automat membru
      createdBy,
      isPublic: isPublic || false,
      tags: tags || []
    });

    const newTeam = await team.save();

    // Populare creator în răspuns
    await Team.populate(newTeam, { path: 'createdBy', select: 'name email' });

    res.status(201).json(newTeam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT actualizare echipă
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isPublic, tags } = req.body;
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, isPublic, tags },
      { new: true, runValidators: true }
    )
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    if (!updatedTeam) return res.status(404).json({ message: 'Team not found' });
    res.json(updatedTeam);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE ștergere echipă
router.delete('/:id', async (req, res) => {
  try {
    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeam) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST join team (sau cerere de join)
router.post('/:id/members', async (req, res) => {
  try {
    const teamId = req.params.id;
    const { userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Verifică dacă userul e deja membru
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Dacă e public, adaugă userul imediat
    if (team.isPublic) {
      team.members.push(userId);
      await team.save();

      // Returnează echipa populată
      const updatedTeam = await Team.findById(teamId)
        .populate('members', 'name email')
        .populate('createdBy', 'name email');
      return res.json({
        team: updatedTeam,
        message: 'Successfully joined the team'
      });
    }

    // Pentru private, doar confirmare de request
    res.json({
      message: 'Join request received. Team admin will review your request.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE leave team
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Elimină userul din members
    team.members = team.members.filter(
      memberId => memberId.toString() !== req.params.userId
    );

    // Dacă nu mai rămâne niciun membru, șterge echipa
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Last member left. Team deleted.' });
    }

    // Dacă a ieșit creatorul, transferă ownership
    if (team.createdBy.toString() === req.params.userId) {
      team.createdBy = team.members[0];
    }

    await team.save();
    res.json({ message: 'Successfully left the team' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
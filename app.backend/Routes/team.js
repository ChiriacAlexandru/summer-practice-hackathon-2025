const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../Models/Team');
const User = require('../Models/User'); // Presupunând că ai un model User

// GET all teams (cu filtrare opțională după user)
router.get('/', async (req, res) => {
  try {
    console.log('GET /teams - Query params:', req.query);
    
    // Dacă există userId în query, returnează echipele unde userul e membru
    if (req.query.userId) {
      const teams = await Team.find({ members: req.query.userId })
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .lean(); // Adaugă lean() pentru performanță
      console.log(`Found ${teams.length} teams for user ${req.query.userId}`);
      return res.json(teams);
    }
    
    // Altfel, returnează toate echipele
    const teams = await Team.find()
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    console.log(`Found ${teams.length} total teams`);
    res.json(teams);
  } catch (err) {
    console.error('Error in GET /teams:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET team by ID cu info detaliată - REPARATĂ
router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /teams/${req.params.id} - Fetching team details`);
    
    // Verifică dacă ID-ul este valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    
    // Încearcă fără populate pentru projects mai întâi
    let team = await Team.findById(req.params.id)
      .populate('members', 'name email username createdAt')
      .populate('createdBy', 'name email username')
      .lean();
    
    if (!team) {
      console.log(`Team ${req.params.id} not found`);
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Dacă echipa are proiecte, încearcă să le populate doar dacă există modelul Project
    if (team.projects && team.projects.length > 0) {
      try {
        // Încearcă să populate proiectele dacă există modelul
        const populatedTeam = await Team.findById(req.params.id)
          .populate('members', 'name email username createdAt')
          .populate('createdBy', 'name email username')
          .populate('projects', 'name status techStack description')
          .lean();
        team = populatedTeam;
      } catch (populateErr) {
        console.warn('Could not populate projects, using basic team data:', populateErr.message);
        // Dacă populate pentru projects eșuează, folosim datele de bază
        // și setăm projects ca array gol sau păstrăm ID-urile
      }
    }
    
    // Asigură-te că projects este întotdeauna un array
    if (!team.projects) {
      team.projects = [];
    }
    
    console.log(`Successfully fetched team ${team.name} with ${team.members?.length || 0} members and ${team.projects?.length || 0} projects`);
    res.json(team);
  } catch (err) {
    console.error(`Error in GET /teams/${req.params.id}:`, err);
    res.status(500).json({ message: `Error fetching team details: ${err.message}` });
  }
});

// POST creare echipă nouă - ÎMBUNĂTĂȚITĂ
router.post('/', async (req, res) => {
  try {
    console.log('POST /teams - Creating new team:', req.body);
    
    const { name, description, isPublic, tags, createdBy } = req.body;
    
    // Verificare câmpuri obligatorii
    if (!name || !createdBy) {
      return res.status(400).json({ message: 'Name and creator are required' });
    }
    
    // Verifică dacă creatorul există
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ message: 'Invalid creator ID format' });
    }
    
    const team = new Team({
      name: name.trim(),
      description: description ? description.trim() : '',
      members: [createdBy], // Creatorul devine automat membru
      createdBy,
      isPublic: isPublic !== false, // Default true
      tags: Array.isArray(tags) ? tags : [],
      projects: [] // Inițializează cu array gol
    });

    const newTeam = await team.save();
    console.log(`Created new team: ${newTeam.name} (ID: ${newTeam._id})`);

    // Populare creator în răspuns
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('createdBy', 'name email username')
      .populate('members', 'name email username')
      .lean();

    res.status(201).json(populatedTeam);
  } catch (err) {
    console.error('Error in POST /teams:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Team name already exists' });
    }
    res.status(400).json({ message: `Error creating team: ${err.message}` });
  }
});

// PUT actualizare echipă - ÎMBUNĂTĂȚITĂ
router.put('/:id', async (req, res) => {
  try {
    console.log(`PUT /teams/${req.params.id} - Updating team:`, req.body);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    
    const { name, description, isPublic, tags } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    
    const updatedTeam = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('members', 'name email username')
      .populate('createdBy', 'name email username')
      .lean();
      
    if (!updatedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    console.log(`Successfully updated team: ${updatedTeam.name}`);
    res.json(updatedTeam);
  } catch (err) {
    console.error(`Error in PUT /teams/${req.params.id}:`, err);
    res.status(400).json({ message: `Error updating team: ${err.message}` });
  }
});

// DELETE ștergere echipă - ÎMBUNĂTĂȚITĂ
router.delete('/:id', async (req, res) => {
  try {
    console.log(`DELETE /teams/${req.params.id} - Deleting team`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    
    const deletedTeam = await Team.findByIdAndDelete(req.params.id);
    if (!deletedTeam) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    console.log(`Successfully deleted team: ${deletedTeam.name}`);
    res.json({ message: 'Team deleted successfully', teamName: deletedTeam.name });
  } catch (err) {
    console.error(`Error in DELETE /teams/${req.params.id}:`, err);
    res.status(500).json({ message: `Error deleting team: ${err.message}` });
  }
});

// POST join team (sau cerere de join) - ÎMBUNĂTĂȚITĂ
router.post('/:id/members', async (req, res) => {
  try {
    console.log(`POST /teams/${req.params.id}/members - User joining:`, req.body);
    
    const teamId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid team or user ID format' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verifică dacă userul e deja membru
    const isAlreadyMember = team.members.some(memberId => memberId.toString() === userId);
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a team member' });
    }

    // Dacă e public, adaugă userul imediat
    if (team.isPublic !== false) {
      team.members.push(userId);
      await team.save();
      
      console.log(`User ${userId} successfully joined public team ${team.name}`);

      // Returnează echipa populată
      const updatedTeam = await Team.findById(teamId)
        .populate('members', 'name email username')
        .populate('createdBy', 'name email username')
        .lean();
        
      return res.json({
        team: updatedTeam,
        message: 'Successfully joined the team'
      });
    }

    // Pentru private, doar confirmare de request
    console.log(`Join request received for private team ${team.name} from user ${userId}`);
    res.json({
      message: 'Join request received. Team admin will review your request.'
    });
  } catch (err) {
    console.error(`Error in POST /teams/${req.params.id}/members:`, err);
    res.status(500).json({ message: `Error joining team: ${err.message}` });
  }
});

// DELETE leave team - ÎMBUNĂTĂȚITĂ
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    console.log(`DELETE /teams/${req.params.id}/members/${req.params.userId} - User leaving team`);
    
    const { id: teamId, userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid team or user ID format' });
    }
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Verifică dacă userul este membru
    const memberIndex = team.members.findIndex(memberId => memberId.toString() === userId);
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    // Elimină userul din members
    team.members.splice(memberIndex, 1);

    // Dacă nu mai rămâne niciun membru, șterge echipa
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(teamId);
      console.log(`Last member left team ${team.name}. Team deleted.`);
      return res.json({ message: 'Last member left. Team deleted.' });
    }

    // Dacă a ieșit creatorul, transferă ownership
    if (team.createdBy.toString() === userId) {
      team.createdBy = team.members[0];
      console.log(`Ownership transferred to ${team.members[0]} for team ${team.name}`);
    }

    await team.save();
    console.log(`User ${userId} successfully left team ${team.name}`);
    res.json({ message: 'Successfully left the team' });
  } catch (err) {
    console.error(`Error in DELETE /teams/${req.params.id}/members/${req.params.userId}:`, err);
    res.status(500).json({ message: `Error leaving team: ${err.message}` });
  }
});

// GET members of a team - ADĂUGAT PENTRU DEBUGGING
router.get('/:id/members', async (req, res) => {
  try {
    console.log(`GET /teams/${req.params.id}/members - Fetching team members`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email username createdAt')
      .populate('createdBy', 'name email username')
      .select('name members createdBy')
      .lean();
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({
      teamName: team.name,
      members: team.members,
      createdBy: team.createdBy,
      memberCount: team.members.length
    });
  } catch (err) {
    console.error(`Error in GET /teams/${req.params.id}/members:`, err);
    res.status(500).json({ message: `Error fetching team members: ${err.message}` });
  }
});

module.exports = router;
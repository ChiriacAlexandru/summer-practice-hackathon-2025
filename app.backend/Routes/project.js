const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Project = require('../Models/Project');
// GET /api/projects - toate proiectele
router.get('/', async (req, res) => {
  console.log('=== DEBUGGING GET /projects ===');
  
  try {
    // Verifică starea conexiunii MongoDB
    console.log('MongoDB ready state:', mongoose.connection.readyState);
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'MongoDB nu este conectat' });
    }
    
    console.log('1. Model Project:', Project);
    console.log('2. Project.find este funcție?', typeof Project.find);
    
    console.log('3. Încercând Project.find()...');
    const projects = await Project.find();
    console.log('4. Rezultat projects:', projects);
    console.log('5. Type of projects:', typeof projects);
    console.log('6. Projects is array?', Array.isArray(projects));
    
    if (!projects) {
      console.log('Projects este null/undefined!');
      return res.status(500).json({ error: 'Eroare: projects este null' });
    }
    
    res.json(projects);
    
  } catch (err) {
    console.error('=== EROARE DETALIATĂ ===');
    console.error('Tip eroare:', err.name);
    console.error('Mesaj eroare:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Eroare la obținerea proiectelor', details: err.message });
  }
});

// GET /api/projects/:id - proiect după ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean(); // `.lean()` pentru obiect simplu JS

    if (!project) {
      return res.status(404).json({ error: 'Proiectul nu a fost găsit' });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la obținerea proiectului', details: err.message });
  }
});


// POST /api/projects - creare proiect
router.post('/', async (req, res) => {
  try {
    const { title, description, codeUrl, createdBy, teamId, tags } = req.body;

    const newProject = new Project({
      title,
      description,
      codeUrl,
      createdBy,
      teamId,
      tags
    });

    const saved = await newProject.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Eroare la salvarea proiectului' });
  }
});

// PUT /api/projects/:id - editare proiect
router.put('/:id', async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, {
      ...req.body,
      updatedAt: Date.now()
    }, { new: true });

    if (!updated) return res.status(404).json({ error: 'Proiectul nu a fost găsit' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Eroare la actualizare' });
  }
});

// DELETE /api/projects/:id - ștergere proiect
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Proiectul nu a fost găsit' });

    res.json({ message: 'Proiect șters cu succes' });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

module.exports = router;

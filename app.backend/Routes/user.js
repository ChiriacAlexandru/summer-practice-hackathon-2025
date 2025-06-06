const express = require('express');
const router = express.Router();
const User = require('../Models/User');

// POST /api/users - Creare utilizator
router.post('/', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email și parolă sunt necesare.' });
  }

  try {
    const newUser = new User({
      username,
      email,
      passwordHash: password, // parola brută e pusă în passwordHash, va fi criptată în pre('save')
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'Utilizator creat cu succes.' });
  } catch (err) {
    console.error('Eroare la crearea utilizatorului:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email sau username deja există.' });
    }
    res.status(500).json({ error: 'Eroare la crearea utilizatorului.' });
  }
});

// GET /api/users - Listare utilizatori
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error('Eroare la obținerea utilizatorilor:', err);
    res.status(500).json({ error: 'Eroare la obținerea utilizatorilor.' });
  }
});

module.exports = router;

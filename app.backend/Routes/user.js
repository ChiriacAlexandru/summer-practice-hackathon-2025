const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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



router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email și parola sunt necesare.' });

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user)
      return res.status(401).json({ error: 'Email sau parolă incorecte.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ error: 'Email sau parolă incorecte.' });

    // Creează un token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      'cheie_secreta_super_sigura', // Păstrează secretul într-o variabilă de mediu
      { expiresIn: '2h' }
    );

    res.json({ message: 'Autentificare reușită.', token, user: { username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Eroare la login:', err);
    res.status(500).json({ error: 'Eroare server la autentificare.' });
  }
});


module.exports = router;

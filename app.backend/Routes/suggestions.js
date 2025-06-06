const express = require('express');
const router = express.Router();
const Suggestion = require('../Models/Suggestion');

// Middleware de auth cu debugging complet
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acces interzis. Token lipsă sau format invalid.' 
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Acces interzis. Token lipsă.' 
      });
    }

    try {
      const base64Payload = token.split('.')[1];
      const decodedPayload = Buffer.from(base64Payload, 'base64').toString('ascii');
      const user = JSON.parse(decodedPayload);
      
      // DEBUGGING COMPLET
      console.log('🔍 TOKEN DECODAT COMPLET:', JSON.stringify(user, null, 2));
      console.log('🔍 user.userId:', user.userId);
      console.log('🔍 user.id:', user.id);
      console.log('🔍 user._id:', user._id);
      console.log('🔍 Toate proprietățile:', Object.keys(user));
      
      // Încearcă toate variantele posibile pentru ID
      const authorId = user.userId || user.id || user._id || user.sub;
      
      console.log('🔍 authorId final extras:', authorId);
      
      if (!authorId) {
        console.error('❌ Nu s-a putut extrage authorId din token!');
        return res.status(401).json({ 
          message: 'Token invalid - nu conține ID utilizator.' 
        });
      }
      
      req.user = {
        ...user,
        id: authorId,
        userId: authorId
      };
      
      console.log(`✅ Utilizator autentificat cu ID: ${authorId}`);
      
      next();
    } catch (decodeError) {
      console.error('❌ Eroare la decodarea token-ului:', decodeError);
      return res.status(401).json({ message: 'Token invalid.' });
    }
    
  } catch (error) {
    console.error('❌ Eroare la autentificare:', error.message);
    res.status(401).json({ message: 'Token invalid.' });
  }
};

// GET /api/suggestions/:projectId - Obține toate sugestiile pentru un proiect
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`💡 Cerere pentru sugestiile proiectului: ${projectId}`);
    
    const suggestions = await Suggestion.find({ projectId })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Găsite ${suggestions.length} sugestii pentru proiectul ${projectId}`);
    res.json(suggestions);
  } catch (error) {
    console.error('❌ Eroare la obținerea sugestiilor:', error);
    res.status(500).json({ 
      message: 'Eroare de server la obținerea sugestiilor',
      error: error.message 
    });
  }
});

// POST /api/suggestions - Creează o sugestie nouă
router.post('/', auth, async (req, res) => {
  try {
    const { projectId, suggestion } = req.body;
    
    // Debugging complet pentru authorId
    console.log('🔍 req.user complet:', JSON.stringify(req.user, null, 2));
    
    const authorId = req.user.userId || req.user.id || req.user._id;
    
    console.log(`💡 Creare sugestie nouă:`, {
      projectId,
      authorId,
      'req.user.userId': req.user.userId,
      'req.user.id': req.user.id,
      'req.user._id': req.user._id,
      suggestion: suggestion?.substring(0, 50) + '...'
    });

    // Validare
    if (!projectId || !suggestion) {
      return res.status(400).json({ 
        message: 'ProjectId și sugestia sunt obligatorii' 
      });
    }

    if (suggestion.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Sugestia nu poate fi goală' 
      });
    }

    if (!authorId) {
      console.error('❌ authorId este încă undefined!', {
        'req.user': req.user,
        'typeof req.user.userId': typeof req.user.userId,
        'typeof req.user.id': typeof req.user.id
      });
      return res.status(400).json({ 
        message: 'Nu s-a putut identifica utilizatorul' 
      });
    }

    console.log('✅ Folosesc authorId:', authorId);

    const newSuggestion = new Suggestion({
      projectId,
      authorId,
      suggestion: suggestion.trim()
    });

    const savedSuggestion = await newSuggestion.save();
    await savedSuggestion.populate('authorId', 'name email');
    
    console.log(`✅ Sugestie creată cu succes: ${savedSuggestion._id}`);
    res.status(201).json(savedSuggestion);
  } catch (error) {
    console.error('❌ Eroare la crearea sugestiei:', error);
    res.status(500).json({ 
      message: 'Eroare de server la crearea sugestiei',
      error: error.message 
    });
  }
});

module.exports = router;
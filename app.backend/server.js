const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Conectare la MongoDB cu evenimente de verificare
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout de 5 secunde
    });

    console.log('✅ MongoDB conectat cu succes!');
    
    // Evenimente de verificare conexiune
    mongoose.connection.on('connected', () => {
      console.log('📌 Mongoose este conectat la MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Eroare MongoDB:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose s-a deconectat de la MongoDB');
    });

  } catch (error) {
    console.error('❌ Eroare la conectarea MongoDB:', error.message);
    process.exit(1); // Oprește aplicația dacă conexiunea eșuează
  }
};

// Încărcare rute DOAR după conectare
const loadRoutes = () => {
  const usersRouter = require('./Routes/user');
  const projectsRouter = require('./Routes/project');
  const teamsRouter = require('./Routes/team');
const commentsRouter = require("./Routes/comments");
  app.use('/api/users', usersRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/teams', teamsRouter);
app.use('/api/comments', commentsRouter);
  console.log('🔄 Rutele au fost încărcate');
};

// Ruta de verificare status
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'conectat' : 'deconectat';
  res.json({ 
    message: 'Serverul funcționează!',
    mongodb: dbStatus,
    readyState: mongoose.connection.readyState // 1 = conectat, 0 = deconectat
  });
});

// Pornire server
const startServer = async () => {
  await connectDB(); // Așteaptă conexiunea la MongoDB
  loadRoutes(); // Încarcă rutele după conectare

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Serverul rulează pe portul ${PORT}`);
    console.log(`🔗 Accesează: http://localhost:${PORT}`);
  });
};

startServer();
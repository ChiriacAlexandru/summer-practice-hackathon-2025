const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(express.json());

// Configure CORS să accepte cereri de la frontend-ul pe port 5173
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Importă rutele
const usersRouter = require('./Routes/user');
// const projectsRouter = require('./Routes/routes');
// const suggestionsRouter = require('./Routes/suggestion');
// const commentsRouter = require('./Routes/comment');
const teamsRouter = require('./Routes/team');

app.use('/api/users', usersRouter);
// app.use('/api/projects', projectsRouter);
// app.use('/api/suggestions', suggestionsRouter);
// app.use('/api/comments', commentsRouter);
app.use('/api/teams', teamsRouter);

// Conectare la MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectat cu succes!');
  } catch (error) {
    console.error('Eroare la conectarea MongoDB:', error.message);
    process.exit(1);
  }
};
connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'Serverul funcționează și MongoDB este conectat!' });
});

// Ascultă pe portul din .env sau 3000 implicit
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});

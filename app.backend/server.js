const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();
app.use(express.json());


const usersRouter = require('./Routes/user');
//const projectsRouter = require('./Routes/routes');
//const suggestionsRouter = require('./Routes/suggestion');
//const commentsRouter = require('./Routes/comment');
//const teamsRouter = require('./Routes/team');

app.use('/api/users', usersRouter);
//app.use('/api/projects', projectsRouter);
//app.use('/api/suggestions', suggestionsRouter);
//app.use('/api/comments', commentsRouter);
//app.use('/api/teams', teamsRouter);

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));




const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul rulează pe portul ${PORT}`);
});
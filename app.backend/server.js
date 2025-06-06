const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();

app.use(express.json());

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
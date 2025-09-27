// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// =================================================================
// --- STEP A: CONNECT TO YOUR DATABASE ---
// =================================================================
// 1. Go to your MongoDB Atlas account.
// 2. Click "Connect" on your cluster, then "Connect your application".
// 3. Copy the connection string it gives you.
// 4. Paste it here, replacing "<password>" with your database user's password.
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/eka_swasthya';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('SUCCESS: MongoDB connected successfully!'))
    .catch(err => console.error('ERROR: MongoDB connection error:', err));

// --- Database Schema (The structure of our data) ---
const recordSchema = new mongoose.Schema({
    note: String,
    doctorName: String, // Changed from 'doctor'
    doctorId: String,   // Added this field
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    healthId: { type: String, required: true, unique: true },
    profile: {
        fullName: String,
        age: Number,
        bloodGroup: String,
        allergies: String,
        conditions: String,
    },
    records: [recordSchema]
});

const User = mongoose.model('User', userSchema);

// --- API Endpoints (The URLs our frontend will talk to) ---

// 1. Login or Register a user
app.post('/api/login', async (req, res) => {
    const { healthId } = req.body;
    if (!healthId) return res.status(400).json({ msg: 'Health ID is required' });
    
    try {
        let user = await User.findOne({ healthId });
        if (!user) {
            console.log(`Creating new user with Health ID: ${healthId}`);
            user = new User({ healthId, profile: {}, records: [] });
            await user.save();
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 2. Get a user's data
app.get('/api/user/:healthId', async (req, res) => {
    try {
        const user = await User.findOne({ healthId: req.params.healthId });
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 3. Update a user's profile
app.put('/api/user/:healthId', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { healthId: req.params.healthId },
            { $set: { profile: req.body } },
            { new: true } // This option returns the updated document
        );
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json({ msg: 'Profile updated!', profile: user.profile });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 4. Add a new medical record
app.post('/api/records/:healthId', async (req, res) => {
    try {
        const { note, doctorName, doctorId } = req.body;
        const newRecord = { note, doctorName, doctorId };
        
        const user = await User.findOneAndUpdate(
            { healthId: req.params.healthId },
            { $push: { records: newRecord } },
            { new: true }
        );
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(201).json({ msg: 'Record added!', records: user.records });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server is ready and running on http://localhost:${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const consultationsRoutes = require('./routes/consultations');
const triageRoutes = require('./routes/triage');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://robot-kiosque-web.vercel.app/",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' })); // Limite de 2 Mo pour les gros payloads
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Routes
app.use('/api/consultations', consultationsRoutes);
app.use('/triage', triageRoutes);

app.get('/health', (req, res) => {
    res.json({ status: "OK", message: "Express API is running" });
});

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://tuo:fHMdAx0Tbkqlmt77@cluster0.26jr5r9.mongodb.net/malaria_triagedb";
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB Lakehouse");
        app.listen(PORT, () => {
            console.log(`Express Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

module.exports = app;

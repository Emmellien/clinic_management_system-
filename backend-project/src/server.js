const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Router Imports
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const medicalRoutes = require('./routes/medicalRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const medicineRoutes = require('./routes/medicines');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

// Global App Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Route Mappings
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/users', usersRoutes);
// Global Error Catchment
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal secure server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Clinic Management Backend operating on port ${PORT}`);
});
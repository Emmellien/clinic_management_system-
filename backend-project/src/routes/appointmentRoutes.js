const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// Create Appointment (Receptionist & Admin)
router.post('/', authenticateToken, authorizeRoles('Receptionist', 'Admin'), async (req, res) => {
    const { patient_id, doctor_id, appointment_date } = req.body;
    try {
        await db.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date) VALUES (?, ?, ?)',
            [patient_id, doctor_id, appointment_date]
        );
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
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
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [appointments] = await db.execute(`
            SELECT appointment_id, patient_id, appointment_date, status 
            FROM appointments 
            WHERE status != 'Completed'
            ORDER BY appointment_date ASC
        `);
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Appointment Status
// Allows status transitions like Scheduled -> Completed/Cancelled
router.put('/:id', authenticateToken, authorizeRoles('Receptionist', 'Admin', 'Doctor'), async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = ['Scheduled', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    try {
        const [result] = await db.execute(
            'UPDATE appointments SET status = ? WHERE appointment_id = ?',
            [status, id]
        );

        // MySQL2/pg style: check affectedRows
        const affected = result?.affectedRows ?? 0;
        if (affected === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        res.json({ message: `Appointment status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

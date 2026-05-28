const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// 1. CREATE: Record Treatment and Diagnosis (Doctors & Nurses Only)
router.post('/', authenticateToken, authorizeRoles('Doctor', 'Nurse'), async (req, res) => {
    const { patient_id, appointment_id, diagnosis, notes } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO treatments (patient_id, doctor_id, appointment_id, diagnosis, notes) VALUES (?, ?, ?, ?, ?)',
            [patient_id, req.user.id, appointment_id || null, diagnosis, notes]
        );
        
        // Automatically switch associated appointment state to 'Completed'
        if (appointment_id) {
            await db.execute('UPDATE appointments SET status = "Completed" WHERE appointment_id = ?', [appointment_id]);
        }

        res.status(201).json({ message: 'Treatment recorded successfully', treatment_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. READ ALL: Fetch treatment logs with joined patient and doctor names (All Authenticated Staff)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [logs] = await db.execute(`
            SELECT 
                t.treatment_id, t.patient_id, t.appointment_id, t.diagnosis, t.notes, t.treatment_date,
                p.full_name AS patient_name,
                u.full_name AS doctor_name
            FROM treatments t
            JOIN patients p ON t.patient_id = p.patient_id
            JOIN users u ON t.doctor_id = u.user_id
            ORDER BY t.treatment_date DESC
        `);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. UPDATE: Modify diagnosis or notes details (Doctors & Nurses Only)
router.put('/:id', authenticateToken, authorizeRoles('Doctor', 'Nurse'), async (req, res) => {
    const { diagnosis, notes } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE treatments SET diagnosis = ?, notes = ? WHERE treatment_id = ?',
            [diagnosis, notes, req.params.id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Treatment record could not be found.' });
        res.json({ message: 'Clinical documentation updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Remove clinical history records (Admin Only - Safety Lock)
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM treatments WHERE treatment_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found.' });
        res.json({ message: 'Clinical encounter entry purged from database registers.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
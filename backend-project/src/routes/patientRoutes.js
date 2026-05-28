const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// 1. CREATE: Register Patient (Receptionist & Admin Only)
router.post('/', authenticateToken, authorizeRoles('Receptionist', 'Admin'), async (req, res) => {
    const { full_name, gender, age, phone, address } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO patients (full_name, gender, age, phone, address) VALUES (?, ?, ?, ?, ?)',
            [full_name, gender, age, phone, address]
        );
        res.status(201).json({ message: 'Patient registered successfully', patient_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. READ ALL / SEARCH: Fetch or filter records (All Authenticated Staff)
router.get('/', authenticateToken, async (req, res) => {
    const { term } = req.query;
    try {
        let query = 'SELECT * FROM patients ORDER BY created_at DESC';
        let params = [];
        
        if (term) {
            query = 'SELECT * FROM patients WHERE full_name LIKE ? OR phone LIKE ? ORDER BY created_at DESC';
            params = [`%${term}%`, `%${term}%`];
        }
        
        const [patients] = await db.execute(query, params);
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. READ SINGLE: Get specific patient by ID (All Authenticated Staff)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [patients] = await db.execute('SELECT * FROM patients WHERE patient_id = ?', [req.params.id]);
        if (patients.length === 0) return res.status(404).json({ message: 'Patient profile not found.' });
        res.json(patients[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE: Modify Patient details (Receptionist & Admin Only)
router.put('/:id', authenticateToken, authorizeRoles('Receptionist', 'Admin'), async (req, res) => {
    const { full_name, gender, age, phone, address } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE patients SET full_name = ?, gender = ?, age = ?, phone = ?, address = ? WHERE patient_id = ?',
            [full_name, gender, age, phone, address, req.params.id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Patient records could not be located.' });
        res.json({ message: 'Patient demographics modified successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. DELETE: Remove profile permanently (Admin Only)
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM patients WHERE patient_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Record does not exist.' });
        res.json({ message: 'Patient profile deleted permanently from storage clusters.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// 1. CREATE: Log Payments (Receptionist & Admin)
router.post('/', authenticateToken, authorizeRoles('Receptionist', 'Admin'), async (req, res) => {
    const { patient_id, amount, payment_method } = req.body;
    try {
        await db.execute(
            'INSERT INTO payments (patient_id, amount, payment_method) VALUES (?, ?, ?)',
            [patient_id, amount, payment_method]
        );
        res.status(201).json({ message: 'Payment recorded successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. READ ALL: Fetch continuous streaming billing ledger lists (All Authenticated Staff)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [ledger] = await db.execute(`
            SELECT p.payment_id, p.patient_id, p.amount, p.payment_method, p.payment_date, pat.full_name AS patient_name 
            FROM payments p
            JOIN patients pat ON p.patient_id = pat.patient_id
            ORDER BY p.payment_date DESC
        `);
        res.json(ledger);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. UPDATE: Adjust payment method or fix input amount anomalies (Receptionist & Admin Only)
router.put('/:id', authenticateToken, authorizeRoles('Receptionist', 'Admin'), async (req, res) => {
    const { amount, payment_method } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE payments SET amount = ?, payment_method = ? WHERE payment_id = ?',
            [amount, payment_method, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Transaction line not found.' });
        res.json({ message: 'Ledger item entry adjustments committed.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Purge incorrect remittance entry line (Admin Only - System Audit Lockout)
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM payments WHERE payment_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Record entry not located.' });
        res.json({ message: 'Payment ledger line deleted from active ledger audit.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
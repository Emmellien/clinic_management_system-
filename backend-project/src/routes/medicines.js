const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// Only Admin + Receptionist can mutate medicine inventory
const canEditMedicines = authorizeRoles('Admin', 'Receptionist');

// GET ALL: list medicines
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [medicines] = await db.execute(`
            SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
            FROM medicines
            ORDER BY name ASC
        `);
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ONE
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
            FROM medicines
            WHERE medicine_id = ?
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ message: 'Medicine not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/', authenticateToken, canEditMedicines, async (req, res) => {
    try {
        const { name, stock_quantity, unit_price, expiry_date } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Medicine name is required' });
        }

        const expiry = expiry_date ? new Date(expiry_date) : null;
        const expiryValue = expiry ? expiry.toISOString().slice(0, 10) : null;

        await db.execute(`
            INSERT INTO medicines (name, stock_quantity, unit_price, expiry_date)
            VALUES (?, ?, ?, ?)
        `, [
            name.trim(),
            Number(stock_quantity),
            Number(unit_price),
            expiryValue
        ]);

        const [rows] = await db.execute(`
            SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
            FROM medicines
            WHERE name = ?
            ORDER BY medicine_id DESC LIMIT 1
        `, [name.trim()]);

        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE
router.put('/:id', authenticateToken, canEditMedicines, async (req, res) => {
    try {
        const { name, stock_quantity, unit_price, expiry_date } = req.body;

        const expiry = expiry_date ? new Date(expiry_date) : null;
        const expiryValue = expiry ? expiry.toISOString().slice(0, 10) : null;

        await db.execute(`
            UPDATE medicines
            SET name = ?,
                stock_quantity = ?,
                unit_price = ?,
                expiry_date = ?
            WHERE medicine_id = ?
        `, [
            name.trim(),
            Number(stock_quantity),
            Number(unit_price),
            expiryValue,
            req.params.id
        ]);

        const [rows] = await db.execute(`
            SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
            FROM medicines
            WHERE medicine_id = ?
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ message: 'Medicine not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE
router.delete('/:id', authenticateToken, canEditMedicines, async (req, res) => {
    try {
        await db.execute(`DELETE FROM medicines WHERE medicine_id = ?`, [req.params.id]);
        res.json({ message: 'Medicine deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

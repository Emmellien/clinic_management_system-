const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('./authMiddleware');

// GET ALL: Fetch medicine items stock counts for the Prescription dropdown template
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [medicines] = await db.execute(`
            SELECT medicine_id, name, stock_quantity 
            FROM medicines 
            ORDER BY name ASC
        `);
        res.json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
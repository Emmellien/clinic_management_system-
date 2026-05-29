const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { authenticateToken } = require('./authMiddleware');

// GET /api/users?role=Doctor
// Returns non-sensitive staff data (no password_hash)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;

    let query = 'SELECT user_id, full_name, email, role, phone, created_at FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


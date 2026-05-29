const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Staff Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.user_id, role: user.role, name: user.full_name },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, role: user.role, name: user.full_name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/register', async (req, res) => {
    // We receive plain 'password' from the frontend JSON request body
    const { full_name, email, password, role, phone } = req.body;

    // Simple validation: Ensure required fields are sent
    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ 
            message: "Please fill in all required fields (full_name, email, password, role)" 
        });
    }

    try {
        // 1. Check if a user account with this email already exists
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error("Database error during check:", err);
                return res.status(500).json({ message: "Database failure occurred." });
            }

            if (results && results.length > 0) {
                return res.status(400).json({ message: "An account with this email already exists." });
            }

            // 2. Encrypt the plain text password using bcrypt
            const salt = await bcrypt.genSalt(10);
            const encryptedHash = await bcrypt.hash(password, salt);

            // 3. Insert user details using the exact column names from your phpMyAdmin schema
            // FIXED: Changed 'passwordHash' to 'password_hash' to match your table definition
            const insertQuery = `
                INSERT INTO users (full_name, email, password_hash, role, phone) 
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(insertQuery, [full_name, email, encryptedHash, role, phone || null], (insertErr, result) => {
                if (insertErr) {
                    console.error("Database error during insert:", insertErr);
                    return res.status(500).json({ message: "Failed to complete account registration." });
                }

                res.status(201).json({ 
                    message: `🎉 Success! Profile for ${full_name} (${role}) registered safely into the database.`,
                    user_id: result.insertId
                });
            });
        });

    } catch (error) {
        console.error("Server processing error:", error);
        res.status(500).json({ message: "Internal server processing error." });
    }
});

module.exports = router;
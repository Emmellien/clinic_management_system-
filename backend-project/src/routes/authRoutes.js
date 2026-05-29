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
    const { full_name, email, password, role } = req.body;
    try {
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) return res.status(400).json({ message: 'Email already in use' });
        const password_hash = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)', 
            [full_name, email, password_hash, role]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
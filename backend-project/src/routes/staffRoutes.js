const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// 1. CREATE: Register a Staff Account (Admin Only)
router.post('/register', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { full_name, email, password, role, phone } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.execute(
            'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, hashedPassword, role, phone]
        );
        res.status(201).json({ message: 'Staff member registered securely' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

// 2. READ ALL: Fetch list of all working staff members (Admin Only)
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        // We select everything except the password hash for security reasons
        const [staff] = await db.execute(
            'SELECT user_id, full_name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. UPDATE: Modify Staff Permissions / Info (Admin Only)
router.put('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    const { full_name, email, role, phone, password } = req.body;
    try {
        let query = 'UPDATE users SET full_name = ?, email = ?, role = ?, phone = ? WHERE user_id = ?';
        let params = [full_name, email, role, phone, req.params.id];

        // If the admin provided a new password, hash it and update that as well
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query = 'UPDATE users SET full_name = ?, email = ?, role = ?, phone = ?, password_hash = ? WHERE user_id = ?';
            params = [full_name, email, role, phone, hashedPassword, req.params.id];
        }

        const [result] = await db.execute(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff account not found.' });
        
        res.json({ message: 'Staff profile parameters updated successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'This email is already taken.' });
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Terminate / Revoke Staff Access (Admin Only)
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        // Prevent an admin from accidentally deleting their own active profile
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: 'Operation rejected: Cannot delete your own active admin account.' });
        }

        const [result] = await db.execute('DELETE FROM users WHERE user_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Staff record not found.' });
        
        res.json({ message: 'Staff access privileges revoked and account deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// INITIALIZE MASTER ADMIN (Public endpoint for baseline seed deployment)
router.post('/init-admin', async (req, res) => {
    const { full_name, email, password, role, phone } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.execute(
            'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, hashedPassword, role, phone]
        );
        res.status(201).json({ message: 'Master Admin registered successfully!' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'This email is already registered.' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
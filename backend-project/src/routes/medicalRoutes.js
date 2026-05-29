const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

// 1. CREATE: Add Prescription (Doctors & Nurses Only)
router.post('/prescribe', authenticateToken, authorizeRoles('Doctor', 'Nurse'), async (req, res) => {
    const { treatment_id, medicine_id, quantity, dosage } = req.body;
    try {
        // Optional Audit Check: Ensure medicine stock is available before writing row
        const [medCheck] = await db.execute('SELECT stock_quantity FROM medicines WHERE medicine_id = ?', [medicine_id]);
        if (medCheck.length === 0) return res.status(404).json({ message: 'Medicine item not found in inventory.' });
        if (medCheck[0].stock_quantity < quantity) {
            return res.status(400).json({ message: `Insufficient stock. Only ${medCheck[0].stock_quantity} units remaining.` });
        }

        await db.execute(
            'INSERT INTO prescriptions (treatment_id, medicine_id, quantity, dosage) VALUES (?, ?, ?, ?)',
            [treatment_id, medicine_id, quantity, dosage]
        );

        // Automatically deduct stock from the medicines inventory table
        await db.execute('UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?', [quantity, medicine_id]);

        res.status(201).json({ message: 'Prescription recorded successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. READ ALL: Fetch continuous prescription list with medication and treatment data (All Staff)
router.get('/prescribe', authenticateToken, async (req, res) => {
    try {
        const [prescriptions] = await db.execute(`
            SELECT 
                pr.prescription_id, pr.treatment_id, pr.medicine_id, pr.quantity, pr.dosage,
                m.name AS medicine_name,
                t.diagnosis AS associated_diagnosis,
                p.full_name AS patient_name
            FROM prescriptions pr
            JOIN medicines m ON pr.medicine_id = m.medicine_id
            JOIN treatments t ON pr.treatment_id = t.treatment_id
            JOIN patients p ON t.patient_id = p.patient_id
            ORDER BY pr.prescription_id DESC
        `);
        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. UPDATE: Alter prescription dosage or adjustment amounts (Doctors & Nurses Only)
router.put('/prescribe/:id', authenticateToken, authorizeRoles('Doctor', 'Nurse'), async (req, res) => {
    const { quantity, dosage } = req.body;
    try {
        // Locate original prescription row to calculate inventory variance adjustments
        const [oldRow] = await db.execute('SELECT medicine_id, quantity FROM prescriptions WHERE prescription_id = ?', [req.params.id]);
        if (oldRow.length === 0) return res.status(404).json({ message: 'Prescription record not found.' });

        const medId = oldRow[0].medicine_id;
        const qtyDifference = quantity - oldRow[0].quantity; // positive means we need more stock, negative means return stock

        if (qtyDifference > 0) {
            const [medCheck] = await db.execute('SELECT stock_quantity FROM medicines WHERE medicine_id = ?', [medId]);
            if (medCheck[0].stock_quantity < qtyDifference) {
                return res.status(400).json({ message: 'Inventory shortage prevents increasing this prescription item quantity.' });
            }
        }

        // Apply parameter updates to prescription row
        await db.execute(
            'UPDATE prescriptions SET quantity = ?, dosage = ? WHERE prescription_id = ?',
            [quantity, dosage, req.params.id]
        );

        // Sync back inventory stock balance shifts 
        await db.execute('UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?', [qtyDifference, medId]);

        res.json({ message: 'Prescription records and inventory stocks adjusted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Void/Purge Prescription order (Admin Only)
router.delete('/prescribe/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        // Fetch prescription values first to return allocated stocks back to catalog
        const [row] = await db.execute('SELECT medicine_id, quantity FROM prescriptions WHERE prescription_id = ?', [req.params.id]);
        if (row.length === 0) return res.status(404).json({ message: 'Record not located.' });

        await db.execute('UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE medicine_id = ?', [row[0].quantity, row[0].medicine_id]);
        await db.execute('DELETE FROM prescriptions WHERE prescription_id = ?', [req.params.id]);

        res.json({ message: 'Prescription voided completely. Allocated stock returned to warehouse inventory.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. CREATE BUNDLE: Two medication items for the same treatment (Doctors & Nurses Only)
// Creates TWO prescription rows and deducts stock for both medicines in a single DB transaction.
router.post('/prescribe-bundle', authenticateToken, authorizeRoles('Doctor', 'Nurse'), async (req, res) => {
    const {
        treatment_id,
        medicine_id_1,
        quantity_1,
        medicine_id_2,
        quantity_2,
        dosage
    } = req.body;

    try {
        // Basic presence validation
        if (!treatment_id) return res.status(400).json({ message: 'treatment_id is required.' });
        if (!medicine_id_1 || !medicine_id_2) {
            return res.status(400).json({ message: 'medicine_id_1 and medicine_id_2 are required.' });
        }
        if (!quantity_1 || !quantity_2) {
            return res.status(400).json({ message: 'quantity_1 and quantity_2 are required.' });
        }

        // Transaction safety (MySQL)
        await db.execute('START TRANSACTION');

        // Fetch stock for both medicines
        const [medRows] = await db.execute(
            'SELECT medicine_id, stock_quantity FROM medicines WHERE medicine_id IN (?, ?)',
            [medicine_id_1, medicine_id_2]
        );

        const stockMap = new Map(medRows.map(r => [r.medicine_id, r.stock_quantity]));

        if (!stockMap.has(medicine_id_1)) {
            await db.execute('ROLLBACK');
            return res.status(404).json({ message: 'Medicine item 1 not found in inventory.' });
        }
        if (!stockMap.has(medicine_id_2)) {
            await db.execute('ROLLBACK');
            return res.status(404).json({ message: 'Medicine item 2 not found in inventory.' });
        }

        if (stockMap.get(medicine_id_1) < quantity_1) {
            await db.execute('ROLLBACK');
            return res.status(400).json({ message: `Insufficient stock for medicine 1. Only ${stockMap.get(medicine_id_1)} units remaining.` });
        }
        if (stockMap.get(medicine_id_2) < quantity_2) {
            await db.execute('ROLLBACK');
            return res.status(400).json({ message: `Insufficient stock for medicine 2. Only ${stockMap.get(medicine_id_2)} units remaining.` });
        }

        // Insert both prescription rows
        await db.execute(
            'INSERT INTO prescriptions (treatment_id, medicine_id, quantity, dosage) VALUES (?, ?, ?, ?)',
            [treatment_id, medicine_id_1, quantity_1, dosage]
        );
        await db.execute(
            'INSERT INTO prescriptions (treatment_id, medicine_id, quantity, dosage) VALUES (?, ?, ?, ?)',
            [treatment_id, medicine_id_2, quantity_2, dosage]
        );

        // Deduct both medicines
        await db.execute(
            'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?',
            [quantity_1, medicine_id_1]
        );
        await db.execute(
            'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?',
            [quantity_2, medicine_id_2]
        );

        await db.execute('COMMIT');
        res.status(201).json({ message: 'Bundle prescription recorded successfully (2 medicines).' });
    } catch (err) {
        try { await db.execute('ROLLBACK'); } catch (_) {}
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

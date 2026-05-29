const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Router Imports
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const medicalRoutes = require('./routes/medicalRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const medicineRoutes = require('./routes/medicines');
const medicineReportsRoutes = require('./routes/medicineReports');
const usersRoutes = require('./routes/usersRoutes');
const reportsRoutes = require('./routes/reportsRoutes');


const app = express();

// Global App Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Route Mappings
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-reports', medicineReportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);

// Global Error Catchment
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal secure server error occurred.' });
});

const PORT = process.env.PORT || 5000;

// Daily report cron (server generates report automatically)
// Run at 00:05 every day
try {
    const cron = require('node-cron');
    cron.schedule('5 0 * * *', async () => {
        try {
            const path = require('path');
            const fs = require('fs');
            const db = require('./config/db');
            const {
                buildDailyMedicinesCSV,
                ensureDir,
                getDailyReportPath,
            } = require('./utils/medicineReport');

            const dateISO = new Date().toISOString().slice(0, 10);
            const [rows] = await db.execute(`
                SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
                FROM medicines
                ORDER BY name ASC
            `);

            const csv = buildDailyMedicinesCSV({ dateISO, rows });

            const baseDir = path.join(__dirname, '..'); // backend-project/
            const reportPath = getDailyReportPath(baseDir, dateISO);
            ensureDir(path.dirname(reportPath));
            fs.writeFileSync(reportPath, csv, 'utf8');

            console.log(`[cron] Daily medicine report generated: ${dateISO}`);
        } catch (e) {
            console.error('[cron] Failed to generate daily medicine report', e.message);
        }
    });
} catch (e) {
    console.warn('node-cron not configured:', e.message);
}

app.listen(PORT, () => {
    console.log(`Clinic Management Backend operating on port ${PORT}`);
});

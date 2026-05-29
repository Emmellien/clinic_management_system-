const express = require('express');
const path = require('path');
const db = require('../config/db');
const { authenticateToken } = require('./authMiddleware');
const {
  buildDailyMedicinesCSV,
  ensureDir,
  getDailyReportPath,
} = require('../utils/medicineReport');

const router = express.Router();

function toDateISO(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

async function generateDailyReport({ dateISO }) {
  const [rows] = await db.execute(`
    SELECT medicine_id, name, stock_quantity, unit_price, expiry_date
    FROM medicines
    ORDER BY name ASC
  `);

  const csv = buildDailyMedicinesCSV({
    dateISO,
    rows,
  });

  const baseDir = path.join(__dirname, '..', '..');
  const reportPath = getDailyReportPath(baseDir, dateISO);
  ensureDir(path.dirname(reportPath));
  require('fs').writeFileSync(reportPath, csv, 'utf8');
  return { reportPath, count: rows.length };
}

// Download a daily report CSV. Generates on-demand if missing.
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const dateISO = req.query.date ? String(req.query.date) : toDateISO(new Date());

    const baseDir = path.join(__dirname, '..', '..');
    const fs = require('fs');
    const reportPath = getDailyReportPath(baseDir, dateISO);

    if (!fs.existsSync(reportPath)) {
      await generateDailyReport({ dateISO });
    }

    res.download(reportPath, `daily-medicines-report-${dateISO}.csv`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint used by cron job to force regenerate
router.post('/daily/generate', authenticateToken, async (req, res) => {
  try {
    const dateISO = req.query.date ? String(req.query.date) : toDateISO(new Date());
    const result = await generateDailyReport({ dateISO });
    res.json({ ...result, dateISO });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


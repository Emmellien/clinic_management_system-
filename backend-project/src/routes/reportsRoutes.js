const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('./authMiddleware');

function toDateISO(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

async function getTreatmentsInLastDays(days) {
  const [rows] = await db.execute(
    `SELECT DATE(treatment_date) AS day, COUNT(*) AS count
     FROM treatments
     WHERE treatment_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
     GROUP BY DATE(treatment_date)
     ORDER BY day ASC`,
    [days]
  );
  return rows;
}

async function getPaymentMethodsDistribution() {
  const [rows] = await db.execute(
    `SELECT payment_method, COUNT(*) AS count
     FROM payments
     GROUP BY payment_method
     ORDER BY count DESC`
  );
  return rows;
}

async function getTopMedicinesUsed(limit = 5) {
  const [rows] = await db.execute(
    `SELECT m.medicine_id, m.name, SUM(pr.quantity) AS total_quantity
     FROM prescriptions pr
     JOIN medicines m ON pr.medicine_id = m.medicine_id
     GROUP BY m.medicine_id, m.name
     ORDER BY total_quantity DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function getTopDiagnoses(limit = 5) {
  const [rows] = await db.execute(
    `SELECT diagnosis, COUNT(*) AS count
     FROM treatments
     GROUP BY diagnosis
     ORDER BY count DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function getMedicineStockDistribution() {
  // Buckets: Out (0), Low (< 20), Normal (>=20)
  const [rows] = await db.execute(
    `SELECT
        CASE
          WHEN stock_quantity = 0 THEN 'Out of stock'
          WHEN stock_quantity < 20 THEN 'Low stock'
          ELSE 'Healthy stock'
        END AS bucket,
        COUNT(*) AS count
     FROM medicines
     GROUP BY bucket
     ORDER BY count DESC`
  );
  return rows;
}

// Summary cards: medicine metrics + treatment/payment totals
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const [[medicineTotals], [treatmentTotals], [paymentTotals], [expiredTotals]] = await Promise.all([
      db.execute(`SELECT COUNT(*) AS total_medicines,
                         SUM(stock_quantity = 0) AS out_of_stock,
                         SUM(stock_quantity < 20 AND stock_quantity > 0) AS low_stock
                  FROM medicines`),
      db.execute(`SELECT COUNT(*) AS total_treatments FROM treatments`),
      db.execute(`SELECT COUNT(*) AS total_payments, SUM(amount) AS total_amount FROM payments`),
      db.execute(`SELECT COUNT(*) AS expired_medicines
                  FROM medicines
                  WHERE expiry_date IS NOT NULL AND expiry_date < CURDATE()`),
    ]);

    res.json({
      medicine: {
        total_medicines: medicineTotals?.total_medicines || 0,
        out_of_stock: medicineTotals?.out_of_stock || 0,
        low_stock: medicineTotals?.low_stock || 0,
        expired_medicines: expiredTotals?.expired_medicines || 0,
      },
      treatments: {
        total_treatments: treatmentTotals?.total_treatments || 0,
      },
      payments: {
        total_payments: paymentTotals?.total_payments || 0,
        total_amount: paymentTotals?.total_amount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/medicines-distribution', authenticateToken, async (req, res) => {
  try {
    const rows = await getMedicineStockDistribution();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/payments-distribution', authenticateToken, async (req, res) => {
  try {
    const rows = await getPaymentMethodsDistribution();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/treatments-trend', authenticateToken, async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 14;
    const safeDays = Number.isFinite(days) && days > 0 && days <= 60 ? days : 14;

    const rows = await getTreatmentsInLastDays(safeDays);
    // Normalize into arrays for charts
    const labels = rows.map(r => r.day);
    const data = rows.map(r => Number(r.count));
    res.json({ labels, data, days: safeDays });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/top-medicines-used', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 20 ? limit : 5;
    const rows = await getTopMedicinesUsed(safeLimit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/top-diagnoses', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 20 ? limit : 5;
    const rows = await getTopDiagnoses(safeLimit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


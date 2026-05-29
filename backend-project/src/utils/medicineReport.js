const fs = require('fs');
const path = require('path');

function formatCSVValue(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  // Escape quotes and wrap with quotes if needed
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildDailyMedicinesCSV({ dateISO, rows }) {
  const header = ['medicine_id', 'name', 'stock_quantity', 'unit_price', 'expiry_date'];
  const lines = [header.join(',')];

  for (const r of rows) {
    lines.push([
      formatCSVValue(r.medicine_id),
      formatCSVValue(r.name),
      formatCSVValue(r.stock_quantity),
      formatCSVValue(r.unit_price),
      formatCSVValue(r.expiry_date),
    ].join(','));
  }

  return lines.join('\n');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function getReportDir(baseDir) {
  return path.join(baseDir, 'reports', 'medicine-daily');
}

function getDailyReportPath(baseDir, dateISO) {
  return path.join(getReportDir(baseDir), `daily-medicines-report-${dateISO}.csv`);
}

module.exports = {
  buildDailyMedicinesCSV,
  ensureDir,
  getReportDir,
  getDailyReportPath,
};


const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const csv     = require('csv-parser');
const fs      = require('fs');
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

const tableConfig = {
  buses: {
    table: 'Bus',
    columns: ['bus_number', 'bus_type', 'capacity', 'status'],
    placeholders: '(?, ?, ?, ?)',
  },
  trains: {
    table: 'Train',
    columns: ['train_number', 'train_name', 'train_type', 'total_coaches', 'seats_per_coach', 'status'],
    placeholders: '(?, ?, ?, ?, ?, ?)',
  },
  'bus-drivers': {
    table: 'BusDriver',
    columns: ['name', 'license_number', 'phone', 'experience_years'],
    placeholders: '(?, ?, ?, ?)',
  },
  'train-drivers': {
    table: 'TrainDriver',
    columns: ['name', 'employee_id', 'phone', 'experience_years'],
    placeholders: '(?, ?, ?, ?)',
  },
  routes: {
    table: 'Route',
    columns: ['source_city_id', 'destination_city_id', 'distance_km'],
    placeholders: '(?, ?, ?)',
  },
};

// POST /api/import/:tableName — admin only
router.post('/:tableName', requireAdmin, upload.single('file'), async (req, res) => {
  const { tableName } = req.params;

  if (!tableConfig[tableName]) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: `Invalid table. Allowed: ${Object.keys(tableConfig).join(', ')}`,
    });
  }

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const config  = tableConfig[tableName];
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const values = config.columns.map(col => (row[col] !== undefined ? row[col].trim() : null));
      results.push(values);
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path);
      if (results.length === 0)
        return res.status(400).json({ error: 'CSV is empty or columns do not match' });

      try {
        const colList = config.columns.join(', ');
        const query   = `INSERT IGNORE INTO ${config.table} (${colList}) VALUES ${config.placeholders}`;
        let inserted  = 0;
        for (const values of results) {
          const [result] = await db.query(query, values);
          inserted += result.affectedRows;
        }
        res.json({ message: 'Import successful', rows_parsed: results.length, rows_inserted: inserted });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    })
    .on('error', (err) => {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'CSV parse error: ' + err.message });
    });
});

module.exports = router;

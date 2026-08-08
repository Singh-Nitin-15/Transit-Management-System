const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all drivers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Driver ORDER BY driver_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a driver
router.post('/', async (req, res) => {
  const { name, license_number, phone, experience_years } = req.body;
  if (!name || !license_number || !phone || experience_years === undefined) {
    return res.status(400).json({ error: 'All fields (name, license_number, phone, experience_years) are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Driver (name, license_number, phone, experience_years) VALUES (?, ?, ?, ?)',
      [name, license_number, phone, experience_years]
    );
    res.status(201).json({ message: 'Driver added successfully', driver_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'License number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

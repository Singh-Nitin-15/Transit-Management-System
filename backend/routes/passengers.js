const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all passengers
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Passenger ORDER BY passenger_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a passenger
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'name, email, and phone are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Passenger (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );
    res.status(201).json({ message: 'Passenger added successfully', passenger_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

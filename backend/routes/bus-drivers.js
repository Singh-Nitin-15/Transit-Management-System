const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all bus drivers — admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM BusDriver ORDER BY driver_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add bus driver — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { name, license_number, phone, experience_years } = req.body;
  if (!name || !license_number || !phone || experience_years === undefined)
    return res.status(400).json({ error: 'All fields (name, license_number, phone, experience_years) are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO BusDriver (name, license_number, phone, experience_years) VALUES (?, ?, ?, ?)',
      [name, license_number, phone, Number(experience_years)]
    );
    res.status(201).json({ message: 'Bus driver added successfully', driver_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'License number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE bus driver — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM BusDriver WHERE driver_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Bus driver deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete driver assigned to a schedule' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all train drivers (loco pilots) — admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TrainDriver ORDER BY loco_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add train driver — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { name, employee_id, phone, experience_years } = req.body;
  if (!name || !employee_id || !phone || experience_years === undefined)
    return res.status(400).json({ error: 'All fields (name, employee_id, phone, experience_years) are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO TrainDriver (name, employee_id, phone, experience_years) VALUES (?, ?, ?, ?)',
      [name, employee_id, phone, Number(experience_years)]
    );
    res.status(201).json({ message: 'Train driver added successfully', loco_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Employee ID already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE train driver — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM TrainDriver WHERE loco_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Train driver not found' });
    res.json({ message: 'Train driver deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete driver assigned to a schedule' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

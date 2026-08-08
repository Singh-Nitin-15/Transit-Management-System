const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all trains — public
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Train ORDER BY train_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add train — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { train_number, train_name, train_type, total_coaches, seats_per_coach, status } = req.body;
  if (!train_number || !train_name || !train_type)
    return res.status(400).json({ error: 'train_number, train_name and train_type are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO Train (train_number, train_name, train_type, total_coaches, seats_per_coach, status) VALUES (?, ?, ?, ?, ?, ?)',
      [train_number, train_name, train_type, Number(total_coaches) || 12, Number(seats_per_coach) || 72, status || 'Active']
    );
    res.status(201).json({ message: 'Train added successfully', train_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Train number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update train status — admin only
router.put('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const [result] = await db.query('UPDATE Train SET status = ? WHERE train_id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Train not found' });
    res.json({ message: 'Train updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE train — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Train WHERE train_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Train not found' });
    res.json({ message: 'Train deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete train with existing schedules' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all buses — public
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Bus ORDER BY bus_id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add bus — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { bus_number, bus_type, capacity, status } = req.body;
  if (!bus_number || !bus_type || !capacity)
    return res.status(400).json({ error: 'bus_number, bus_type and capacity are required' });
  try {
    const [result] = await db.query(
      'INSERT INTO Bus (bus_number, bus_type, capacity, status) VALUES (?, ?, ?, ?)',
      [bus_number, bus_type, Number(capacity), status || 'Active']
    );
    res.status(201).json({ message: 'Bus added successfully', bus_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Bus number already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update bus status — admin only
router.put('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  try {
    const [result] = await db.query('UPDATE Bus SET status = ? WHERE bus_id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Bus not found' });
    res.json({ message: 'Bus updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE bus — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Bus WHERE bus_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Bus not found' });
    res.json({ message: 'Bus deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete bus with existing schedules' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

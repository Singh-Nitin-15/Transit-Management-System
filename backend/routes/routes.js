const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all routes with city names — public
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.route_id,
             cs.city_name AS source_city,
             cd.city_name AS destination_city,
             r.distance_km
      FROM Route r
      JOIN City cs ON r.source_city_id = cs.city_id
      JOIN City cd ON r.destination_city_id = cd.city_id
      ORDER BY r.route_id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add route — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { source_city_id, destination_city_id, distance_km } = req.body;
  if (!source_city_id || !destination_city_id || !distance_km)
    return res.status(400).json({ error: 'source_city_id, destination_city_id and distance_km are required' });
  if (Number(source_city_id) === Number(destination_city_id))
    return res.status(400).json({ error: 'Source and destination cities must be different' });
  try {
    const [result] = await db.query(
      'INSERT INTO Route (source_city_id, destination_city_id, distance_km) VALUES (?, ?, ?)',
      [source_city_id, destination_city_id, distance_km]
    );
    res.status(201).json({ message: 'Route added successfully', route_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all cities — public helper
router.get('/cities', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM City ORDER BY city_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

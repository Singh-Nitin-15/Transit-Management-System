const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all schedules (joined)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.schedule_id,
        b.bus_number,
        b.bus_type,
        cs.city_name  AS source_city,
        cd.city_name  AS destination_city,
        r.distance_km,
        d.name        AS driver_name,
        s.departure_time,
        s.arrival_time,
        s.fare
      FROM Schedule s
      JOIN Bus     b  ON s.bus_id    = b.bus_id
      JOIN Route   r  ON s.route_id  = r.route_id
      JOIN City    cs ON r.source_city_id      = cs.city_id
      JOIN City    cd ON r.destination_city_id = cd.city_id
      JOIN Driver  d  ON s.driver_id = d.driver_id
      ORDER BY s.schedule_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a schedule
router.post('/', async (req, res) => {
  const { bus_id, route_id, driver_id, departure_time, arrival_time, fare } = req.body;
  if (!bus_id || !route_id || !driver_id || !departure_time || !arrival_time || !fare) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO Schedule (bus_id, route_id, driver_id, departure_time, arrival_time, fare)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bus_id, route_id, driver_id, departure_time, arrival_time, fare]
    );
    res.status(201).json({ message: 'Schedule added successfully', schedule_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET all bus schedules with joins — public
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.schedule_id,
        b.bus_id, b.bus_number, b.bus_type, b.capacity,
        cs.city_name  AS source_city,
        cd.city_name  AS destination_city,
        r.distance_km,
        r.route_id,
        d.driver_id, d.name AS driver_name,
        s.departure_time, s.arrival_time, s.fare,
        (b.capacity - COUNT(bk.booking_id)) AS available_seats
      FROM BusSchedule s
      JOIN Bus       b  ON s.bus_id    = b.bus_id
      JOIN Route     r  ON s.route_id  = r.route_id
      JOIN City      cs ON r.source_city_id      = cs.city_id
      JOIN City      cd ON r.destination_city_id = cd.city_id
      JOIN BusDriver d  ON s.driver_id = d.driver_id
      LEFT JOIN BusBooking bk ON bk.schedule_id = s.schedule_id AND bk.status = 'Confirmed'
      GROUP BY s.schedule_id
      ORDER BY s.departure_time
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add bus schedule — admin only
router.post('/', requireAdmin, async (req, res) => {
  const { bus_id, route_id, driver_id, departure_time, arrival_time, fare } = req.body;
  if (!bus_id || !route_id || !driver_id || !departure_time || !arrival_time || !fare)
    return res.status(400).json({ error: 'All fields are required' });
  if (new Date(arrival_time) <= new Date(departure_time))
    return res.status(400).json({ error: 'Arrival time must be after departure time' });
  try {
    const [result] = await db.query(
      'INSERT INTO BusSchedule (bus_id, route_id, driver_id, departure_time, arrival_time, fare) VALUES (?, ?, ?, ?, ?, ?)',
      [bus_id, route_id, driver_id, departure_time, arrival_time, fare]
    );
    res.status(201).json({ message: 'Bus schedule added successfully', schedule_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE bus schedule — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM BusSchedule WHERE schedule_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Bus schedule deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ error: 'Cannot delete schedule with existing bookings' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all bookings (joined)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        bk.booking_id,
        p.name         AS passenger_name,
        p.email        AS passenger_email,
        b.bus_number,
        cs.city_name   AS source_city,
        cd.city_name   AS destination_city,
        s.departure_time,
        s.arrival_time,
        s.fare,
        bk.booking_date,
        bk.seat_number,
        bk.payment_status
      FROM Booking bk
      JOIN Passenger p ON bk.passenger_id = p.passenger_id
      JOIN Schedule  s ON bk.schedule_id  = s.schedule_id
      JOIN Bus       b ON s.bus_id        = b.bus_id
      JOIN Route     r ON s.route_id      = r.route_id
      JOIN City      cs ON r.source_city_id      = cs.city_id
      JOIN City      cd ON r.destination_city_id = cd.city_id
      ORDER BY bk.booking_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a booking
router.post('/', async (req, res) => {
  const { passenger_id, schedule_id, booking_date, seat_number, payment_status } = req.body;
  if (!passenger_id || !schedule_id || !booking_date || !seat_number) {
    return res.status(400).json({ error: 'passenger_id, schedule_id, booking_date, and seat_number are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO Booking (passenger_id, schedule_id, booking_date, seat_number, payment_status)
       VALUES (?, ?, ?, ?, ?)`,
      [passenger_id, schedule_id, booking_date, seat_number, payment_status || 'Pending']
    );
    res.status(201).json({ message: 'Booking created successfully', booking_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Seat already booked for this schedule' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

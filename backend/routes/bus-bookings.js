const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET bus bookings — user sees own, admin sees all
router.get('/', requireAuth, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const query = `
      SELECT
        bk.booking_id, bk.seat_number, bk.booking_date,
        bk.payment_status, bk.status,
        u.name AS passenger_name, u.email AS passenger_email,
        b.bus_number, b.bus_type,
        cs.city_name AS source_city,
        cd.city_name AS destination_city,
        s.departure_time, s.arrival_time, s.fare,
        s.schedule_id
      FROM BusBooking bk
      JOIN users        u  ON bk.user_id     = u.user_id
      JOIN BusSchedule  s  ON bk.schedule_id = s.schedule_id
      JOIN Bus          b  ON s.bus_id        = b.bus_id
      JOIN Route        r  ON s.route_id      = r.route_id
      JOIN City         cs ON r.source_city_id      = cs.city_id
      JOIN City         cd ON r.destination_city_id = cd.city_id
      ${isAdmin ? '' : 'WHERE bk.user_id = ?'}
      ORDER BY bk.booking_id DESC
    `;
    const params = isAdmin ? [] : [req.user.user_id];
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create bus booking — logged-in user
router.post('/', requireAuth, async (req, res) => {
  const { schedule_id, seat_number, payment_status } = req.body;
  if (!schedule_id || !seat_number)
    return res.status(400).json({ error: 'schedule_id and seat_number are required' });

  try {
    // Validate seat against bus capacity
    const [[sched]] = await db.query(
      'SELECT bs.*, b.capacity FROM BusSchedule bs JOIN Bus b ON bs.bus_id = b.bus_id WHERE bs.schedule_id = ?',
      [schedule_id]
    );
    if (!sched) return res.status(404).json({ error: 'Schedule not found' });
    if (Number(seat_number) < 1 || Number(seat_number) > sched.capacity)
      return res.status(400).json({ error: `Seat number must be between 1 and ${sched.capacity}` });

    const today = new Date().toISOString().slice(0, 10);
    const [result] = await db.query(
      'INSERT INTO BusBooking (user_id, schedule_id, booking_date, seat_number, payment_status) VALUES (?, ?, ?, ?, ?)',
      [req.user.user_id, schedule_id, today, seat_number, payment_status || 'Pending']
    );
    res.status(201).json({ message: 'Bus booking created successfully', booking_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Seat already booked for this schedule' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE cancel bus booking — user cancels own, admin cancels any
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [[booking]] = await db.query('SELECT * FROM BusBooking WHERE booking_id = ?', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.user_id !== req.user.user_id)
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    if (booking.status === 'Cancelled')
      return res.status(400).json({ error: 'Booking is already cancelled' });

    await db.query("UPDATE BusBooking SET status = 'Cancelled' WHERE booking_id = ?", [req.params.id]);
    res.json({ message: 'Bus booking cancelled successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

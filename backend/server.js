require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRouter          = require('./routes/auth');
const busesRouter         = require('./routes/buses');
const trainsRouter        = require('./routes/trains');
const busDriversRouter    = require('./routes/bus-drivers');
const trainDriversRouter  = require('./routes/train-drivers');
const busSchedulesRouter  = require('./routes/bus-schedules');
const trainSchedulesRouter= require('./routes/train-schedules');
const busBookingsRouter   = require('./routes/bus-bookings');
const trainBookingsRouter = require('./routes/train-bookings');
const routesRouter        = require('./routes/routes');
const importRouter        = require('./routes/import');
const adminInvitesRouter  = require('./routes/admin-invites');

const { requireAuth, requireAdmin } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',            authRouter);
app.use('/api/buses',           busesRouter);
app.use('/api/trains',          trainsRouter);
app.use('/api/bus-drivers',     busDriversRouter);
app.use('/api/train-drivers',   trainDriversRouter);
app.use('/api/bus-schedules',   busSchedulesRouter);
app.use('/api/train-schedules', trainSchedulesRouter);
app.use('/api/bus-bookings',    busBookingsRouter);
app.use('/api/train-bookings',  trainBookingsRouter);
app.use('/api/routes',          routesRouter);
app.use('/api/import',          importRouter);
app.use('/api/admin-invites',   adminInvitesRouter);

// ── Dashboard Summary ─────────────────────────────────────────
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const db = require('./db');
    const isAdmin = req.user.role === 'admin';
    const uid = req.user.user_id;

    const [[buses]]          = await db.query("SELECT COUNT(*) AS count FROM Bus WHERE status='Active'");
    const [[trains]]         = await db.query("SELECT COUNT(*) AS count FROM Train WHERE status='Active'");
    const [[routes]]         = await db.query('SELECT COUNT(*) AS count FROM Route');
    const [[busSchedules]]   = await db.query('SELECT COUNT(*) AS count FROM BusSchedule');
    const [[trainSchedules]] = await db.query('SELECT COUNT(*) AS count FROM TrainSchedule');

    let busBookings, trainBookings;
    if (isAdmin) {
      [[busBookings]]   = await db.query("SELECT COUNT(*) AS count FROM BusBooking WHERE status='Confirmed'");
      [[trainBookings]] = await db.query("SELECT COUNT(*) AS count FROM TrainBooking WHERE status='Confirmed'");
    } else {
      [[busBookings]]   = await db.query("SELECT COUNT(*) AS count FROM BusBooking WHERE user_id=? AND status='Confirmed'", [uid]);
      [[trainBookings]] = await db.query("SELECT COUNT(*) AS count FROM TrainBooking WHERE user_id=? AND status='Confirmed'", [uid]);
    }

    res.json({
      buses:         buses.count,
      trains:        trains.count,
      routes:        routes.count,
      busSchedules:  busSchedules.count,
      trainSchedules:trainSchedules.count,
      busBookings:   busBookings.count,
      trainBookings: trainBookings.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚌🚆 Transport Management System API', port: PORT });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

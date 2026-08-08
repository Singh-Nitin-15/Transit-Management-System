import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT_BOOK = { schedule_id: '', seat_number: '', payment_status: 'Pending' };

const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function BusSchedules() {
  const { isAdmin, authFetch } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses]         = useState([]);
  const [routes, setRoutes]       = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');
  const [bookingFor, setBookingFor] = useState(null); // schedule object
  const [bookForm, setBookForm]   = useState(INIT_BOOK);
  const [bookMsg, setBookMsg]     = useState('');
  const [bookErr, setBookErr]     = useState('');
  // Admin add schedule
  const INIT_SCHED = { bus_id: '', route_id: '', driver_id: '', departure_time: '', arrival_time: '', fare: '' };
  const [schedForm, setSchedForm] = useState(INIT_SCHED);
  const [schedMsg, setSchedMsg]   = useState('');
  const [schedErr, setSchedErr]   = useState('');

  const fetchAll = () => {
    setLoading(true);
    const p = [fetch(`${API}/bus-schedules`).then(r => r.json())];
    if (isAdmin) {
      p.push(fetch(`${API}/buses`).then(r => r.json()));
      p.push(fetch(`${API}/routes`).then(r => r.json()));
      p.push(authFetch(`${API}/bus-drivers`).then(r => r.json()));
    }
    Promise.all(p).then(([s, b, r, d]) => {
      setSchedules(Array.isArray(s) ? s : []);
      if (isAdmin) { setBuses(b || []); setRoutes(r || []); setDrivers(d || []); }
      setLoading(false);
    }).catch(() => { setErr('Failed to load data'); setLoading(false); });
  };

  useEffect(() => { fetchAll(); }, []);

  const openBooking = (sched) => {
    setBookingFor(sched);
    setBookForm({ ...INIT_BOOK, schedule_id: sched.schedule_id });
    setBookMsg(''); setBookErr('');
  };

  const submitBooking = async (e) => {
    e.preventDefault(); setBookMsg(''); setBookErr('');
    if (!bookForm.seat_number) { setBookErr('Seat number is required'); return; }
    const res  = await authFetch(`${API}/bus-bookings`, { method: 'POST', body: JSON.stringify(bookForm) });
    const data = await res.json();
    if (!res.ok) { setBookErr(data.error || 'Booking failed'); return; }
    setBookMsg(`✅ ${data.message} (Booking #${data.booking_id})`);
    setBookingFor(null); fetchAll();
  };

  const submitSched = async (e) => {
    e.preventDefault(); setSchedMsg(''); setSchedErr('');
    const res  = await authFetch(`${API}/bus-schedules`, { method: 'POST', body: JSON.stringify({
      ...schedForm, bus_id: +schedForm.bus_id, route_id: +schedForm.route_id,
      driver_id: +schedForm.driver_id, fare: +schedForm.fare,
    })});
    const data = await res.json();
    if (!res.ok) { setSchedErr(data.error || 'Failed'); return; }
    setSchedMsg(`✅ ${data.message}`); setSchedForm(INIT_SCHED); fetchAll();
  };

  const deleteSched = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    const res  = await authFetch(`${API}/bus-schedules/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchAll();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚌 Bus Schedules</h1>
        <p>{isAdmin ? 'Manage bus schedules and routes' : 'Browse available bus schedules and book your seat'}</p>
      </div>

      {bookMsg && <div className="alert alert-success">{bookMsg}</div>}
      {err     && <div className="alert alert-error">{err}</div>}

      {/* Booking Modal */}
      {bookingFor && (
        <div className="modal-overlay" onClick={() => setBookingFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎫 Book Bus Seat</h3>
              <button className="modal-close" onClick={() => setBookingFor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{bookingFor.bus_number}</strong> ({bookingFor.bus_type}) — {bookingFor.source_city} → {bookingFor.destination_city}<br />
                <span>🕐 {fmt(bookingFor.departure_time)} &nbsp;|&nbsp; ₹{Number(bookingFor.fare).toLocaleString('en-IN')} &nbsp;|&nbsp; {bookingFor.available_seats} seats left</span>
              </p>
              <form onSubmit={submitBooking}>
                <div className="form-group">
                  <label>Seat Number * (1 – {bookingFor.capacity})</label>
                  <input type="number" min="1" max={bookingFor.capacity} placeholder="e.g. 12"
                    value={bookForm.seat_number} onChange={e => setBookForm(p => ({ ...p, seat_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select value={bookForm.payment_status} onChange={e => setBookForm(p => ({ ...p, payment_status: e.target.value }))}>
                    <option>Pending</option><option>Paid</option>
                  </select>
                </div>
                {bookErr && <div className="alert alert-error">{bookErr}</div>}
                <button className="btn btn-primary" type="submit">✅ Confirm Booking</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Add Schedule */}
      {isAdmin && (
        <div className="card">
          <div className="card-title">➕ Add New Bus Schedule</div>
          <form onSubmit={submitSched}>
            <div className="form-grid">
              <div className="form-group">
                <label>Bus *</label>
                <select value={schedForm.bus_id} onChange={e => setSchedForm(p => ({ ...p, bus_id: e.target.value }))}>
                  <option value="">Select Bus</option>
                  {buses.filter(b => b.status === 'Active').map(b => <option key={b.bus_id} value={b.bus_id}>{b.bus_number} ({b.bus_type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Route *</label>
                <select value={schedForm.route_id} onChange={e => setSchedForm(p => ({ ...p, route_id: e.target.value }))}>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.source_city} → {r.destination_city} ({r.distance_km}km)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Driver *</label>
                <select value={schedForm.driver_id} onChange={e => setSchedForm(p => ({ ...p, driver_id: e.target.value }))}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.driver_id} value={d.driver_id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Departure *</label>
                <input type="datetime-local" value={schedForm.departure_time} onChange={e => setSchedForm(p => ({ ...p, departure_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Arrival *</label>
                <input type="datetime-local" value={schedForm.arrival_time} onChange={e => setSchedForm(p => ({ ...p, arrival_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Fare (₹) *</label>
                <input type="number" min="1" placeholder="450" value={schedForm.fare} onChange={e => setSchedForm(p => ({ ...p, fare: e.target.value }))} />
              </div>
            </div>
            {schedMsg && <div className="alert alert-success">{schedMsg}</div>}
            {schedErr && <div className="alert alert-error">{schedErr}</div>}
            <button className="btn btn-primary" type="submit">➕ Add Schedule</button>
          </form>
        </div>
      )}

      {/* Schedule Table */}
      <div className="card">
        <div className="card-title">🚌 Available Bus Schedules ({schedules.length})</div>
        {loading ? <div className="loading-text">Loading schedules…</div> :
          schedules.length === 0 ? <div className="empty-text">No bus schedules found</div> :
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Bus</th><th>Route</th><th>Driver</th>
                  <th>Departure</th><th>Arrival</th><th>Fare</th>
                  <th>Seats Left</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.schedule_id}>
                    <td>{s.schedule_id}</td>
                    <td>
                      <strong>{s.bus_number}</strong>
                      <br /><span className="badge badge-bus">{s.bus_type}</span>
                    </td>
                    <td>{s.source_city} → {s.destination_city}<br /><small>{s.distance_km} km</small></td>
                    <td>{s.driver_name}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.departure_time)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.arrival_time)}</td>
                    <td><strong className="fare">₹{Number(s.fare).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`badge ${s.available_seats > 10 ? 'badge-success' : s.available_seats > 0 ? 'badge-warning' : 'badge-danger'}`}>
                        {s.available_seats > 0 ? s.available_seats : 'Full'}
                      </span>
                    </td>
                    <td>
                      {!isAdmin && s.available_seats > 0 && (
                        <button className="btn-book btn-book-bus" onClick={() => openBooking(s)}>🎫 Book</button>
                      )}
                      {isAdmin && (
                        <button className="btn-book btn-delete" onClick={() => deleteSched(s.schedule_id)}>🗑️ Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}

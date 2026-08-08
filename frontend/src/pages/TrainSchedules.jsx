import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT_BOOK = { schedule_id: '', coach_number: '', seat_number: '', payment_status: 'Pending' };
const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function TrainSchedules() {
  const { isAdmin, authFetch } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [trains, setTrains]       = useState([]);
  const [routes, setRoutes]       = useState([]);
  const [locos, setLocos]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');
  const [bookingFor, setBookingFor] = useState(null);
  const [bookForm, setBookForm]   = useState(INIT_BOOK);
  const [bookMsg, setBookMsg]     = useState('');
  const [bookErr, setBookErr]     = useState('');
  const INIT_SCHED = { train_id: '', route_id: '', loco_id: '', departure_time: '', arrival_time: '', fare: '', platform_no: '1' };
  const [schedForm, setSchedForm] = useState(INIT_SCHED);
  const [schedMsg, setSchedMsg]   = useState('');
  const [schedErr, setSchedErr]   = useState('');

  const fetchAll = () => {
    setLoading(true);
    const p = [fetch(`${API}/train-schedules`).then(r => r.json())];
    if (isAdmin) {
      p.push(fetch(`${API}/trains`).then(r => r.json()));
      p.push(fetch(`${API}/routes`).then(r => r.json()));
      p.push(authFetch(`${API}/train-drivers`).then(r => r.json()));
    }
    Promise.all(p).then(([s, t, r, l]) => {
      setSchedules(Array.isArray(s) ? s : []);
      if (isAdmin) { setTrains(t || []); setRoutes(r || []); setLocos(l || []); }
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
    if (!bookForm.coach_number || !bookForm.seat_number) { setBookErr('Coach and seat number are required'); return; }
    const res  = await authFetch(`${API}/train-bookings`, { method: 'POST', body: JSON.stringify(bookForm) });
    const data = await res.json();
    if (!res.ok) { setBookErr(data.error || 'Booking failed'); return; }
    setBookMsg(`✅ ${data.message} (Booking #${data.booking_id})`);
    setBookingFor(null); fetchAll();
  };

  const submitSched = async (e) => {
    e.preventDefault(); setSchedMsg(''); setSchedErr('');
    const res  = await authFetch(`${API}/train-schedules`, { method: 'POST', body: JSON.stringify({
      ...schedForm, train_id: +schedForm.train_id, route_id: +schedForm.route_id,
      loco_id: +schedForm.loco_id, fare: +schedForm.fare, platform_no: +schedForm.platform_no,
    })});
    const data = await res.json();
    if (!res.ok) { setSchedErr(data.error || 'Failed'); return; }
    setSchedMsg(`✅ ${data.message}`); setSchedForm(INIT_SCHED); fetchAll();
  };

  const deleteSched = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    const res  = await authFetch(`${API}/train-schedules/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchAll();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚆 Train Schedules</h1>
        <p>{isAdmin ? 'Manage train schedules and routes' : 'Browse available trains and book your seat'}</p>
      </div>

      {bookMsg && <div className="alert alert-success">{bookMsg}</div>}
      {err     && <div className="alert alert-error">{err}</div>}

      {/* Booking Modal */}
      {bookingFor && (
        <div className="modal-overlay" onClick={() => setBookingFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎟️ Book Train Seat</h3>
              <button className="modal-close" onClick={() => setBookingFor(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                <strong>{bookingFor.train_name}</strong> ({bookingFor.train_number}) — {bookingFor.source_city} → {bookingFor.destination_city}<br />
                <span>🕐 {fmt(bookingFor.departure_time)} &nbsp;|&nbsp; Platform {bookingFor.platform_no} &nbsp;|&nbsp; ₹{Number(bookingFor.fare).toLocaleString('en-IN')}</span>
              </p>
              <form onSubmit={submitBooking}>
                <div className="form-group">
                  <label>Coach Number * (e.g. S1, A2, B3)</label>
                  <input type="text" placeholder="e.g. S1" maxLength={5}
                    value={bookForm.coach_number} onChange={e => setBookForm(p => ({ ...p, coach_number: e.target.value.toUpperCase() }))} />
                </div>
                <div className="form-group">
                  <label>Seat Number * (1 – {bookingFor.seats_per_coach})</label>
                  <input type="number" min="1" max={bookingFor.seats_per_coach} placeholder="e.g. 23"
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
          <div className="card-title">➕ Add New Train Schedule</div>
          <form onSubmit={submitSched}>
            <div className="form-grid">
              <div className="form-group">
                <label>Train *</label>
                <select value={schedForm.train_id} onChange={e => setSchedForm(p => ({ ...p, train_id: e.target.value }))}>
                  <option value="">Select Train</option>
                  {trains.filter(t => t.status === 'Active').map(t => <option key={t.train_id} value={t.train_id}>{t.train_number} – {t.train_name}</option>)}
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
                <label>Loco Pilot *</label>
                <select value={schedForm.loco_id} onChange={e => setSchedForm(p => ({ ...p, loco_id: e.target.value }))}>
                  <option value="">Select Loco Pilot</option>
                  {locos.map(l => <option key={l.loco_id} value={l.loco_id}>{l.name} ({l.employee_id})</option>)}
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
                <input type="number" min="1" placeholder="850" value={schedForm.fare} onChange={e => setSchedForm(p => ({ ...p, fare: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Platform No.</label>
                <input type="number" min="1" max="20" placeholder="1" value={schedForm.platform_no} onChange={e => setSchedForm(p => ({ ...p, platform_no: e.target.value }))} />
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
        <div className="card-title">🚆 Available Train Schedules ({schedules.length})</div>
        {loading ? <div className="loading-text">Loading schedules…</div> :
          schedules.length === 0 ? <div className="empty-text">No train schedules found</div> :
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Train</th><th>Route</th><th>Loco Pilot</th>
                  <th>Departure</th><th>Arrival</th><th>Fare</th>
                  <th>Platform</th><th>Seats</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.schedule_id}>
                    <td>{s.schedule_id}</td>
                    <td>
                      <strong>{s.train_name}</strong><br />
                      <span className="badge badge-train">{s.train_type}</span>
                    </td>
                    <td>{s.source_city} → {s.destination_city}<br /><small>{s.distance_km} km</small></td>
                    <td style={{ fontSize: '0.82rem' }}>{s.loco_name}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.departure_time)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.arrival_time)}</td>
                    <td><strong className="fare">₹{Number(s.fare).toLocaleString('en-IN')}</strong></td>
                    <td><span className="badge badge-info">Plat. {s.platform_no}</span></td>
                    <td>
                      <span className={`badge ${s.available_seats > 50 ? 'badge-success' : s.available_seats > 0 ? 'badge-warning' : 'badge-danger'}`}>
                        {s.available_seats > 0 ? s.available_seats : 'Full'}
                      </span>
                    </td>
                    <td>
                      {!isAdmin && s.available_seats > 0 && (
                        <button className="btn-book btn-book-train" onClick={() => openBooking(s)}>🎟️ Book</button>
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

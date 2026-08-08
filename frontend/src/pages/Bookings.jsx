import React, { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';
const INITIAL = { passenger_id: '', schedule_id: '', booking_date: '', seat_number: '', payment_status: 'Pending' };

export default function Bookings() {
  const [bookings, setBookings]   = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm]           = useState(INITIAL);
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');
  const [loading, setLoading]     = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/bookings`).then(r => r.json()),
      fetch(`${API}/passengers`).then(r => r.json()),
      fetch(`${API}/schedules`).then(r => r.json()),
    ]).then(([b, p, s]) => {
      setBookings(b); setPassengers(p); setSchedules(s); setLoading(false);
    }).catch(() => { setErr('Failed to load data'); setLoading(false); });
  };

  useEffect(() => { fetchAll(); }, []);
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setMsg(''); setErr('');
    const { passenger_id, schedule_id, booking_date, seat_number } = form;
    if (!passenger_id || !schedule_id || !booking_date || !seat_number) {
      setErr('All fields are required'); return;
    }
    if (Number(seat_number) < 1) { setErr('Seat number must be ≥ 1'); return; }
    try {
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, passenger_id: +passenger_id, schedule_id: +schedule_id, seat_number: +seat_number }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed'); return; }
      setMsg(`✅ ${data.message}`); setForm(INITIAL); fetchAll();
    } catch { setErr('Network error'); }
  };

  const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  return (
    <div>
      <div className="page-header">
        <h1>🎫 Bookings</h1>
        <p>Manage passenger seat reservations</p>
      </div>

      <div className="card">
        <div className="card-title">Create New Booking</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Passenger *</label>
              <select name="passenger_id" value={form.passenger_id} onChange={handleChange}>
                <option value="">Select Passenger</option>
                {passengers.map(p => <option key={p.passenger_id} value={p.passenger_id}>{p.name} ({p.phone})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Schedule *</label>
              <select name="schedule_id" value={form.schedule_id} onChange={handleChange}>
                <option value="">Select Schedule</option>
                {schedules.map(s => (
                  <option key={s.schedule_id} value={s.schedule_id}>
                    {s.bus_number} | {s.source_city}→{s.destination_city} | {fmt(s.departure_time)} | ₹{s.fare}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Booking Date *</label>
              <input name="booking_date" type="date" value={form.booking_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Seat Number *</label>
              <input name="seat_number" type="number" min="1" placeholder="12" value={form.seat_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select name="payment_status" value={form.payment_status} onChange={handleChange}>
                <option>Pending</option><option>Paid</option>
              </select>
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Create Booking</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Bookings ({bookings.length})</div>
        {loading ? <div className="loading-text">Loading...</div> :
          bookings.length === 0 ? <div className="empty-text">No bookings found</div> :
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Passenger</th><th>Bus</th><th>Route</th>
                  <th>Departure</th><th>Fare</th><th>Seat</th>
                  <th>Booked On</th><th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.booking_id}>
                    <td>{b.booking_id}</td>
                    <td>
                      <strong>{b.passenger_name}</strong>
                      <br/><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{b.passenger_email}</span>
                    </td>
                    <td>{b.bus_number}</td>
                    <td style={{ fontSize: '0.82rem' }}>{b.source_city} → {b.destination_city}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(b.departure_time)}</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(b.fare).toLocaleString('en-IN')}</span></td>
                    <td><span className="badge badge-info">#{b.seat_number}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN') : '-'}</td>
                    <td>
                      <span className={`badge ${b.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {b.payment_status}
                      </span>
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

import React, { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';
const INITIAL = { bus_id: '', route_id: '', driver_id: '', departure_time: '', arrival_time: '', fare: '' };

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses]         = useState([]);
  const [routes, setRoutes]       = useState([]);
  const [drivers, setDrivers]     = useState([]);
  const [form, setForm]           = useState(INITIAL);
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');
  const [loading, setLoading]     = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/schedules`).then(r => r.json()),
      fetch(`${API}/buses`).then(r => r.json()),
      fetch(`${API}/routes`).then(r => r.json()),
      fetch(`${API}/drivers`).then(r => r.json()),
    ]).then(([s, b, r, d]) => {
      setSchedules(s); setBuses(b); setRoutes(r); setDrivers(d); setLoading(false);
    }).catch(() => { setErr('Failed to load data'); setLoading(false); });
  };

  useEffect(() => { fetchAll(); }, []);
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setMsg(''); setErr('');
    const { bus_id, route_id, driver_id, departure_time, arrival_time, fare } = form;
    if (!bus_id || !route_id || !driver_id || !departure_time || !arrival_time || !fare) {
      setErr('All fields are required'); return;
    }
    if (new Date(arrival_time) <= new Date(departure_time)) {
      setErr('Arrival time must be after departure time'); return;
    }
    try {
      const res = await fetch(`${API}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bus_id: +bus_id, route_id: +route_id, driver_id: +driver_id, departure_time, arrival_time, fare: +fare }),
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
        <h1>🗓️ Schedules</h1>
        <p>Plan and view bus schedules on all routes</p>
      </div>

      <div className="card">
        <div className="card-title">Add New Schedule</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Bus *</label>
              <select name="bus_id" value={form.bus_id} onChange={handleChange}>
                <option value="">Select Bus</option>
                {buses.filter(b => b.status === 'Active').map(b =>
                  <option key={b.bus_id} value={b.bus_id}>{b.bus_number} ({b.bus_type})</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Route *</label>
              <select name="route_id" value={form.route_id} onChange={handleChange}>
                <option value="">Select Route</option>
                {routes.map(r =>
                  <option key={r.route_id} value={r.route_id}>{r.source_city} → {r.destination_city} ({r.distance_km} km)</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Driver *</label>
              <select name="driver_id" value={form.driver_id} onChange={handleChange}>
                <option value="">Select Driver</option>
                {drivers.map(d =>
                  <option key={d.driver_id} value={d.driver_id}>{d.name}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Departure Time *</label>
              <input name="departure_time" type="datetime-local" value={form.departure_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Arrival Time *</label>
              <input name="arrival_time" type="datetime-local" value={form.arrival_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Fare (₹) *</label>
              <input name="fare" type="number" min="1" placeholder="450" value={form.fare} onChange={handleChange} />
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Add Schedule</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Schedules ({schedules.length})</div>
        {loading ? <div className="loading-text">Loading...</div> :
          schedules.length === 0 ? <div className="empty-text">No schedules found</div> :
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Bus</th><th>Route</th><th>Driver</th>
                  <th>Departure</th><th>Arrival</th><th>Fare</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.schedule_id}>
                    <td>{s.schedule_id}</td>
                    <td>
                      <strong>{s.bus_number}</strong>
                      <br/><span className="badge badge-info" style={{ marginTop: 4 }}>{s.bus_type}</span>
                    </td>
                    <td>{s.source_city} → {s.destination_city}<br/><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s.distance_km} km</span></td>
                    <td>{s.driver_name}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.departure_time)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{fmt(s.arrival_time)}</td>
                    <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{Number(s.fare).toLocaleString('en-IN')}</span></td>
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

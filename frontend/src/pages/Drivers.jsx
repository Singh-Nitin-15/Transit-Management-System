import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT = { name: '', license_number: '', phone: '', experience_years: '' };

export default function BusDrivers() {
  const { authFetch } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(INIT);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDrivers = () => {
    setLoading(true);
    authFetch(`${API}/bus-drivers`).then(r => r.json()).then(d => { setDrivers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setErr('Failed to load drivers'); setLoading(false); });
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!form.name || !form.license_number || !form.phone || !form.experience_years) { setErr('All fields are required'); return; }
    const res = await authFetch(`${API}/bus-drivers`, { method: 'POST', body: JSON.stringify({ ...form, experience_years: +form.experience_years }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed'); return; }
    setMsg('✅ ' + data.message); setForm(INIT); fetchDrivers();
  };

  const deleteDriver = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    const res = await authFetch(`${API}/bus-drivers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to delete'); return; }
    setMsg('✅ ' + data.message); fetchDrivers();
  };

  const expBadge = y => {
    if (y >= 15) return <span className="badge badge-success">{y} yrs</span>;
    if (y >= 8) return <span className="badge badge-info">{y} yrs</span>;
    return <span className="badge badge-muted">{y} yrs</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>👨‍✈️ Bus Drivers</h1>
        <p>Manage bus drivers and their licenses</p>
      </div>

      <div className="card">
        <div className="card-title">➕ Add New Bus Driver</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input placeholder="Rajesh Kumar" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>License Number *</label>
              <input placeholder="MH-0120230012345" value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input placeholder="9823001234" maxLength={10} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Experience (years) *</label>
              <input type="number" min="0" placeholder="10" value={form.experience_years} onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} />
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Add Driver</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">👨‍✈️ All Bus Drivers ({drivers.length})</div>
        {loading ? <div className="loading-text">Loading…</div> :
          drivers.length === 0 ? <div className="empty-text">No bus drivers found</div> :
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>License No.</th><th>Phone</th><th>Experience</th><th>Action</th></tr></thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.driver_id}>
                      <td>{d.driver_id}</td>
                      <td><strong>{d.name}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{d.license_number}</td>
                      <td>{d.phone}</td>
                      <td>{expBadge(d.experience_years)}</td>
                      <td>
                        <button className="btn-action btn-del" onClick={() => deleteDriver(d.driver_id)}>🗑️ Delete</button>
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

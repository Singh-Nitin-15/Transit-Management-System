import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT = { name: '', employee_id: '', phone: '', experience_years: '' };

export default function TrainDrivers() {
  const { authFetch } = useAuth();
  const [locos, setLocos] = useState([]);
  const [form, setForm] = useState(INIT);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLocos = () => {
    setLoading(true);
    authFetch(`${API}/train-drivers`).then(r => r.json()).then(d => { setLocos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setErr('Failed to load loco pilots'); setLoading(false); });
  };

  useEffect(() => { fetchLocos(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!form.name || !form.employee_id || !form.phone || !form.experience_years) { setErr('All fields are required'); return; }
    const res = await authFetch(`${API}/train-drivers`, { method: 'POST', body: JSON.stringify({ ...form, experience_years: +form.experience_years }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed'); return; }
    setMsg('✅ ' + data.message); setForm(INIT); fetchLocos();
  };

  const deleteLoco = async (id) => {
    if (!window.confirm('Delete this loco pilot?')) return;
    const res = await authFetch(`${API}/train-drivers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to delete'); return; }
    setMsg('✅ ' + data.message); fetchLocos();
  };

  const expBadge = y => {
    if (y >= 20) return <span className="badge badge-success">{y} yrs</span>;
    if (y >= 12) return <span className="badge badge-info">{y} yrs</span>;
    return <span className="badge badge-muted">{y} yrs</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚆 Loco Pilots</h1>
        <p>Manage train loco pilots and employees</p>
      </div>

      <div className="card">
        <div className="card-title">➕ Add New Loco Pilot</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input placeholder="Harish Chandra" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Employee ID *</label>
              <input placeholder="LP-2024-0011" value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input placeholder="9700001111" maxLength={10} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Experience (years) *</label>
              <input type="number" min="0" placeholder="15" value={form.experience_years} onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} />
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Add Loco Pilot</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">🚆 All Loco Pilots ({locos.length})</div>
        {loading ? <div className="loading-text">Loading…</div> :
          locos.length === 0 ? <div className="empty-text">No loco pilots found</div> :
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Employee ID</th><th>Phone</th><th>Experience</th><th>Action</th></tr></thead>
                <tbody>
                  {locos.map(l => (
                    <tr key={l.loco_id}>
                      <td>{l.loco_id}</td>
                      <td><strong>{l.name}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.employee_id}</td>
                      <td>{l.phone}</td>
                      <td>{expBadge(l.experience_years)}</td>
                      <td>
                        <button className="btn-action btn-del" onClick={() => deleteLoco(l.loco_id)}>🗑️ Delete</button>
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

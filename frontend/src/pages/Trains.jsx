import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT = { train_number: '', train_name: '', train_type: 'Express', total_coaches: '12', seats_per_coach: '72', status: 'Active' };

export default function Trains() {
  const { authFetch } = useAuth();
  const [trains, setTrains] = useState([]);
  const [form, setForm] = useState(INIT);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTrains = () => {
    setLoading(true);
    fetch(`${API}/trains`).then(r => r.json()).then(d => { setTrains(d); setLoading(false); })
      .catch(() => { setErr('Failed to load trains'); setLoading(false); });
  };

  useEffect(() => { fetchTrains(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!form.train_number || !form.train_name || !form.train_type) { setErr('Train number, name and type are required'); return; }
    const res = await authFetch(`${API}/trains`, { method: 'POST', body: JSON.stringify({ ...form, total_coaches: +form.total_coaches, seats_per_coach: +form.seats_per_coach }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed'); return; }
    setMsg('✅ ' + data.message); setForm(INIT); fetchTrains();
  };

  const toggleStatus = async (train) => {
    const newStatus = train.status === 'Active' ? 'Inactive' : 'Active';
    const res = await authFetch(`${API}/trains/${train.train_id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to update'); return; }
    fetchTrains();
  };

  const deleteTrain = async (id) => {
    if (!window.confirm('Delete this train?')) return;
    const res = await authFetch(`${API}/trains/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to delete'); return; }
    setMsg('✅ ' + data.message); fetchTrains();
  };

  const typeBadgeClass = (t) => {
    if (t === 'Rajdhani' || t === 'Shatabdi') return 'badge-success';
    if (t === 'Superfast') return 'badge-warning';
    return 'badge-train';
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚆 Manage Trains</h1>
        <p>Add, update and remove trains from the fleet</p>
      </div>

      <div className="card">
        <div className="card-title">➕ Add New Train</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Train Number *</label>
              <input placeholder="12951" value={form.train_number} onChange={e => setForm(p => ({ ...p, train_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Train Name *</label>
              <input placeholder="Mumbai Rajdhani" value={form.train_name} onChange={e => setForm(p => ({ ...p, train_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Train Type *</label>
              <select value={form.train_type} onChange={e => setForm(p => ({ ...p, train_type: e.target.value }))}>
                <option>Express</option><option>Passenger</option><option>Superfast</option><option>Rajdhani</option><option>Shatabdi</option>
              </select>
            </div>
            <div className="form-group">
              <label>Total Coaches</label>
              <input type="number" min="1" placeholder="12" value={form.total_coaches} onChange={e => setForm(p => ({ ...p, total_coaches: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Seats Per Coach</label>
              <input type="number" min="1" placeholder="72" value={form.seats_per_coach} onChange={e => setForm(p => ({ ...p, seats_per_coach: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Add Train</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">🚆 Train Fleet ({trains.length} trains)</div>
        {loading ? <div className="loading-text">Loading…</div> :
          trains.length === 0 ? <div className="empty-text">No trains found</div> :
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Number</th><th>Name</th><th>Type</th><th>Coaches</th><th>Seats/Coach</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {trains.map(t => (
                    <tr key={t.train_id}>
                      <td>{t.train_id}</td>
                      <td><strong>{t.train_number}</strong></td>
                      <td>{t.train_name}</td>
                      <td><span className={`badge ${typeBadgeClass(t.train_type)}`}>{t.train_type}</span></td>
                      <td>{t.total_coaches}</td>
                      <td>{t.seats_per_coach}</td>
                      <td><span className={`badge ${t.status === 'Active' ? 'badge-success' : 'badge-muted'}`}>{t.status}</span></td>
                      <td className="action-cell">
                        <button className="btn-action btn-toggle" onClick={() => toggleStatus(t)}>
                          {t.status === 'Active' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                        <button className="btn-action btn-del" onClick={() => deleteTrain(t.train_id)}>🗑️ Delete</button>
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

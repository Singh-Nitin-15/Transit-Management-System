import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const INIT = { bus_number: '', bus_type: 'AC', capacity: '', status: 'Active' };

export default function Buses() {
  const { authFetch } = useAuth();
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState(INIT);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBuses = () => {
    setLoading(true);
    fetch(`${API}/buses`).then(r => r.json()).then(d => { setBuses(d); setLoading(false); })
      .catch(() => { setErr('Failed to load buses'); setLoading(false); });
  };

  useEffect(() => { fetchBuses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!form.bus_number || !form.capacity) { setErr('Bus number and capacity are required'); return; }
    const res = await authFetch(`${API}/buses`, { method: 'POST', body: JSON.stringify({ ...form, capacity: Number(form.capacity) }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed'); return; }
    setMsg('✅ ' + data.message); setForm(INIT); fetchBuses();
  };

  const toggleStatus = async (bus) => {
    const newStatus = bus.status === 'Active' ? 'Inactive' : 'Active';
    const res = await authFetch(`${API}/buses/${bus.bus_id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to update'); return; }
    fetchBuses();
  };

  const deleteBus = async (id) => {
    if (!window.confirm('Delete this bus?')) return;
    const res = await authFetch(`${API}/buses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to delete'); return; }
    setMsg('✅ ' + data.message); fetchBuses();
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚌 Manage Buses</h1>
        <p>Add, update and remove buses from the fleet</p>
      </div>

      <div className="card">
        <div className="card-title">➕ Add New Bus</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Bus Number *</label>
              <input name="bus_number" placeholder="MH-12-AB-1234" value={form.bus_number} onChange={e => setForm(p => ({ ...p, bus_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Bus Type *</label>
              <select value={form.bus_type} onChange={e => setForm(p => ({ ...p, bus_type: e.target.value }))}>
                <option>AC</option><option>Non-AC</option><option>Sleeper</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity (seats) *</label>
              <input type="number" min="1" placeholder="45" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
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
          <button className="btn btn-primary" type="submit">➕ Add Bus</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">🚌 Fleet ({buses.length} buses)</div>
        {loading ? <div className="loading-text">Loading…</div> :
          buses.length === 0 ? <div className="empty-text">No buses found</div> :
            <div className="table-wrapper">
              <table>
                <thead><tr><th>#</th><th>Bus Number</th><th>Type</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {buses.map(b => (
                    <tr key={b.bus_id}>
                      <td>{b.bus_id}</td>
                      <td><strong>{b.bus_number}</strong></td>
                      <td><span className="badge badge-bus">{b.bus_type}</span></td>
                      <td>{b.capacity} seats</td>
                      <td><span className={`badge ${b.status === 'Active' ? 'badge-success' : 'badge-muted'}`}>{b.status}</span></td>
                      <td className="action-cell">
                        <button className="btn-action btn-toggle" onClick={() => toggleStatus(b)}>
                          {b.status === 'Active' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                        <button className="btn-action btn-del" onClick={() => deleteBus(b.bus_id)}>🗑️ Delete</button>
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

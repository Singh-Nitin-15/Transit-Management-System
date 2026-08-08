import React, { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';
const INITIAL = { name: '', email: '', phone: '' };

export default function Passengers() {
  const [passengers, setPassengers] = useState([]);
  const [form, setForm]             = useState(INITIAL);
  const [msg, setMsg]               = useState('');
  const [err, setErr]               = useState('');
  const [loading, setLoading]       = useState(true);

  const fetchPassengers = () => {
    setLoading(true);
    fetch(`${API}/passengers`)
      .then(r => r.json())
      .then(data => { setPassengers(data); setLoading(false); })
      .catch(() => { setErr('Failed to load passengers'); setLoading(false); });
  };

  useEffect(() => { fetchPassengers(); }, []);
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setMsg(''); setErr('');
    if (!form.name || !form.email || !form.phone) { setErr('All fields are required'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setErr('Enter a valid email address'); return; }
    try {
      const res = await fetch(`${API}/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed'); return; }
      setMsg(`✅ ${data.message}`); setForm(INITIAL); fetchPassengers();
    } catch { setErr('Network error'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>👥 Passengers</h1>
        <p>Manage registered passengers</p>
      </div>

      <div className="card">
        <div className="card-title">Add New Passenger</div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" placeholder="Priya Sharma" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" placeholder="priya@gmail.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input name="phone" placeholder="9000111001" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-primary" type="submit">➕ Add Passenger</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Passengers ({passengers.length})</div>
        {loading ? <div className="loading-text">Loading...</div> :
          passengers.length === 0 ? <div className="empty-text">No passengers found</div> :
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th></tr>
              </thead>
              <tbody>
                {passengers.map(p => (
                  <tr key={p.passenger_id}>
                    <td>{p.passenger_id}</td>
                    <td><strong>{p.name}</strong></td>
                    <td style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{p.email}</td>
                    <td>{p.phone}</td>
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

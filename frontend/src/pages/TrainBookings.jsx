import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';
const fmt = dt => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function TrainBookings() {
  const { isAdmin, authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [msg, setMsg]           = useState('');

  const fetchBookings = () => {
    setLoading(true);
    authFetch(`${API}/train-bookings`)
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setErr('Failed to load bookings'); setLoading(false); });
  };

  useEffect(() => { fetchBookings(); }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setMsg(''); setErr('');
    const res  = await authFetch(`${API}/train-bookings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Failed to cancel'); return; }
    setMsg('✅ ' + data.message);
    fetchBookings();
  };

  const confirmed = bookings.filter(b => b.status === 'Confirmed');
  const cancelled = bookings.filter(b => b.status === 'Cancelled');

  return (
    <div>
      <div className="page-header">
        <h1>🎟️ Train Bookings</h1>
        <p>{isAdmin ? 'All train bookings in the system' : 'Your train seat bookings'}</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {loading ? <div className="loading-text">Loading bookings…</div> : (
        <>
          <div className="card">
            <div className="card-title">✅ Active Bookings ({confirmed.length})</div>
            {confirmed.length === 0 ? <div className="empty-text">No active train bookings</div> : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      {isAdmin && <th>Passenger</th>}
                      <th>Train</th><th>Route</th><th>Departure</th>
                      <th>Fare</th><th>Coach</th><th>Seat</th>
                      <th>Platform</th><th>Payment</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmed.map(b => (
                      <tr key={b.booking_id}>
                        <td>#{b.booking_id}</td>
                        {isAdmin && <td><strong>{b.passenger_name}</strong><br /><small>{b.passenger_email}</small></td>}
                        <td>
                          <strong>{b.train_name}</strong><br />
                          <span className="badge badge-train">{b.train_type}</span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{b.source_city} → {b.destination_city}</td>
                        <td style={{ fontSize: '0.82rem' }}>{fmt(b.departure_time)}</td>
                        <td><strong className="fare">₹{Number(b.fare).toLocaleString('en-IN')}</strong></td>
                        <td><span className="badge badge-info">{b.coach_number}</span></td>
                        <td><span className="badge badge-info">Seat {b.seat_number}</span></td>
                        <td><span className="badge badge-muted">Plat. {b.platform_no}</span></td>
                        <td><span className={`badge ${b.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{b.payment_status}</span></td>
                        <td>
                          <button className="btn-book btn-cancel" onClick={() => cancelBooking(b.booking_id)}>❌ Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {cancelled.length > 0 && (
            <div className="card">
              <div className="card-title">🚫 Cancelled Bookings ({cancelled.length})</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      {isAdmin && <th>Passenger</th>}
                      <th>Train</th><th>Route</th><th>Coach</th><th>Seat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelled.map(b => (
                      <tr key={b.booking_id} style={{ opacity: 0.5 }}>
                        <td>#{b.booking_id}</td>
                        {isAdmin && <td>{b.passenger_name}</td>}
                        <td>{b.train_name}</td>
                        <td style={{ fontSize: '0.82rem' }}>{b.source_city} → {b.destination_city}</td>
                        <td>{b.coach_number}</td>
                        <td>Seat {b.seat_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

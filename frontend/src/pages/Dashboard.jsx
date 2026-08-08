import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function Dashboard() {
  const { user, isAdmin, authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`${API}/dashboard`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setError('Could not connect to the API. Ensure the backend is running on port 5000.'));
  }, []);

  const adminCards = stats ? [
    { label: 'Active Buses', value: stats.buses, icon: '🚌', color: 'blue' },
    { label: 'Active Trains', value: stats.trains, icon: '🚆', color: 'purple' },
    { label: 'Total Routes', value: stats.routes, icon: '🗺️', color: 'teal' },
    { label: 'Bus Schedules', value: stats.busSchedules, icon: '🗓️', color: 'orange' },
    { label: 'Train Schedules', value: stats.trainSchedules, icon: '📋', color: 'pink' },
    { label: 'Bus Bookings', value: stats.busBookings, icon: '🎫', color: 'green' },
    { label: 'Train Bookings', value: stats.trainBookings, icon: '🎟️', color: 'red' },
  ] : [];

  const userCards = stats ? [
    { label: 'Available Buses', value: stats.buses, icon: '🚌', color: 'blue' },
    { label: 'Available Trains', value: stats.trains, icon: '🚆', color: 'purple' },
    { label: 'Total Routes', value: stats.routes, icon: '🗺️', color: 'teal' },
    { label: 'Bus Schedules', value: stats.busSchedules, icon: '🗓️', color: 'orange' },
    { label: 'Train Schedules', value: stats.trainSchedules, icon: '📋', color: 'pink' },
    { label: 'My Bus Bookings', value: stats.busBookings, icon: '🎫', color: 'green' },
    { label: 'My Train Bookings', value: stats.trainBookings, icon: '🎟️', color: 'red' },
  ] : [];

  const cards = isAdmin ? adminCards : userCards;

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Welcome, <strong>{user?.name}</strong>! Here's your travel overview</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        {stats ? cards.map(card => (
          <div className={`stat-card stat-${card.color}`} key={card.label}>
            <span className="stat-icon">{card.icon}</span>
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        )) : [...Array(7)].map((_, i) => (
          <div className="stat-card stat-skeleton" key={i}>
            <div className="skeleton-line" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div className="skeleton-line" style={{ width: 60, height: 32, marginTop: 8 }} />
            <div className="skeleton-line" style={{ width: 100, height: 14, marginTop: 6 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">🚀 Quick Info</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>
          Welcome to the <strong style={{ color: 'var(--accent-bus)' }}>Public Transport Management System</strong>.
          Browse available schedules and book your seat on buses and trains.
        </p>
        <ul className="quick-links">
          {!isAdmin && <>
            <li>Browse <Link to="/bus/schedules"><strong>Bus Schedules</strong></Link> and <Link to="/train/schedules"><strong>Train Schedules</strong></Link></li>
            <li>Book seats on <Link to="/bus/bookings"><strong>Bus Bookings</strong></Link> and <Link to="/train/bookings"><strong>Train Bookings</strong></Link></li>
            <li>View <strong>Coaches</strong> to check seat availability</li>
            <li>Manage your bookings — <strong>cancel anytime</strong></li>
          </>}
          {isAdmin && <>
            <li>Manage <Link to="/admin/buses"><strong>Buses</strong></Link> and <Link to="/admin/trains"><strong>Trains</strong></Link> fleet</li>
            <li>Manage <Link to="/admin/bus-drivers"><strong>Bus Drivers</strong></Link> and <Link to="/admin/train-drivers"><strong>Loco Pilots</strong></Link></li>
            <li>Create <Link to="/bus/schedules"><strong>Bus Schedules</strong></Link> and <Link to="/train/schedules"><strong>Train Schedules</strong></Link></li>
            <li>View all <Link to="/bus/bookings"><strong>Bus Bookings</strong></Link> and <Link to="/train/bookings"><strong>Train Bookings</strong></Link></li>
            <li>Bulk upload data via <Link to="/admin/import"><strong>Import CSV</strong></Link></li>
          </>}
        </ul>
      </div>
    </div>
  );
}

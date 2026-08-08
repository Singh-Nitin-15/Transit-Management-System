import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [busOpen, setBusOpen]     = useState(false);
  const [trainOpen, setTrainOpen] = useState(false);
  const [time, setTime]           = useState(new Date());
  const busRef   = useRef(null);
  const trainRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (busRef.current   && !busRef.current.contains(e.target))   setBusOpen(false);
      if (trainRef.current && !trainRef.current.contains(e.target)) setTrainOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const busLinks = isAdmin
    ? [
        { to: '/bus/schedules', label: '🗓️ Bus Schedules' },
        { to: '/bus/bookings',  label: '🎫 All Bus Bookings' },
        { to: '/admin/buses',   label: '🚌 Manage Buses' },
        { to: '/admin/bus-drivers', label: '👨‍✈️ Bus Drivers' },
      ]
    : [
        { to: '/bus/schedules', label: '🗓️ Browse Schedules' },
        { to: '/bus/bookings',  label: '🎫 My Bus Bookings' },
      ];

  const trainLinks = isAdmin
    ? [
        { to: '/train/schedules', label: '🗓️ Train Schedules' },
        { to: '/train/bookings',  label: '🎫 All Train Bookings' },
        { to: '/admin/trains',    label: '🚆 Manage Trains' },
        { to: '/admin/train-drivers', label: '👨‍✈️ Loco Pilots' },
      ]
    : [
        { to: '/train/schedules', label: '🗓️ Browse Schedules' },
        { to: '/train/bookings',  label: '🎫 My Train Bookings' },
      ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🚉</span>
          <div>
            <div className="brand-name">TransitMgmt</div>
            <div className="brand-sub">Public Transport v2.0</div>
          </div>
        </NavLink>
      </div>

      <div className="navbar-center">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          📊 Dashboard
        </NavLink>

        {/* Bus Dropdown */}
        <div className="nav-dropdown" ref={busRef}>
          <button
            className={'nav-link dropdown-trigger' + (busOpen ? ' active' : '')}
            onClick={() => { setBusOpen(o => !o); setTrainOpen(false); }}
          >
            🚌 Bus <span className="caret">{busOpen ? '▲' : '▼'}</span>
          </button>
          {busOpen && (
            <div className="dropdown-menu">
              {busLinks.map(l => (
                <NavLink key={l.to} to={l.to} className="dropdown-item" onClick={() => setBusOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Train Dropdown */}
        <div className="nav-dropdown" ref={trainRef}>
          <button
            className={'nav-link dropdown-trigger' + (trainOpen ? ' active' : '')}
            onClick={() => { setTrainOpen(o => !o); setBusOpen(false); }}
          >
            🚆 Train <span className="caret">{trainOpen ? '▲' : '▼'}</span>
          </button>
          {trainOpen && (
            <div className="dropdown-menu">
              {trainLinks.map(l => (
                <NavLink key={l.to} to={l.to} className="dropdown-item" onClick={() => setTrainOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <NavLink to="/admin/import" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            📥 Import
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/invites" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            🔑 Invites
          </NavLink>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-time">
          <div className="time-display">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="date-display">{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        <div className="navbar-user">
          <span className="user-avatar">{user?.name?.[0]?.toUpperCase()}</span>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className={`user-role ${isAdmin ? 'role-admin' : 'role-user'}`}>{isAdmin ? 'Admin' : 'User'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>⏻ Logout</button>
      </div>
    </nav>
  );
}

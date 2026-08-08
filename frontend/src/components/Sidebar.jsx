import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/buses', icon: '🚌', label: 'Buses' },
  { to: '/schedules', icon: '🗓️', label: 'Schedules' },
  { to: '/bookings', icon: '🎫', label: 'Bookings' },
  { to: '/drivers', icon: '👨‍✈️', label: 'Drivers' },
  { to: '/passengers', icon: '👥', label: 'Passengers' },
  { to: '/import', icon: '📥', label: 'Import Data' },
];

export default function Sidebar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🚍</span>
        <div>
          <div className="sidebar-logo-name">BusMgmt</div>
          <div className="sidebar-logo-sub">System v1.0</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-time">
          {time.toLocaleTimeString('en-IN')}
        </div>
        <div className="sidebar-date">
          {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </aside>
  );
}

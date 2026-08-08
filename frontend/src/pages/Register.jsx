import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [isAdminReg, setIsAdminReg] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name || !form.email || !form.password) { setErr('All fields are required'); return; }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
    if (isAdminReg && !inviteToken.trim()) { setErr('Please enter your invite token'); return; }
    setLoading(true);
    try {
      const body = { name: form.name, email: form.email, password: form.password };
      if (isAdminReg) body.inviteToken = inviteToken.trim();

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Registration failed'); return; }
      login(data.token, data.user);
      navigate('/');
    } catch { setErr('Network error. Make sure the backend is running.'); }
    finally { setLoading(false); }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleAdminToggle = (e) => {
    setIsAdminReg(e.target.checked);
    if (!e.target.checked) { setInviteToken(''); setShowToken(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🚉</span>
          <h1>TransitMgmt</h1>
          <p>Public Transport Management System</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        {err && <div className="alert alert-error">{err}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Priya Sharma" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="priya@gmail.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
          </div>

          {/* Admin Registration Toggle */}
          <div className="admin-register-toggle">
            <label className="admin-toggle-label" htmlFor="adminToggle">
              <input
                id="adminToggle"
                type="checkbox"
                checked={isAdminReg}
                onChange={handleAdminToggle}
                className="admin-toggle-checkbox"
              />
              <span className="admin-toggle-text">
                <span className="admin-toggle-icon">🔑</span>
                Register as Administrator
              </span>
            </label>
          </div>

          {/* Invite Token Field */}
          {isAdminReg && (
            <div className="form-group admin-key-field">
              <label>
                Admin Invite Token
                <span className="admin-key-hint"> (sent to you by an admin)</span>
              </label>
              <div className="admin-key-input-wrap">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Paste your invite token…"
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  className="admin-key-input"
                  id="inviteTokenInput"
                />
                <button
                  type="button"
                  className="admin-key-toggle-btn"
                  onClick={() => setShowToken(s => !s)}
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="admin-key-info">
                ⚠️ The token is tied to <strong>your exact email</strong> — it won't work for any other address and can only be used once.
              </p>
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading
              ? '⏳ Creating account…'
              : isAdminReg
                ? '🛡️ Create Admin Account'
                : '✅ Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

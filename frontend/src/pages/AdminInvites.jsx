import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending',  cls: 'badge-pending'  },
    used:    { label: 'Used',     cls: 'badge-used'     },
    expired: { label: 'Expired',  cls: 'badge-expired'  },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`invite-badge ${cls}`}>{label}</span>;
}

export default function AdminInvites() {
  const { token, isSuperAdmin } = useAuth();
  const [email, setEmail]       = useState('');
  const [invites, setInvites]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [generating, setGen]    = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [copied, setCopied]     = useState(false);
  const [err, setErr]           = useState('');
  const [msg, setMsg]           = useState('');

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin-invites`, { headers: authHeader });
      const data = await res.json();
      if (res.ok) setInvites(data);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErr(''); setMsg(''); setNewToken(null);
    if (!email.trim()) { setErr('Please enter an email address'); return; }
    setGen(true);
    try {
      const res  = await fetch(`${API}/admin-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to generate invite'); return; }
      setNewToken(data.invite);
      setEmail('');
      fetchInvites();
    } finally { setGen(false); }
  };

  const handleCopy = () => {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this invite? The token will no longer be usable.')) return;
    try {
      const res  = await fetch(`${API}/admin-invites/${id}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Revoke failed'); return; }
      setMsg('Invite revoked.');
      fetchInvites();
    } catch { alert('Network error'); }
  };

  const fmt = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div>
      <div className="page-header">
        <h1>🔑 Admin Invite Tokens</h1>
        <p>
          {isSuperAdmin
            ? 'Generate single-use, email-bound tokens to grant admin access to specific people.'
            : 'View all admin invite tokens. Only the super admin can generate or revoke them.'}
        </p>
      </div>

      {/* ── Generate Section (super admin only) ─────────────── */}
      {isSuperAdmin ? (
        <div className="card">
          <div className="card-title">Generate New Invite</div>

          {err && <div className="alert alert-error" style={{ marginBottom: 16 }}>{err}</div>}
          {msg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}

          <form onSubmit={handleGenerate} className="invite-generate-form">
            <div className="invite-email-wrap">
              <input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="invite-email-input"
                id="inviteEmailInput"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={generating}
                id="generateInviteBtn"
              >
                {generating ? '⏳ Generating…' : '✉️ Generate Invite'}
              </button>
            </div>
            <p className="invite-generate-hint">
              The token is tied to this exact email — it won't work for any other address.
              It expires in <strong>48 hours</strong>.
            </p>
          </form>

          {/* Token reveal box */}
          {newToken && (
            <div className="invite-token-reveal">
              <div className="invite-token-reveal-header">
                <span>✅ Invite generated for <strong>{newToken.email}</strong></span>
                <span className="invite-token-expiry">Expires: {fmt(newToken.expires_at)}</span>
              </div>
              <div className="invite-token-box">
                <code className="invite-token-value">{newToken.token}</code>
                <button
                  className={`invite-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  id="copyTokenBtn"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="invite-token-warning">
                ⚠️ Share this token <strong>privately</strong> with {newToken.email} only.
                It works for their email address and burns after one use.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Read-only notice for regular admins */
        <div className="card invite-readonly-notice">
          <span className="invite-readonly-icon">🔒</span>
          <div>
            <strong>Read-only access</strong>
            <p>You can see all invite history below, but only the <strong>super admin</strong> can generate or revoke tokens.</p>
          </div>
        </div>
      )}

      {/* ── Invites Table (all admins can see) ─────────────── */}
      <div className="card">
        <div className="card-title">
          All Invites
          <button
            className="btn btn-sm btn-ghost"
            onClick={fetchInvites}
            style={{ marginLeft: 12, fontSize: '0.8rem' }}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : invites.length === 0 ? (
          <div className="invite-empty">
            <span>🔑</span>
            <p>No invites yet{isSuperAdmin ? '. Generate one above.' : '.'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Token (partial)</th>
                  <th>Expires</th>
                  <th>Created By</th>
                  <th>Created</th>
                  {isSuperAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => (
                  <tr key={inv.invite_id}>
                    <td><strong>{inv.email}</strong></td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <code className="invite-token-partial">
                        {inv.token.slice(0, 12)}…
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {fmt(inv.expires_at)}
                    </td>
                    <td>{inv.created_by_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {fmt(inv.created_at)}
                    </td>
                    {isSuperAdmin && (
                      <td>
                        {inv.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRevoke(inv.invite_id)}
                          >
                            🗑️ Revoke
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const importConfigs = [
  { key: 'buses', label: 'Buses', icon: '🚌', endpoint: 'buses',
    sample: 'bus_number,bus_type,capacity,status\nMH-12-AB-5555,AC,45,Active', desc: 'Import bus fleet records' },
  { key: 'trains', label: 'Trains', icon: '🚆', endpoint: 'trains',
    sample: 'train_number,train_name,train_type,total_coaches,seats_per_coach,status\n12955,Jaipur SF,Superfast,16,72,Active', desc: 'Import train fleet records' },
  { key: 'bus-drivers', label: 'Bus Drivers', icon: '👨‍✈️', endpoint: 'bus-drivers',
    sample: 'name,license_number,phone,experience_years\nAnil Kumar,MH-0120230054321,9800001111,10', desc: 'Import bus driver records' },
  { key: 'train-drivers', label: 'Loco Pilots', icon: '🚆', endpoint: 'train-drivers',
    sample: 'name,employee_id,phone,experience_years\nVijay Rao,LP-2024-0011,9800002222,14', desc: 'Import loco pilot records' },
  { key: 'routes', label: 'Routes', icon: '🗺️', endpoint: 'routes',
    sample: 'source_city_id,destination_city_id,distance_km\n1,3,300\n5,8,450', desc: 'Import routes (use City IDs 1–10)' },
];

function ImportCard({ config }) {
  const { authFetch } = useAuth();
  const [file, setFile] = useState(null);
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) { setErr('Please select a CSV file'); return; }
    if (!file.name.endsWith('.csv')) { setErr('Only .csv files are supported'); return; }
    setUploading(true); setMsg(''); setErr('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res  = await authFetch(`${API}/import/${config.endpoint}`, { method: 'POST', headers: {}, body: fd });
      const data = await res.json();
      if (!res.ok) setErr(data.error || 'Upload failed');
      else setMsg(`✅ Imported ${data.rows_inserted} row(s) (${data.rows_parsed} parsed)`);
    } catch { setErr('Network error'); }
    setUploading(false);
  };

  return (
    <div className="import-card">
      <h3>{config.icon} {config.label}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 8 }}>{config.desc}</p>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>📋 Sample CSV:</div>
      <pre className="sample-format">{config.sample}</pre>
      <div className="file-upload-area">
        <label className="file-input-label" htmlFor={`file-${config.key}`}>
          📂 {file ? file.name : 'Choose CSV file'}
        </label>
        <input id={`file-${config.key}`} type="file" accept=".csv" onChange={e => { setFile(e.target.files[0]); setMsg(''); setErr(''); }} />
        <button className="btn btn-primary" style={{ marginTop: 0 }} onClick={handleUpload} disabled={uploading}>
          {uploading ? '⏳ Uploading…' : '⬆️ Upload'}
        </button>
      </div>
      {msg && <div className="alert alert-success" style={{ marginTop: 10 }}>{msg}</div>}
      {err && <div className="alert alert-error"  style={{ marginTop: 10 }}>{err}</div>}
    </div>
  );
}

export default function ImportData() {
  return (
    <div>
      <div className="page-header">
        <h1>📥 Import Data</h1>
        <p>Bulk upload records via CSV — Admin only</p>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">⚠️ Import Guidelines</div>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: 20, lineHeight: '2' }}>
          <li>File must be <strong>.csv</strong> with headers exactly matching the sample</li>
          <li>Duplicate records (same unique key) will be <strong>silently skipped</strong></li>
          <li>For Routes, use <strong>City IDs</strong> (1–10 for the 10 pre-loaded cities)</li>
          <li>Phone numbers must be <strong>10 digits</strong></li>
        </ul>
      </div>
      <div className="import-grid">
        {importConfigs.map(cfg => <ImportCard key={cfg.key} config={cfg} />)}
      </div>
    </div>
  );
}

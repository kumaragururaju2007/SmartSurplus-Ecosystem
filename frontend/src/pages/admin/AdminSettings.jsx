import React, { useState } from 'react';
import { 
  Settings, Shield, Database, Lock, User, 
  CheckCircle2, Bell, Cpu, Save, KeyRound
} from 'lucide-react';
import '../../styles/dashboard.css';

export default function AdminSettings({ user, token, onLogout }) {
  const [adminName, setAdminName] = useState(user?.name || 'Platform Administrator');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@gmail.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
          SYSTEM CONFIGURATION & SECURITY
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
          Admin Platform Settings ⚙️
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Configure administrative controls, system health monitors, and security privileges.
        </p>
      </div>

      {savedSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.85rem 1.25rem', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> Settings successfully updated.
        </div>
      )}

      {/* Admin Profile Section */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="#16a34a" /> Administrator Identity & Credentials
        </h3>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                Administrator Name:
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                Admin Email:
              </label>
              <input
                type="email"
                value={adminEmail}
                readOnly
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.9rem', color: '#6b7280' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
              <Save size={16} /> Save Admin Settings
            </button>
          </div>
        </form>
      </div>

      {/* System Health Diagnostics */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="#0284c7" /> Ecosystem Infrastructure Status
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '700' }}>DATABASE ENGINE</div>
            <strong style={{ fontSize: '1.05rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <CheckCircle2 size={16} /> SmartSurplus Active
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>
              Relational DB schema active
            </span>
          </div>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '700' }}>SOCKET.IO REAL-TIME ENGINE</div>
            <strong style={{ fontSize: '1.05rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <CheckCircle2 size={16} /> WebSocket Active
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>
              Live transit broadcast channel
            </span>
          </div>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '700' }}>LEAFLET GEOSPATIAL MAPS</div>
            <strong style={{ fontSize: '1.05rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <CheckCircle2 size={16} /> OpenStreetMap Tile Engine
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>
              Zero external API key dependencies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

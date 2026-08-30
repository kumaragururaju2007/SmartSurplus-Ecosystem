import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateNGOSettings } from '../services/ngoAPI';
import { Settings, ShieldCheck, BellRing, Eye, LogOut, CheckCircle2, Save } from 'lucide-react';
import '../styles/dashboard.css';

export default function NGOSettings({ user, token, onLogout }) {
  const [msg, setMsg] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [publicVisibility, setPublicVisibility] = useState(true);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await updateNGOSettings({
      emailAlerts,
      smsAlerts,
      inAppAlerts,
      publicVisibility
    }, token);

    if (res.success) {
      setMsg('Settings & Notification Preferences saved successfully.');
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '900', color: '#0f172a' }}>⚙️ NGO Portal Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
          Manage account security, notification alerts, and organization matching parameters.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '14px', marginBottom: '1.5rem', fontWeight: '800', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.6rem', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={20} /> {msg}
        </div>
      )}

      <form onSubmit={handleSave}>
        
        {/* ACCOUNT DETAILS */}
        <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} color="#16a34a" /> Account Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Account Holder</label>
              <input
                type="text"
                value={user?.name || 'NGO Organization'}
                disabled
                className="input-field"
                style={{ background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label className="input-label">Registered Email</label>
              <input
                type="email"
                value={user?.email || 'ngo@example.com'}
                disabled
                className="input-field"
                style={{ background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }}
              />
            </div>

            <div>
              <label className="input-label">System Role</label>
              <input
                type="text"
                value={user?.role || 'NGO'}
                disabled
                className="input-field"
                style={{ background: '#f8fafc', color: '#15803d', fontWeight: '800', cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATION PREFERENCES */}
        <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BellRing size={20} color="#0284c7" /> Notification Preferences
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.92rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Receive Email Alerts when a donor initiates a surplus food offer</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>Upcoming</span>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.92rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Receive Urgent SMS Notifications for high-priority food offers</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>Upcoming</span>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.92rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
              />
              <span>Show In-App Realtime Popups & Bell Badges</span>
            </label>
          </div>
        </div>

        {/* ORGANIZATION VISIBILITY */}
        <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '1.75rem', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Eye size={20} color="#7e22ce" /> Matching & Visibility
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.92rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={publicVisibility}
              onChange={(e) => setPublicVisibility(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#16a34a' }}
            />
            <span>Make NGO Shelter active & available for Smart Engine automated matching</span>
          </label>
        </div>

        {/* ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="btn-secondary"
            style={{ borderColor: '#ef4444', color: '#dc2626', padding: '0.75rem 1.4rem', borderRadius: '12px', fontWeight: '800' }}
          >
            <LogOut size={18} /> Logout Account
          </button>

          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', fontWeight: '800' }}>
            <Save size={18} /> Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
}

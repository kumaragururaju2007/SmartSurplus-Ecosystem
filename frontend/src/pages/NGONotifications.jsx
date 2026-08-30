import React, { useState, useEffect } from 'react';
import { getNGONotifications, markNotificationAsRead } from '../services/ngoAPI';
import { Bell, Check, CheckCheck, Clock, ShieldCheck } from 'lucide-react';
import '../styles/dashboard.css';

export default function NGONotifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getNGONotifications(token);
      if (res.success) setNotifications(res.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleMarkRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => Number(n.id) === Number(id) ? { ...n, is_read: true } : n));
    window.dispatchEvent(new Event('notifications_updated'));
    try {
      const res = await markNotificationAsRead(id, token);
      if (res.success) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    window.dispatchEvent(new Event('notifications_updated'));
    try {
      const res = await markNotificationAsRead('all', token);
      if (res.success) {
        fetchNotifications();
      }
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>🔔 NGO Notification Center</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Real-time alerts for available food surplus, donor matches, and pickup schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleMarkAllRead} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', background: 'white' }}>
          <Bell size={48} color="#9ca3af" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ color: '#6b7280', margin: 0 }}>No notifications present.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="glass-card"
              style={{
                background: n.is_read ? 'white' : '#f0fdf4',
                padding: '1.15rem 1.25rem',
                borderRadius: '14px',
                border: n.is_read ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: n.is_read ? '#f3f4f6' : '#dcfce7',
                  color: n.is_read ? '#6b7280' : '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={18} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#111827', margin: 0 }}>{n.title}</h4>
                    {!n.is_read && (
                      <span style={{ background: '#15803d', color: 'white', fontSize: '0.68rem', fontWeight: '800', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0.25rem 0 0.35rem' }}>{n.message}</p>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(n.created_at || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  style={{ background: 'transparent', border: 'none', color: '#15803d', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Check size={14} /> Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

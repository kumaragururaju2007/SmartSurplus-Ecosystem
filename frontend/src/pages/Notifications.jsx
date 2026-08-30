import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationAPI';
import '../styles/notifications.css';

export default function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await getNotifications(token);
      if (res.success) setNotifications(res.notifications);
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
    setNotifications(prev => prev.map(n => Number(n.id) === Number(id) ? { ...n, is_read: true } : n));
    window.dispatchEvent(new Event('notifications_updated'));
    try {
      const res = await markAsRead(id, token);
      if (res.success) fetchNotifications();
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    window.dispatchEvent(new Event('notifications_updated'));
    try {
      const res = await markAllAsRead(token);
      if (res.success) fetchNotifications();
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0' || n.is_read === false).length;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              NOTIFICATION CENTER
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={24} color="#16a34a" /> Notifications History
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <CheckCheck size={16} /> Mark All as Read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280', marginTop: '1.5rem' }}>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
            No notifications in history.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            {notifications.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  background: item.is_read ? '#f9fafb' : '#f0fdf4', 
                  border: `1px solid ${item.is_read ? '#e5e7eb' : '#bbf7d0'}`, 
                  padding: '1rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: item.type === 'SMS' ? '#d97706' : '#15803d', background: item.type === 'SMS' ? '#fffbe6' : '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {item.type || 'IN_APP'}
                    </span>
                    {item.priority && item.priority !== 'Normal' && (
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: item.priority === 'Urgent' ? '#dc2626' : '#d97706', background: item.priority === 'Urgent' ? '#fee2e2' : '#fef3c7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {item.priority}
                      </span>
                    )}
                    <strong style={{ fontSize: '0.98rem', color: '#111827' }}>{item.title}</strong>
                    {!item.is_read && (
                      <span style={{ background: '#16a34a', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }} title="Unread" />
                    )}
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#374151', marginTop: '0.3rem', lineHeight: '1.4' }}>
                    {item.message}
                  </p>

                  {item.action_route && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <a
                        href={item.action_route}
                        className="btn-primary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                      >
                        {item.action_label || 'View Details'} →
                      </a>
                    </div>
                  )}

                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
                    <Clock size={12} /> {new Date(item.created_at || Date.now()).toLocaleString()}
                  </span>
                </div>

                {!item.is_read && (
                  <button 
                    onClick={() => handleMarkRead(item.id)} 
                    style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: '0.2rem' }}
                    title="Mark Read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

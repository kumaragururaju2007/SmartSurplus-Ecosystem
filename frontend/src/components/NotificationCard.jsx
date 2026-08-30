import React from 'react';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import '../styles/notifications.css';

export default function NotificationCard({ notification, onMarkRead }) {
  if (!notification) return null;

  return (
    <div className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ background: '#f0fdf4', padding: '0.4rem', borderRadius: '8px', color: '#16a34a' }}>
            <Bell size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{notification.title}</h4>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>{notification.message}</p>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.4rem' }}>
              <Clock size={12} /> {new Date(notification.created_at || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {!notification.is_read && onMarkRead && (
          <button 
            onClick={() => onMarkRead(notification.notification_id)}
            style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer' }}
            title="Mark Read"
          >
            <CheckCircle2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

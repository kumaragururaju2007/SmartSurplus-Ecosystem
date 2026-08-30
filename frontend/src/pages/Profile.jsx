import React from 'react';
import { User, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export default function Profile({ user }) {
  if (!user) return <p>Please login to view profile.</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{user.name}</h1>
            <span className="badge badge-posted">{user.role}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', color: '#374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Mail size={18} color="#16a34a" />
            <span><strong>Email:</strong> {user.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Phone size={18} color="#16a34a" />
            <span><strong>Phone:</strong> {user.phone || '+919876543210'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={18} color="#16a34a" />
            <span><strong>Verification Status:</strong> Verified Active Organization</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Award, Zap, ShieldCheck, Heart } from 'lucide-react';

export default function ImpactCard({ title, value, unit, icon: Icon, color = '#16a34a' }) {
  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {Icon ? <Icon size={26} /> : <Award size={26} />}
      </div>
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6b7280' }}>{title}</span>
        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', lineHeight: '1.2' }}>
          {value} <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

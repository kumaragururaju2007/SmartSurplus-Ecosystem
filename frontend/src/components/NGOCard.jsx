import React from 'react';
import { ShieldCheck, MapPin, Star, Truck } from 'lucide-react';

export default function NGOCard({ ngo, matchScore }) {
  if (!ngo) return null;

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid #16a34a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{ngo.organization_name}</h3>
            {ngo.is_verified && <ShieldCheck size={18} color="#16a34a" title="Verified NGO" />}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
            <MapPin size={14} /> {ngo.address}
          </p>
        </div>
        {matchScore && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.3rem 0.6rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#166534', display: 'block' }}>SMART SCORE</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d' }}>{matchScore}/100</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', fontSize: '0.85rem', color: '#374151' }}>
        <div><strong>Capacity:</strong> {ngo.food_capacity_kg || 150} kg</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Star size={14} color="#eab308" fill="#eab308" />
          <span><strong>Rating:</strong> {ngo.response_rating || 4.8}/5.0</span>
        </div>
      </div>
    </div>
  );
}

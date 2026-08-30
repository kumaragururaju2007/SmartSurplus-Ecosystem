import React from 'react';
import { Utensils, MapPin, ArrowRight, XCircle } from 'lucide-react';
import Timer from './Timer';

export default function DonationCard({ donation, onViewDetails, onCancel, onMatch }) {
  if (!donation) return null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            {donation.food_category}
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.3rem', color: '#111827' }}>
            {donation.food_name}
          </h3>
        </div>
        <span className={`badge badge-${donation.status ? donation.status.toLowerCase() : 'posted'}`}>
          {donation.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', color: '#4b5563' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Utensils size={16} color="#16a34a" />
          <span><strong>{donation.quantity}</strong> {donation.quantity_unit || 'Meals'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#6b7280' }}>
        <MapPin size={15} color="#0ea5e9" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {donation.pickup_address || 'Location not specified'}
        </span>
      </div>

      <div style={{ marginTop: '0.2rem' }}>
        <Timer safeUntil={donation.safe_until} status={donation.status} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(donation.id)} 
            className="btn-secondary" 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            View Details <ArrowRight size={14} />
          </button>
        )}

        {donation.status === 'POSTED' && onMatch && (
          <button 
            onClick={() => onMatch(donation.id)} 
            className="btn-primary" 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            Find Best NGO
          </button>
        )}

        {donation.status === 'POSTED' && onCancel && (
          <button 
            onClick={() => onCancel(donation.id)} 
            className="btn-secondary" 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }}
            title="Cancel Listing"
          >
            <XCircle size={15} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Utensils, Clock, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import Timer from './Timer';
import VerifiedDonorBadge from './VerifiedDonorBadge';

export default function FoodCard({ donation, onViewDetails, onAction, actionText }) {
  if (!donation) return null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            {donation.category}
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.3rem', color: '#111827' }}>
            {donation.food_name}
          </h3>
        </div>
        <span className={`badge badge-${donation.status ? donation.status.toLowerCase() : 'posted'}`}>
          {donation.status === 'POSTED' ? 'Posted / Finding Match' : donation.status === 'ACCEPTED' ? 'Match Confirmed' : donation.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', color: '#4b5563' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Utensils size={16} color="#16a34a" />
          <span><strong>{donation.quantity_kg || donation.quantity || 0} kg</strong> ({donation.servings || Math.round((parseFloat(donation.quantity_kg || donation.quantity || 0)) * 2.5) || 20} servings)</span>
        </div>
      </div>

      {donation.donor_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#374151', flexWrap: 'wrap' }}>
          <span>Donor: <strong>{donation.donor_name}</strong></span>
          <VerifiedDonorBadge isVerified={donation.is_donor_verified || donation.is_verified} compact={true} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#6b7280' }}>
        <MapPin size={15} color="#0ea5e9" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {donation.address || donation.pickup_address || 'Location not specified'}
        </span>
      </div>

      <div style={{ marginTop: '0.2rem' }}>
        <Timer safeUntil={donation.safe_until || donation.safe_expiry_time || donation.expires_at} status={donation.status} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(donation.donation_id)} 
            className="btn-secondary" 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            Details <ArrowRight size={14} />
          </button>
        )}
        {onAction && actionText && (
          <button 
            onClick={() => onAction(donation.donation_id)} 
            className="btn-primary" 
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}

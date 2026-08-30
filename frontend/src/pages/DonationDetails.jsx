import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Utensils, MapPin, Clock, ArrowLeft, ShieldCheck, XCircle } from 'lucide-react';
import { getDonationById, cancelDonation } from '../services/donationAPI';
import Timer from '../components/Timer';
import Map from '../components/Map';
import DonorProfileCard from '../components/DonorProfileCard';

export default function DonationDetails({ token }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const authToken = token || localStorage.getItem('smartsurplus_token');

  const fetchDetails = async () => {
    try {
      const res = await getDonationById(id, authToken);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Donation not found.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, authToken]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this surplus donation?')) return;
    try {
      const res = await cancelDonation(id, authToken);
      if (res.success) {
        alert('Donation cancelled successfully.');
        fetchDetails();
      } else {
        alert(res.message || 'Could not cancel donation.');
      }
    } catch (err) {
      alert('Error cancelling donation.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
        <p>Loading donation details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h2 style={{ color: '#ef4444' }}>{error || 'Donation not found'}</h2>
        <Link to="/donor/donations" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          &larr; Back to My Donations
        </Link>
      </div>
    );
  }

  const { donation, match } = data;

  const STATUSES = ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  const currentIdx = STATUSES.indexOf(donation.status);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/donor/donations" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to My Donations
        </Link>
      </div>

      <div className="glass-card">
        {donation.image_url && (
          <img 
            src={donation.image_url} 
            alt={donation.food_name} 
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.25rem' }} 
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              {donation.food_category}
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.4rem', color: '#111827' }}>
              {donation.food_name}
            </h1>
          </div>
          <span className={`badge badge-${donation.status ? donation.status.toLowerCase() : 'posted'}`}>
            {donation.status}
          </span>
        </div>

        {/* Visual Status Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0', background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          {STATUSES.map((st, idx) => {
            const isCurrent = donation.status === st;
            const isPassed = currentIdx >= idx && currentIdx !== -1;
            return (
              <div key={st} style={{ textAlign: 'center', flex: 1 }}>
                <span style={{ fontSize: '1.2rem', display: 'block' }}>
                  {isPassed ? '🟢' : '⚪'}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? '#16a34a' : '#6b7280' }}>
                  {st}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Quantity</span>
            <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{donation.quantity} {donation.quantity_unit || 'Meals'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Preparation Time</span>
            <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{new Date(donation.preparation_time).toLocaleString()}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Safe Until Timer</span>
            <Timer safeUntil={donation.safe_until} status={donation.status} />
          </div>
        </div>

        {/* Read-Only Viewing Map (Section 12) */}
        <div style={{ marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <MapPin size={16} color="#16a34a" /> 📍 Pickup Location Coordinates
          </span>
          <Map 
            donorLat={donation.latitude} 
            donorLng={donation.longitude} 
            destLat={match?.latitude} 
            destLng={match?.longitude} 
            destType="NGO" 
            height="320px" 
          />
          <p style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '0.5rem' }}>
            <strong>Address:</strong> {donation.pickup_address} (Lat: {donation.latitude}, Lng: {donation.longitude})
          </p>
        </div>

        {donation.description && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151' }}>Storage & Food Description:</h4>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0.2rem' }}>{donation.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          {donation.status === 'POSTED' && (
            <>
              <button onClick={() => navigate(`/donor/matching/${donation.id}`)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Find Best NGO Match
              </button>
              <button onClick={handleCancel} className="btn-secondary" style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                <XCircle size={16} /> Cancel Listing
              </button>
            </>
          )}

          {donation.status === 'MATCHED' && (
            <button onClick={() => navigate(`/donor/matching/${donation.id}`)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              View NGO Match Details
            </button>
          )}
        </div>
      </div>

      {/* DONOR TRUST CARD (If viewing as NGO or inspecting origin) */}
      {(data?.donor || donation.donor) && (
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.75rem' }}>
            🛡️ Verified Food Donor Origin Profile
          </h3>
          <DonorProfileCard donor={data?.donor || donation.donor} showDetailedTable={true} />
        </div>
      )}

      {/* Matched NGO Box */}
      {match && (
        <div className="glass-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a' }}>MATCHED NGO</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{match.organization_name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{match.ngo_address}</p>
            </div>
            <div style={{ background: '#f0fdf4', padding: '0.5rem 0.8rem', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#15803d' }}>{match.match_score}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

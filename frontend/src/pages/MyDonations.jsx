import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, MapPin, Clock, ArrowRight, XCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getMyDonations, cancelDonation } from '../services/donationAPI';
import '../styles/dashboard.css';

export default function MyDonations({ user, token }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchDonations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getMyDonations(token);
      if (res.success) {
        setDonations(res.donations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [token]);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this food donation?')) {
      try {
        const res = await cancelDonation(id, token);
        if (res.success) {
          alert('Donation cancelled successfully.');
          fetchDonations();
        } else {
          alert(res.message || 'Could not cancel donation.');
        }
      } catch (err) {
        alert('Error cancelling donation.');
      }
    }
  };

  // Filter & Search Logic
  const filteredDonations = donations.filter((item) => {
    const matchesSearch = 
      (item.food_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.food_category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).includes(searchTerm);

    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ACTIVE') return ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_READY', 'PICKUP_STARTED', 'IN_TRANSIT', 'REDIRECTED_TO_BIOGAS'].includes(item.status);
    if (selectedFilter === 'POSTED') return item.status === 'POSTED';
    if (selectedFilter === 'ACCEPTED') return item.status === 'ACCEPTED' || item.status === 'MATCHED';
    if (selectedFilter === 'COMPLETED') return item.status === 'COLLECTED' || item.status === 'COMPLETED' || item.status === 'DELIVERED';
    if (selectedFilter === 'CANCELLED') return item.status === 'CANCELLED';

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'POSTED':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>Posted / Finding Match</span>;
      case 'MATCHED':
      case 'ACCEPTED':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>NGO Matched</span>;
      case 'PICKUP_READY':
      case 'PICKUP_STARTED':
      case 'IN_TRANSIT':
        return <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>Pickup / In Transit</span>;
      case 'REDIRECTED_TO_BIOGAS':
        return <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>⚡ Redirected to Biogas</span>;
      case 'EXPIRED':
        return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>⏰ Expired & Routed to Biogas</span>;
      case 'COLLECTED':
      case 'COMPLETED':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>Collected</span>;
      case 'CANCELLED':
        return <span style={{ background: '#fee222', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>Cancelled</span>;
      default:
        return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>{status}</span>;
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Page Header */}
      <div className="dashboard-header" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>My Donations 🍱</h1>
          <p className="dashboard-subtitle" style={{ color: '#6b7280', fontSize: '0.92rem' }}>
            Track, filter, and manage all your food surplus donations.
          </p>
        </div>
        <Link to="/donor/create-donation" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={18} /> Donate Surplus Food
        </Link>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="glass-card" style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.75rem', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search donations by food name, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'ACTIVE', 'POSTED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: selectedFilter === tab ? '#15803d' : '#e5e7eb',
                  background: selectedFilter === tab ? '#15803d' : 'white',
                  color: selectedFilter === tab ? 'white' : '#4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'ALL' ? 'All Donations' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Donation List / Table View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading your donation history...</div>
      ) : filteredDonations.length === 0 ? (
        <div className="glass-card" style={{ background: 'white', textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ width: '54px', height: '54px', background: '#f0fdf4', borderRadius: '50%', color: '#16a34a', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 1rem' }}>
            <Calendar size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>No donations found</h3>
          <p style={{ color: '#6b7280', maxWidth: '420px', margin: '0.5rem auto 1.5rem', fontSize: '0.9rem' }}>
            {searchTerm || selectedFilter !== 'ALL' 
              ? 'No donations match your current search or filter options.'
              : 'Your donated food will appear here once you create your first surplus food donation.'}
          </p>
          <Link to="/donor/create-donation" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={16} /> Donate Food Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredDonations.map((d) => (
            <div 
              key={d.id} 
              className="glass-card" 
              style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
            >
              <div style={{ flex: '1 1 280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                    #DON-{d.id}
                  </span>
                  {getStatusBadge(d.status)}
                </div>
                
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0.2rem 0' }}>
                  {d.food_name}
                </h3>
                
                <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>
                  <strong>Category:</strong> {d.food_category} &bull; <strong>Food Donated:</strong> {d.quantity} kg
                  {d.quantity_received !== null && d.quantity_received !== undefined && (
                    <span style={{ color: '#15803d', fontWeight: '700' }}> (Received: {d.quantity_received} kg)</span>
                  )}
                  {d.recipient_name && (
                    <span> &bull; <strong>Recipient:</strong> {d.recipient_name}</span>
                  )}
                </p>

                {d.people_served && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      👥 {d.people_served_type === 'ACTUAL' ? `${d.people_served} People Served (Verified Actual Count)` : `~${d.people_served} People Served`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                      ✓ Impact Confirmed
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
                  <span>📍 {d.pickup_address || 'Pickup Location'}</span>
                  <span>⏱️ Safe Until: {d.safe_until ? new Date(d.safe_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => navigate(`/donor/donation/${d.id}`)}
                  className="btn-secondary" 
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.83rem' }}
                >
                  View Details
                </button>

                {d.status === 'PICKUP_STARTED' && (
                  <button 
                    onClick={() => navigate(`/tracking/${d.id}`)}
                    className="btn-primary" 
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.83rem', background: '#ca8a04', borderColor: '#ca8a04', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    🤝 Confirm Handover
                  </button>
                )}

                {d.status !== 'CANCELLED' && (
                  <button 
                    onClick={() => navigate(`/tracking/${d.id}`)}
                    className="btn-primary" 
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.83rem', background: '#0284c7', borderColor: '#0284c7' }}
                  >
                    Track Live
                  </button>
                )}

                {d.status === 'POSTED' && (
                  <button 
                    onClick={() => handleCancel(d.id)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.83rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

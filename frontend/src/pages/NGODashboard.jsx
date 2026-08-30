import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Handshake,
  Package,
  CheckCircle2,
  Users,
  Utensils,
  Leaf,
  ArrowRight,
  Check,
  X,
  MapPin,
  Clock,
  Activity,
  Truck,
  Navigation,
  Sparkles,
  Award
} from 'lucide-react';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import DonationReceivedModal from '../components/DonationReceivedModal';
import { getDashboardSummary, acceptDonation, rejectDonation, updateIncomingStatus as updateDonationStatus } from '../services/ngoAPI';
import '../styles/dashboard.css';

export default function NGODashboard({ user, token }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState(null);

  const fetchSummary = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getDashboardSummary(token);
      if (res.success) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching NGO dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token]);

  const handleAccept = async (id) => {
    setActionMsg('');
    // Optimistically update dashboard pending requests list
    setSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingRequestsCount: Math.max(0, (prev.pendingRequestsCount || 1) - 1),
        newIncomingRequests: (prev.newIncomingRequests || []).filter(r => Number(r.donation_id) !== Number(id) && Number(r.match_id) !== Number(id))
      };
    });
    try {
      const res = await acceptDonation(id, token);
      if (res.success) {
        setActionMsg(`✓ Donation request #${id} ACCEPTED! Match confirmed and live route tracking activated.`);
        fetchSummary();
      } else {
        setActionMsg(res.message || 'Failed to accept donation request.');
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
      fetchSummary();
    }
  };

  const handleReject = async (id) => {
    setActionMsg('');
    // Optimistically update dashboard pending requests list
    setSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingRequestsCount: Math.max(0, (prev.pendingRequestsCount || 1) - 1),
        newIncomingRequests: (prev.newIncomingRequests || []).filter(r => Number(r.donation_id) !== Number(id) && Number(r.match_id) !== Number(id))
      };
    });
    try {
      const res = await rejectDonation(id, token);
      if (res.success) {
        setActionMsg(`Donation request #${id} declined.`);
        fetchSummary();
      } else {
        setActionMsg(res.message || 'Failed to decline request.');
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
      fetchSummary();
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setActionMsg('');
    setActionLoading(true);
    try {
      const res = await updateDonationStatus(id, newStatus, token);
      if (res.success) {
        setActionMsg(`Donation #${id} updated to ${newStatus.replace(/_/g, ' ')}!`);
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = summary || {
    organizationName: user?.name || 'NGO Organization',
    pendingRequestsCount: 0,
    activeMatchesCount: 0,
    incomingDonationsCount: 0,
    totalDonationsReceived: 0,
    beneficiariesServed: 0,
    foodItemsDistributed: 0,
    wastePreventedKg: 0,
    newIncomingRequests: [],
    activeDeliveries: [],
    recentActivity: []
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. WELCOME HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
        color: 'white',
        padding: '2rem 2.25rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(21, 128, 61, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', letterSpacing: '0.5px' }}>
              NGO MANAGEMENT PORTAL
            </span>
            <VerifiedBadge type="NGO" isVerified={Boolean(user?.is_verified)} />
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: '900', marginTop: '0.5rem', color: 'white' }}>
            Welcome back, {user?.name || stats.organizationName} 🏠
          </h1>
          <p style={{ color: '#dcfce7', fontSize: '0.95rem', margin: '0.3rem 0 0', opacity: 0.9 }}>
            Overview of donor-initiated requests, active in-transit pickups, and community food redistribution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/ngo/incoming-requests" className="btn-primary" style={{ background: 'white', color: '#15803d', border: 'none', fontWeight: '800', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
            <Inbox size={18} /> Incoming Requests ({stats.pendingRequestsCount})
          </Link>
          <Link to="/ngo/incoming-donations" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: '700' }}>
            Active Pipeline ({stats.incomingDonationsCount})
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
          ✓ {actionMsg}
        </div>
      )}

      {/* 2. OVERVIEW METRIC CARDS */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={20} color="#15803d" /> Activity & Human Impact Overview
      </h2>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* PEOPLE BENEFITED KPI */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac' }}>
          <div className="stat-icon-wrapper" style={{ background: '#15803d', color: '#ffffff' }}><Users size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: '#14532d', fontSize: '1.8rem', fontWeight: '900' }}>
              {loading ? '...' : (stats.peopleBenefited || stats.beneficiariesServed || 0).toLocaleString()}
            </div>
            <div className="stat-label" style={{ fontWeight: '800', color: '#15803d' }}>People Benefited</div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px', fontWeight: '600' }}>
              Approx. people benefited through your NGO
            </div>
          </div>
        </div>

        {/* TOTAL FOOD RECEIVED */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}><Utensils size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : `${stats.totalFoodReceivedKg || stats.foodItemsDistributed || 0} kg`}</div>
            <div className="stat-label">Food Received</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Verified total weight received</div>
          </div>
        </div>

        {/* DONATIONS RECEIVED */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#faf5ff', color: '#7e22ce' }}><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.totalDonationsReceived}</div>
            <div className="stat-label">Donations Received</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Completed donation deliveries</div>
          </div>
        </div>

        {/* AVG PEOPLE PER DONATION */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#c2410c' }}><Sparkles size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : `~${stats.averagePeoplePerDonation || 0}`}</div>
            <div className="stat-label">Avg. People / Donation</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Average human impact per drop</div>
          </div>
        </div>

        {/* PENDING REQUESTS */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}><Inbox size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.pendingRequestsCount}</div>
            <div className="stat-label">Pending Requests</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Awaiting your acceptance</div>
          </div>
        </div>

        {/* ACTIVE DELIVERIES PIPELINE */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}><Truck size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.incomingDonationsCount}</div>
            <div className="stat-label">In-Transit Pipeline</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Live pickups in progress</div>
          </div>
        </div>

      </div>

      {/* 3. ACTIVE DELIVERIES & IN-TRANSIT PIPELINE */}
      <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #bae6fd', marginBottom: '2rem', boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} color="#0284c7" /> Active Deliveries & In-Transit Food Surplus
          </h3>
          <Link to="/ngo/incoming-donations" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            Open Pipeline <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading active pipeline...</p>
        ) : (stats.activeDeliveries && stats.activeDeliveries.length > 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.activeDeliveries.map((item) => (
              <div key={item.donation_id || item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      DONATION #{item.donation_id || item.id}
                    </span>
                    <span className={`badge badge-${(item.donation_status || item.status || '').toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
                      {(item.donation_status || item.status || 'ACCEPTED').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827', margin: '0.2rem 0' }}>
                    {item.food_name} ({item.quantity} {item.quantity_unit || 'kg'})
                  </h4>
                  <div style={{ fontSize: '0.83rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <MapPin size={14} color="#16a34a" /> Donor: <strong>{item.donor_name}</strong>
                    <VerifiedDonorBadge isVerified={item.is_donor_verified || item.is_verified} compact={true} />
                    &bull; Pickup: {item.pickup_address}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* CONFIRM RECEIPT & RECORD IMPACT BUTTON */}
                  <button
                    onClick={() => setSelectedDonationForReceipt(item)}
                    style={{
                      fontSize: '0.84rem',
                      padding: '0.55rem 1rem',
                      background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)'
                    }}
                  >
                    <CheckCircle2 size={16} /> Confirm Receipt & Record Impact
                  </button>

                  {(item.donation_status === 'ACCEPTED' || item.status === 'ACCEPTED' || item.donation_status === 'MATCHED' || item.status === 'MATCHED' || item.donation_status === 'OFFERED' || item.status === 'OFFERED') && (
                    <button
                      onClick={() => handleStatusUpdate(item.donation_id || item.id, 'PICKUP_STARTED')}
                      disabled={actionLoading}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '800' }}
                    >
                      <Truck size={15} /> Start Pickup
                    </button>
                  )}

                  <Link
                    to={`/tracking/${item.donation_id || item.id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Navigation size={14} /> Live Route
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No active donations in transit right now. Accept new donor requests below to begin pickup.</p>
          </div>
        )}
      </div>

      {/* 4. TOP DONORS BY PEOPLE SERVED LEADERBOARD */}
      {stats.topDonors && stats.topDonors.length > 0 && (
        <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="#eab308" /> Top Donors by People Served
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
              Ranked by community impact
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {stats.topDonors.slice(0, 4).map((donor, idx) => (
              <div key={donor.donorId || idx} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#fff7ed',
                  color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '1.1rem'
                }}>
                  #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
                    {donor.donorName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {donor.donationsCount} donation{donor.donationsCount > 1 ? 's' : ''} &bull; {donor.foodReceivedKg} kg received
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#15803d' }}>
                    ~{donor.peopleServed.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#16a34a' }}>
                    People Served
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. NEW INCOMING REQUESTS SECTION */}
      <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Inbox size={20} color="#15803d" /> Pending Donor Offers to Accept
          </h3>
          <Link to="/ngo/incoming-requests" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            View All Requests <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading incoming requests...</p>
        ) : (stats.newIncomingRequests && stats.newIncomingRequests.length > 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.newIncomingRequests.map((req) => (
              <div key={req.match_id || req.donation_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      #DON-{req.donation_id}
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#111827' }}>{req.food_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span>Donor: <strong>{req.donor_name}</strong></span>
                    <VerifiedDonorBadge isVerified={req.is_donor_verified || req.is_verified} compact={true} />
                    <span>&bull; Quantity: <strong style={{ color: '#15803d' }}>{req.quantity} {req.quantity_unit || 'kg'}</strong> &bull; Location: {req.pickup_address || 'Chennai'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAccept(req.donation_id || req.match_id)}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Check size={14} /> Accept
                  </button>

                  <button
                    onClick={() => handleReject(req.donation_id || req.match_id)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', borderColor: '#ef4444', color: '#dc2626' }}
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No pending donor requests currently waiting for response.</p>
          </div>
        )}
      </div>

      {/* DONATION RECEIVED & IMPACT MODAL */}
      {selectedDonationForReceipt && (
        <DonationReceivedModal
          donation={selectedDonationForReceipt}
          token={token}
          onClose={() => setSelectedDonationForReceipt(null)}
          onSuccess={(res) => {
            setActionMsg(`✓ Impact confirmed for Donation #${res.impact?.donationId}: ~${res.impact?.peopleServed} people served!`);
            fetchSummary();
          }}
        />
      )}

    </div>
  );
}

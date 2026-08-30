import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncomingRequests, acceptDonation, rejectDonation } from '../services/ngoAPI';
import { 
  Inbox, MapPin, Clock, Check, X, Building2, Phone, Sparkles, 
  ShieldCheck, User, Award, Eye, AlertTriangle, ArrowRight, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import DonorProfileModal from '../components/DonorProfileModal';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function NGOIncomingRequests({ token }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getIncomingRequests(token);
      if (res.success) setRequests(res.requests || []);
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleOpenDonorProfile = (donorInfo) => {
    setSelectedDonor(donorInfo);
    setIsModalOpen(true);
  };

  const handleAccept = async (id) => {
    setMsg('');
    setErrorMsg('');
    setActionLoadingId(id);

    // Optimistically remove from incoming requests view for instant UI response
    const targetItem = requests.find(r => Number(r.donation_id) === Number(id) || Number(r.match_id) === Number(id));
    setRequests(prev => prev.filter(r => Number(r.donation_id) !== Number(id) && Number(r.match_id) !== Number(id)));

    try {
      const res = await acceptDonation(id, token);
      if (res.success) {
        setMsg(`Donation offer #${id} (${targetItem?.food_name || 'Food Offer'}) ACCEPTED! Match confirmed and moved to Matched Donations.`);
        fetchRequests();
      } else {
        setErrorMsg(res.message || 'Failed to accept donation offer.');
        // Re-fetch to restore state if server rejected
        fetchRequests();
      }
    } catch (err) {
      setErrorMsg('Network error while accepting donation. Please try again.');
      fetchRequests();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setMsg('');
    setErrorMsg('');
    setActionLoadingId(id);

    // Optimistically remove from incoming requests view
    setRequests(prev => prev.filter(r => Number(r.donation_id) !== Number(id) && Number(r.match_id) !== Number(id)));

    try {
      const res = await rejectDonation(id, token);
      if (res.success) {
        setMsg(`Donation request #${id} declined.`);
        fetchRequests();
      } else {
        setErrorMsg(res.message || 'Failed to decline donation offer.');
        fetchRequests();
      }
    } catch (err) {
      setErrorMsg('Network error while declining donation. Please try again.');
      fetchRequests();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>📨 Incoming Donation Requests</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Review surplus food offers and check donor verification badges before confirming acceptance.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '12px', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span>{msg}</span>
          </div>
          <Link to="/ngo/matched-donations" className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
            Go to Matched Donations <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading incoming requests...</p>
      ) : requests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'white', border: '1px solid #e5e7eb' }}>
          <Inbox size={52} color="#9ca3af" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#374151', margin: '0 0 0.4rem' }}>No Pending Donation Offers</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            When a donor submits a new surplus food listing that matches your shelter, the request will appear here for acceptance.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {requests.map((item) => {
            const isVerifiedDonor = Boolean(item.is_donor_verified);
            const isFssaiVerified = Boolean(item.is_fssai_verified);

            return (
              <div key={item.match_id || item.donation_id} className="glass-card" style={{
                background: 'white',
                padding: '1.6rem',
                borderRadius: '16px',
                border: isVerifiedDonor ? '1.5px solid #86efac' : '1px solid #bae6fd',
                boxShadow: isVerifiedDonor ? '0 6px 20px rgba(22, 163, 74, 0.08)' : '0 4px 16px rgba(2, 132, 199, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                
                {/* TOP HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    DONATION #{item.donation_id}
                  </span>

                  <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#faf5ff', color: '#7e22ce', padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Sparkles size={12} /> MATCH SCORE: {item.match_score || 95}%
                  </span>
                </div>

                {/* FOOD TITLE & CATEGORY */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: '0 0 0.25rem' }}>
                    {item.food_name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0 }}>
                    Category: <strong>{item.food_category}</strong> &bull; Quantity: <strong style={{ color: '#15803d' }}>{item.quantity} {item.quantity_unit || 'Meals'}</strong>
                  </p>
                </div>

                {/* DONOR TRUST DOSSIER BOX */}
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}>
                  {/* Donor Name with Verified Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>
                      <Building2 size={16} color="#15803d" />
                      <span>{item.donor_name}</span>
                      <VerifiedDonorBadge isVerified={isVerifiedDonor} />
                    </div>

                    {!isVerifiedDonor && (
                      <span style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '700'
                      }}>
                        Not Verified
                      </span>
                    )}
                  </div>

                  {/* Authorized Person */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151' }}>
                    <User size={14} color="#6b7280" />
                    <span>Authorized Person: <strong>{item.donor_contact_person || 'Kumar'}</strong></span>
                  </div>

                  {/* FSSAI Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#4b5563', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      🪪 FSSAI: <strong style={{ fontFamily: 'monospace' }}>{item.donor_fssai_number || '12345678901234'}</strong>
                    </span>
                    {isFssaiVerified ? (
                      <span style={{ color: '#15803d', fontWeight: '800', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={12} strokeWidth={3} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.75rem' }}>
                        Not Verified
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563' }}>
                    <MapPin size={14} color="#0284c7" />
                    <span>Pickup: {item.pickup_address || item.donor_address || 'Erode, Tamil Nadu'}</span>
                  </div>

                  {/* Button to open Donor Trust Card */}
                  <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenDonorProfile({
                        businessName: item.donor_name,
                        contactPerson: item.donor_contact_person,
                        phone: item.donor_phone,
                        email: item.donor_email,
                        address: item.pickup_address || item.donor_address,
                        city: item.donor_city || 'Erode',
                        state: item.donor_state || 'Tamil Nadu',
                        businessType: item.donor_business_type || 'Hotel',
                        fssaiNumber: item.donor_fssai_number || '12345678901234',
                        isVerified: isVerifiedDonor,
                        isFssaiVerified: isFssaiVerified,
                        isBusinessVerified: Boolean(item.is_business_verified || isVerifiedDonor),
                        isLocationVerified: Boolean(item.is_location_verified || isVerifiedDonor),
                        isPhoneVerified: Boolean(item.is_phone_verified || isVerifiedDonor)
                      })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#15803d',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0'
                      }}
                    >
                      <Eye size={13} /> View Donor Trust Profile & Badges &rarr;
                    </button>
                  </div>
                </div>

                {/* TIMING */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} color="#b45309" />
                    <span>Safe Until: <strong>{item.safe_until ? new Date(item.safe_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4 Hours'}</strong></span>
                  </div>
                  <span>Requested: {new Date(item.request_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* ACCEPT / REJECT BUTTONS */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleAccept(item.donation_id || item.match_id)}
                    disabled={Boolean(actionLoadingId)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.88rem', padding: '0.7rem', opacity: actionLoadingId ? 0.7 : 1, cursor: actionLoadingId ? 'not-allowed' : 'pointer' }}
                  >
                    {actionLoadingId === (item.donation_id || item.match_id) ? (
                      <>
                        <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Accepting...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Accept Offer
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleReject(item.donation_id || item.match_id)}
                    disabled={Boolean(actionLoadingId)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', borderColor: '#ef4444', color: '#dc2626', fontSize: '0.88rem', padding: '0.7rem', opacity: actionLoadingId ? 0.7 : 1, cursor: actionLoadingId ? 'not-allowed' : 'pointer' }}
                  >
                    {actionLoadingId === (item.donation_id || item.match_id) ? (
                      'Declining...'
                    ) : (
                      <>
                        <X size={16} /> Decline
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DONOR PROFILE TRUST MODAL */}
      <DonorProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDonor(null);
        }}
        initialData={selectedDonor}
      />

    </div>
  );
}

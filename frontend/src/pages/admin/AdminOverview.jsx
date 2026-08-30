import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Building2, Factory, ShieldCheck, ShieldAlert, Package, 
  Truck, CheckCircle, Utensils, Zap, HeartHandshake, ArrowRight,
  TrendingUp, RefreshCw, AlertCircle, Star, MessageSquareWarning, Lock, CheckCircle2
} from 'lucide-react';
import { getAdminSummary, getDonorComplaints, updateComplaintStatus } from '../../services/adminAPI';
import '../../styles/dashboard.css';

export default function AdminOverview({ token }) {
  const [summary, setSummary] = useState(null);
  const [complaintsData, setComplaintsData] = useState({ complaints: [], totalComplaints: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, compRes] = await Promise.all([
        getAdminSummary(token),
        getDonorComplaints(token).catch(() => ({ success: false, complaints: [] }))
      ]);

      if (res.success) {
        setSummary(res.summary);
      } else {
        setError(res.message || 'Unable to load dashboard summary.');
      }

      if (compRes.success) {
        setComplaintsData(compRes);
      }
    } catch (err) {
      setError('Network or server connection failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (complaintId, newStatus) => {
    try {
      const res = await updateComplaintStatus(complaintId, { status: newStatus }, token);
      if (res.success) {
        setActionSuccessMsg(`Complaint #${complaintId} marked as ${newStatus}!`);
        setTimeout(() => setActionSuccessMsg(''), 4000);
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} color="#16a34a" />
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading administrative platform metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#dc2626', fontSize: '1.3rem', fontWeight: '800' }}>Unable to load platform data</h3>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button onClick={fetchSummary} className="btn-primary">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const s = summary || {
    totalDonors: 0,
    totalNGOs: 0,
    totalBiogasPlants: 0,
    pendingVerifications: 0,
    verifiedOrganizations: 0,
    suspendedOrganizations: 0,
    activeDonations: 0,
    activeMatches: 0,
    foodInTransit: 0,
    completedDeliveries: 0,
    totalFoodDonated: 0,
    totalFoodDelivered: 0,
    foodRedirectedToBiogas: 0,
    totalBeneficiariesReached: 0,
    recentActivity: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
        color: 'white',
        padding: '2.25rem 2rem',
        borderRadius: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CENTRAL ADMINISTRATIVE COMMAND CENTER
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', marginTop: '0.4rem' }}>
            SmartSurplus Platform Overview 🛡️
          </h1>
          <p style={{ color: '#dcfce7', fontSize: '0.95rem', maxWidth: '650px', marginTop: '0.3rem' }}>
            Real-time oversight of Donors, NGOs, Biogas facilities, food matching pipelines, and live logistics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/verification" className="btn-primary" style={{ background: 'white', color: '#15803d', border: 'none', fontWeight: '800' }}>
            <ShieldCheck size={16} /> Verification Center ({s.pendingVerifications})
          </Link>
          <Link to="/admin/live-tracking" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
            <Truck size={16} /> Live Tracking ({s.foodInTransit})
          </Link>
        </div>
      </div>

      {/* 1. Ecosystem Entities Grid */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.85rem' }}>
          Platform Organizations & Ecosystem
        </h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Utensils size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalDonors}</div>
              <div className="stat-label">Total Donors</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalNGOs}</div>
              <div className="stat-label">Total NGOs</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Factory size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalBiogasPlants}</div>
              <div className="stat-label">Total Biogas Plants</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: s.pendingVerifications > 0 ? '#fee2e2' : '#f0fdf4', color: s.pendingVerifications > 0 ? '#dc2626' : '#16a34a' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="stat-value">{s.pendingVerifications}</div>
              <div className="stat-label">Pending Verifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Operational Logistics & Matching Pipeline */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.85rem' }}>
          Operational Logistics & Redistribution Pipeline
        </h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Package size={24} />
            </div>
            <div>
              <div className="stat-value">{s.activeDonations}</div>
              <div className="stat-label">Active Donations</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <HeartHandshake size={24} />
            </div>
            <div>
              <div className="stat-value">{s.activeMatches}</div>
              <div className="stat-label">Active Matches</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#ffedd5', color: '#ea580c' }}>
              <Truck size={24} />
            </div>
            <div>
              <div className="stat-value">{s.foodInTransit}</div>
              <div className="stat-label">Food In Transit</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#15803d' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="stat-value">{s.completedDeliveries}</div>
              <div className="stat-label">Completed Deliveries</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Impact & Recovery Totals */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.85rem' }}>
          Cumulative Surplus Metrics & Impact Totals
        </h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalFoodDonated} kg</div>
              <div className="stat-label">Total Food Donated</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Utensils size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalFoodDelivered} kg</div>
              <div className="stat-label">Total Food Delivered</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Zap size={24} />
            </div>
            <div>
              <div className="stat-value">{s.foodRedirectedToBiogas} kg</div>
              <div className="stat-label">Redirected to Biogas</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="stat-value">{s.totalBeneficiariesReached}</div>
              <div className="stat-label">Beneficiaries Reached</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Controls & Recent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Quick Access Tiles */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
            Administrative Control Shortcuts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link to="/admin/organizations" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontWeight: '700',
              color: '#374151',
              textDecoration: 'none'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Users size={18} color="#16a34a" /> Manage Organizations (Donors, NGOs, Biogas)
              </span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/admin/donations" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontWeight: '700',
              color: '#374151',
              textDecoration: 'none'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Package size={18} color="#0284c7" /> Monitor All Platform Food Surplus Listings
              </span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/admin/map" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontWeight: '700',
              color: '#374151',
              textDecoration: 'none'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Truck size={18} color="#d97706" /> Interactive Leaflet Platform Map
              </span>
              <ArrowRight size={16} />
            </Link>

            <Link to="/admin/audit-logs" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              fontWeight: '700',
              color: '#374151',
              textDecoration: 'none'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldAlert size={18} color="#dc2626" /> Immutable Administrative Audit Log
              </span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
              Recent Platform Audit Activities
            </h3>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.82rem', fontWeight: '700', color: '#15803d' }}>
              View All
            </Link>
          </div>

          {s.recentActivity.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
              No administrative audit entries recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {s.recentActivity.map((log) => (
                <div key={log.id} style={{
                  padding: '0.75rem 0.9rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <strong style={{ color: '#111827' }}>{log.action}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '0.8rem' }}>
                    Target: <strong>{log.target_name || log.target_type}</strong> | {log.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: '700', fontSize: '0.9rem' }}>
          ✓ {actionSuccessMsg}
        </div>
      )}

      {/* CONFIDENTIAL DONOR COMPLAINTS & QUALITY ALERTS PANEL */}
      <div className="glass-card" style={{ border: '1.5px solid #fecaca', background: '#fffafa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                CONFIDENTIAL ADMIN INBOX
              </span>
              <span style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Lock size={12} /> Hidden from Donors
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#991b1b', margin: '0.4rem 0 0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquareWarning size={22} color="#dc2626" />
              Donor Quality Complaints & Trust Feedback
            </h3>
            <p style={{ color: '#7f1d1d', fontSize: '0.85rem', margin: 0 }}>
              Direct feedback and issue reports submitted by NGOs & Biogas plants during food collection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontWeight: '800',
              fontSize: '0.82rem'
            }}>
              {complaintsData.pendingComplaints || 0} Pending Review
            </span>
          </div>
        </div>

        {complaintsData.complaints && complaintsData.complaints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {complaintsData.complaints.map((comp) => (
              <div
                key={comp.id}
                style={{
                  background: '#ffffff',
                  border: comp.admin_status === 'NEW' ? '1.5px solid #f87171' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.1rem 1.25rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem', color: '#111827' }}>
                        🏨 {comp.donor_name || 'Hotel Donor'}
                      </strong>
                      <span style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {comp.complaint_category || 'Operational Issue'}
                      </span>
                      <span style={{
                        background: comp.admin_status === 'NEW' ? '#fee2e2' : comp.admin_status === 'RESOLVED' ? '#dcfce7' : '#f1f5f9',
                        color: comp.admin_status === 'NEW' ? '#991b1b' : comp.admin_status === 'RESOLVED' ? '#15803d' : '#475569',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        Status: {comp.admin_status || 'NEW'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Reported by: <strong>{comp.reviewer_name}</strong> ({comp.reviewer_type}) &bull; Donation #{comp.donation_id} ({comp.food_name || 'Food Item'})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fefce8', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #fef08a' }}>
                    <Star size={14} color="#eab308" fill="#eab308" />
                    <strong style={{ fontSize: '0.88rem', color: '#854d0e' }}>
                      {Number(comp.rating_points || 5).toFixed(1)} / 5.0
                    </strong>
                  </div>
                </div>

                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#7f1d1d',
                  fontSize: '0.88rem',
                  lineHeight: '1.45',
                  marginBottom: '0.75rem'
                }}>
                  <strong>Complaint Message:</strong> "{comp.complaint_text || 'Low rating given without specific comment.'}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                    Reported at: {new Date(comp.created_at).toLocaleString()}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {comp.admin_status !== 'REVIEWED' && (
                      <button
                        onClick={() => handleUpdateComplaint(comp.id, 'REVIEWED')}
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        Mark Reviewed
                      </button>
                    )}
                    {comp.admin_status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateComplaint(comp.id, 'RESOLVED')}
                        className="btn-primary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', background: '#15803d' }}
                      >
                        <CheckCircle2 size={13} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#15803d', background: '#f0fdf4', borderRadius: '10px', border: '1px dashed #86efac' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>No Active Donor Complaints</strong>
            <span style={{ fontSize: '0.82rem', color: '#166534' }}>All hotels and donors maintain satisfactory trust scores and delivery compliance.</span>
          </div>
        )}
      </div>
    </div>
  );
}

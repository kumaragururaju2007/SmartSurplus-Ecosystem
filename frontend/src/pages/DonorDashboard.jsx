import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Utensils, CheckCircle2, Clock, Zap, Heart, ArrowRight, ShieldCheck, Truck, Navigation, Users, Leaf, Star, Award } from 'lucide-react';
import { getDashboardSummary } from '../services/donationAPI';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function DonorDashboard({ user, token }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSummary() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getDashboardSummary(token);
        if (res.success) {
          setSummary(res.summary);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [token]);

  const donorName = user?.name || summary?.donorName || 'Donor';
  const isDonorVerified = Boolean(user?.is_verified || summary?.isVerified);
  const trustScore = summary?.trustScore || 5.0;
  const trustPoints = summary?.trustPoints || 100;
  const totalReviews = summary?.totalReviews || 0;
  const trustLevel = summary?.trustLevel || 'TOP_RATED';
  const totalDonations = summary?.totalDonations || 0;
  const activeDonationsCount = summary?.activeDonations || 0;
  const completedDonationsCount = summary?.completedDonations || 0;
  const totalFoodQty = summary?.totalFoodDonated || 0;
  const recentDonations = summary?.recentDonations || [];
  const activeDonation = summary?.activeDonation || null;
  const impact = summary?.impact || { foodDonatedKg: 0, peopleServed: 0, co2SavedKg: 0, foodWasteReducedKg: 0 };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1140px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* 1. WELCOME HEADER BANNER */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: 'white', padding: '2.25rem 2rem', borderRadius: '20px', marginBottom: '2rem', boxShadow: '0 12px 30px rgba(21, 128, 61, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', letterSpacing: '0.5px' }}>
              FOOD SURPLUS REDISTRIBUTION OVERVIEW
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '0.6rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>Welcome back, {donorName}</span>
              <VerifiedDonorBadge isVerified={isDonorVerified} style={{ background: '#ffffff', color: '#15803d', borderColor: '#ffffff', fontSize: '0.82rem' }} />
              <span>👋</span>
            </h1>
            <p style={{ color: '#dcfce7', fontSize: '0.95rem', margin: '0.3rem 0 0', opacity: 0.9 }}>
              Track active listings, monitor real-time shelter matching, and review your environmental impact.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/donor/create-donation" className="btn-primary" style={{ background: 'white', color: '#15803d', border: 'none', fontWeight: '800', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
              <Plus size={18} /> Donate Food
            </Link>
            <Link to="/donor/donations" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: '700' }}>
              My Donations
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* DONOR TRUST SCORE KPI */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)', border: '1.5px solid #facc15' }}>
          <div className="stat-icon-wrapper" style={{ background: '#eab308', color: '#ffffff' }}><Star size={24} fill="#ffffff" /></div>
          <div>
            <div className="stat-value" style={{ color: '#854d0e', fontSize: '1.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {loading ? '...' : `${Number(trustScore).toFixed(1)} / 5.0`}
            </div>
            <div className="stat-label" style={{ fontWeight: '800', color: '#a16207' }}>
              Hotel Trust Score
            </div>
            <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '2px', fontWeight: '700' }}>
              ⭐ {trustPoints}% Trust Rating ({totalReviews} reviews)
            </div>
          </div>
        </div>

        {/* PEOPLE BENEFITED KPI */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac' }}>
          <div className="stat-icon-wrapper" style={{ background: '#15803d', color: '#ffffff' }}><Users size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: '#14532d', fontSize: '1.8rem', fontWeight: '900' }}>
              {loading ? '...' : (summary?.peopleBenefited || impact.peopleServed || 0).toLocaleString()}
            </div>
            <div className="stat-label" style={{ fontWeight: '800', color: '#15803d' }}>People Benefited</div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px', fontWeight: '600' }}>
              Approx. people benefited from your donations
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}><Zap size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : `${totalFoodQty} kg`}</div>
            <div className="stat-label">Total Food Donated</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Total surplus weight listed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#faf5ff', color: '#7e22ce' }}><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : completedDonationsCount}</div>
            <div className="stat-label">Completed Deliveries</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Received & distributed by NGOs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}><Clock size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : activeDonationsCount}</div>
            <div className="stat-label">Active Donations</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Pickups & matches in progress</div>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE DONATION BANNER */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={20} color="#0284c7" /> Active Donation Status
        </h2>

        {activeDonation ? (
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #bae6fd', boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800' }}>
                    ACTIVE LISTING
                  </span>
                  <span style={{ color: '#0284c7', fontWeight: '700', fontSize: '0.85rem' }}>
                    Status: {activeDonation.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: '0.2rem 0' }}>
                  {activeDonation.food_name} ({activeDonation.quantity} kg)
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: 0 }}>
                  Pickup Address: <strong>{activeDonation.pickup_address || 'Not specified'}</strong>
                </p>
              </div>

              <Link to={`/tracking/${activeDonation.id}`} className="btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7', padding: '0.6rem 1.2rem' }}>
                <Navigation size={16} /> Track Donation
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ margin: 0, fontSize: '0.92rem' }}>No active donations currently in transit or pending match.</p>
            <Link to="/donor/create-donation" className="btn-primary" style={{ marginTop: '0.75rem', display: 'inline-flex', fontSize: '0.85rem' }}>
              + Donate Surplus Food
            </Link>
          </div>
        )}
      </div>

      {/* 4. RECENT DONATIONS & QUICK ACTIONS (2 COLUMN LAYOUT) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
        
        {/* RECENT DONATIONS */}
        <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: 0 }}>
              Recent Donations & Impact
            </h3>
            <Link to="/donor/donations" style={{ fontSize: '0.83rem', fontWeight: '700', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {recentDonations.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>No recent donations recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {recentDonations.map((item) => {
                const getStatusInfo = (status) => {
                  switch (status) {
                    case 'POSTED':
                      return { label: 'POSTED', bg: '#fef3c7', text: '#b45309' };
                    case 'ACCEPTED':
                    case 'MATCHED':
                      return { label: 'MATCH CONFIRMED', bg: '#e0f2fe', text: '#0369a1' };
                    case 'PICKUP_READY':
                    case 'PICKUP_STARTED':
                    case 'COLLECTED':
                    case 'IN_TRANSIT':
                      return { label: 'IN TRANSIT', bg: '#f3e8ff', text: '#7e22ce' };
                    case 'DELIVERED':
                    case 'COMPLETED':
                      return { label: 'COMPLETED', bg: '#dcfce7', text: '#15803d' };
                    case 'CANCELLED':
                      return { label: 'CANCELLED', bg: '#fee2e2', text: '#dc2626' };
                    default:
                      return { label: status, bg: '#f3f4f6', text: '#4b5563' };
                  }
                };
                const badgeInfo = getStatusInfo(item.status);
                const hasImpact = Boolean(item.people_served);

                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.85rem', background: '#f9fafb', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.94rem', color: '#111827' }}>
                        {item.food_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {item.quantity} kg &bull; Recipient: <strong>{item.recipient_name || 'Matched NGO'}</strong>
                      </div>
                      {hasImpact && (
                        <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Users size={12} /> ~{item.people_served} People Served
                          </span>
                          {item.quantity_received && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                              ({item.quantity_received} kg received)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.73rem', fontWeight: '800', padding: '0.2rem 0.55rem', borderRadius: '6px', background: badgeInfo.bg, color: badgeInfo.text, flexShrink: 0 }}>
                      {badgeInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS PANEL */}
        <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '1.25rem' }}>
            Quick Actions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Link to="/donor/create-donation" style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', textDecoration: 'none', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Plus size={20} />
              <strong style={{ fontSize: '0.9rem' }}>+ Donate Food</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Post surplus food</span>
            </Link>

            <Link to="/donor/donations" style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', textDecoration: 'none', color: '#0284c7', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Utensils size={20} />
              <strong style={{ fontSize: '0.9rem' }}>My Donations</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Manage all history</span>
            </Link>

            <Link to="/tracking/1" style={{ padding: '1rem', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', textDecoration: 'none', color: '#7e22ce', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Truck size={20} />
              <strong style={{ fontSize: '0.9rem' }}>Track Active</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Live map route</span>
            </Link>

            <Link to="/impact" style={{ padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5', textDecoration: 'none', color: '#c2410c', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Heart size={20} />
              <strong style={{ fontSize: '0.9rem' }}>View Impact</strong>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Social & CO₂ metrics</span>
            </Link>
          </div>
        </div>

      </div>

      {/* 5. DONOR DASHBOARD — IMPACT SUMMARY */}
      <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf size={20} color="#15803d" /> Your Environmental & Social Impact
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1.25rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1d4ed8' }}>👥 ~{(summary?.peopleBenefited || impact.peopleServed || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e40af', marginTop: '0.2rem' }}>People Benefited</div>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '2px' }}>Estimated people fed from your donations</div>
          </div>

          <div style={{ padding: '1.25rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#15803d' }}>🍱 {impact.foodDonatedKg} kg</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', marginTop: '0.2rem' }}>Food Surplus Donated</div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>Total verified weight</div>
          </div>

          <div style={{ padding: '1.25rem', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#7e22ce' }}>🌱 {impact.co2SavedKg} kg</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b21a8', marginTop: '0.2rem' }}>CO₂ Emissions Avoided</div>
            <div style={{ fontSize: '0.72rem', color: '#7e22ce', marginTop: '2px' }}>Methane & landfill prevention</div>
          </div>
        </div>
      </div>

    </div>
  );
}

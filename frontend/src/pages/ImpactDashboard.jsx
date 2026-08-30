import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Utensils, Zap, Award, FileText, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import '../styles/dashboard.css';

export default function ImpactDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImpact() {
      try {
        const res = await fetch('/api/impact/summary');
        const data = await res.json();
        if (data.success) setSummary(data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadImpact();
  }, []);

  if (loading) return <div style={{ maxWidth: '900px', margin: '4rem auto', textAlign: 'center' }}>Loading Real-Time Impact Dashboard...</div>;

  const data = summary || {
    totalDonations: 0,
    completedDonations: 0,
    foodRescuedKg: 0,
    mealsSupported: 0,
    wasteDivertedKg: 0,
    biogasGeneratedM3: 0,
    co2SavedKg: 0,
    landfillDiversionRate: 0,
    impactScore: 0,
    scoreBadge: 'STANDARD'
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              REAL-TIME CSR & ESG SUSTAINABILITY IMPACT
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.4rem', color: 'white' }}>
              SmartSurplus Ecosystem Impact 🌿
            </h1>
            <p style={{ color: '#dcfce7', fontSize: '0.95rem' }}>
              Verified ecological metrics powered by actual redistribution and biogas conversion records.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', padding: '0.75rem 1.25rem', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#bbf7d0', display: 'block' }}>SMARTSURPLUS IMPACT SCORE</span>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white', lineHeight: '1.1' }}>{data.impactScore} / 100</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#fef08a', display: 'block', marginTop: '0.2rem' }}>
              🏆 {data.scoreBadge} TIER
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/impact/report" className="btn-primary" style={{ background: 'white', color: '#15803d', border: 'none' }}>
            <FileText size={16} /> View Printable ESG Report
          </Link>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="stats-grid">
        {/* PEOPLE BENEFITED KPI CARD */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac' }}>
          <div className="stat-icon-wrapper" style={{ background: '#15803d', color: '#ffffff' }}><Utensils size={24} /></div>
          <div>
            <div className="stat-value" style={{ color: '#14532d', fontSize: '1.8rem', fontWeight: '900' }}>
              ~{(data.peopleBenefited || data.mealsSupported || 0).toLocaleString()}
            </div>
            <div className="stat-label" style={{ fontWeight: '800', color: '#15803d' }}>People Benefited</div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px', fontWeight: '600' }}>
              Approx. people benefited through SmartSurplus
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}><Leaf size={24} /></div>
          <div>
            <div className="stat-value">{data.foodRescuedKg} kg</div>
            <div className="stat-label">Food Rescued (Human)</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Verified food weight redistributed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}><Zap size={24} /></div>
          <div>
            <div className="stat-value">{data.wasteDivertedKg} kg</div>
            <div className="stat-label">Waste Diverted to Biogas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#15803d' }}><TrendingUp size={24} /></div>
          <div>
            <div className="stat-value">{data.co2SavedKg} kg</div>
            <div className="stat-label">CO₂ Emissions Prevented</div>
          </div>
        </div>
      </div>

      {/* Impact Breakdown Breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
          Environmental Conversion Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Clean Biogas Generated</span>
            <strong style={{ fontSize: '1.3rem', color: '#d97706' }}>~{data.biogasGeneratedM3} m³</strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>Converted via anaerobic digestion</span>
          </div>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Donation Completion Rate</span>
            <strong style={{ fontSize: '1.3rem', color: '#16a34a' }}>
              {data.totalDonations > 0 ? `${Math.round((data.completedDonations / data.totalDonations) * 100)}%` : '0%'}
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>Successful NGO & Biogas collections</span>
          </div>

          <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Landfill Diversion Rate</span>
            <strong style={{ fontSize: '1.3rem', color: '#0284c7' }}>
              {data.landfillDiversionRate !== undefined ? `${data.landfillDiversionRate}%` : '0.0%'}
            </strong>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginTop: '0.2rem' }}>Zero organic food waste to landfill</span>
          </div>
        </div>
      </div>
    </div>
  );
}

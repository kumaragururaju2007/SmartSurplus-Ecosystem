import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Utensils, Zap, Users, 
  Building2, Factory, Package, CheckCircle2, RefreshCw, AlertCircle
} from 'lucide-react';
import { getAdminAnalytics } from '../../services/adminAPI';
import '../../styles/dashboard.css';

export default function AdminAnalytics({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminAnalytics(token);
      if (res.success) {
        setAnalytics(res.analytics);
      } else {
        setError(res.message || 'Unable to load analytics.');
      }
    } catch (err) {
      setError('Connection failure loading platform analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 0.75rem' }} />
        Computing platform analytics and redistribution trends...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#dc2626', fontSize: '1.3rem', fontWeight: '800' }}>Unable to load analytics</h3>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 1.5rem' }}>{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const a = analytics;
  const totalVolume = (a.foodDeliveredKg || 0) + (a.foodRedirectedBiogasKg || 0);
  const humanPercent = totalVolume > 0 ? Math.round((a.foodDeliveredKg / totalVolume) * 100) : 0;
  const biogasPercent = totalVolume > 0 ? (100 - humanPercent) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            CSR & ESG PLATFORM ANALYTICS
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Activities & Analytics 📊
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Quantifiable redistribution metrics, landfill diversion volumes, and clean biogas energy recovery.
          </p>
        </div>

        <button onClick={fetchAnalytics} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Analytics
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Utensils size={24} />
          </div>
          <div>
            <div className="stat-value">{a.foodDeliveredKg} kg</div>
            <div className="stat-label">Food Delivered (Human)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Zap size={24} />
          </div>
          <div>
            <div className="stat-value">{a.foodRedirectedBiogasKg} kg</div>
            <div className="stat-label">Redirected to Biogas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{a.beneficiariesReached}</div>
            <div className="stat-label">Beneficiaries Reached</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{a.completedDeliveries} / {a.totalDonations}</div>
            <div className="stat-label">Completed / Total Donations</div>
          </div>
        </div>
      </div>

      {/* Recovery Pathways Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Pathway Split Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
            Surplus Destination Breakdown
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Proportion of surplus directed to human consumption vs clean anaerobic digestion.
          </p>

          {totalVolume === 0 ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
              No completed food transactions available yet to compute pathway percentages.
            </div>
          ) : (
            <div>
              {/* Visual Progress Bar */}
              <div style={{ height: '24px', width: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', background: '#e5e7eb', marginBottom: '1.25rem' }}>
                <div style={{ width: `${humanPercent}%`, background: '#16a34a', transition: 'width 0.5s ease' }} title={`Human: ${humanPercent}%`} />
                <div style={{ width: `${biogasPercent}%`, background: '#d97706', transition: 'width 0.5s ease' }} title={`Biogas: ${biogasPercent}%`} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '10px', flex: 1, border: '1px solid #dcfce7' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#16a34a' }}>🍲 HUMAN REDISTRIBUTION</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#15803d', marginTop: '0.2rem' }}>
                    {humanPercent}%
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>{a.foodDeliveredKg} kg delivered</span>
                </div>

                <div style={{ background: '#fffbe6', padding: '0.85rem 1rem', borderRadius: '10px', flex: 1, border: '1px solid #fef3c7' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#d97706' }}>⚡ BIOGAS RECOVERY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#b45309', marginTop: '0.2rem' }}>
                    {biogasPercent}%
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>{a.foodRedirectedBiogasKg} kg converted</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
            Surplus Categories Distributed
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Categorical breakdown of listed food items.
          </p>

          {(!a.categoryDistribution || a.categoryDistribution.length === 0) ? (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
              No categorical data available yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {a.categoryDistribution.map((cat) => (
                <div key={cat.food_category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{cat.food_category}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.6rem', borderRadius: '999px' }}>
                    {cat.count} listings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

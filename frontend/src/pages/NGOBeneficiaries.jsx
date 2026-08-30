import React, { useState, useEffect } from 'react';
import { getBeneficiariesSummary } from '../services/ngoAPI';
import { Users, Heart, Calendar, Award, Utensils } from 'lucide-react';
import '../styles/dashboard.css';

export default function NGOBeneficiaries({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getBeneficiariesSummary(token);
        if (res.success) setData(res.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const stats = data || {
    totalBeneficiaries: 0,
    activeBeneficiaries: 0,
    beneficiariesServedThisMonth: 0,
    beneficiariesServedThisYear: 0,
    recentDistributions: []
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>👥 Beneficiary Management & Reach</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Overview of community members, shelters, and individuals served through food redistribution drives.
        </p>
      </div>

      {/* METRIC CARDS (4 CARDS) */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#1d4ed8' }}><Users size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.totalBeneficiaries}</div>
            <div className="stat-label">Total Beneficiaries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}><Heart size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.activeBeneficiaries}</div>
            <div className="stat-label">Active Beneficiaries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}><Calendar size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.beneficiariesServedThisMonth}</div>
            <div className="stat-label">Served This Month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#faf5ff', color: '#7e22ce' }}><Award size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : stats.beneficiariesServedThisYear}</div>
            <div className="stat-label">Served This Year</div>
          </div>
        </div>

      </div>

      {/* RECENT BENEFICIARY DISTRIBUTION LOG */}
      <div className="glass-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '1.25rem' }}>
          Recent Beneficiary Distribution Drives
        </h3>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading records...</p>
        ) : (stats.recentDistributions && stats.recentDistributions.length > 0) ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left', color: '#6b7280' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Location / Drive</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Beneficiaries Reached</th>
                  <th style={{ padding: '0.75rem' }}>Food Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDistributions.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#4b5563' }}>{new Date(item.distribution_date || item.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: '700', color: '#111827' }}>{item.distribution_location || 'Community Drive'}</td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#4b5563' }}>{item.category || 'Cooked Food'}</td>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: '800', color: '#1d4ed8' }}>{item.beneficiaries_served} People</td>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: '800', color: '#15803d' }}>{item.quantity_distributed} Meals</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
            No beneficiary records logged yet.
          </p>
        )}
      </div>

    </div>
  );
}

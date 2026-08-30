import React, { useState, useEffect } from 'react';
import { getNGOImpact } from '../services/ngoAPI';
import { BarChart3, Leaf, Users, Utensils, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import '../styles/dashboard.css';

export default function NGOImpact({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpact() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await getNGOImpact(token);
        if (res.success) setData(res.impact);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, [token]);

  const impact = data || {
    totalDonationsReceived: 0,
    totalFoodDistributedKg: 0,
    totalBeneficiariesServed: 0,
    successfulDistributions: 0,
    wastePreventedKg: 0,
    totalMatchesCompleted: 0,
    co2SavedKg: 0,
    monthlyCharts: []
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>📊 NGO Impact & Environmental Analytics</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Detailed metrics showcasing food rescued, community members served, and environmental waste prevented by your organization.
        </p>
      </div>

      {/* 6 IMPACT METRIC CARDS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}><Utensils size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : impact.totalDonationsReceived}</div>
            <div className="stat-label">Donations Received</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}><Utensils size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : `${impact.totalFoodDistributedKg} kg`}</div>
            <div className="stat-label">Food Distributed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#1d4ed8' }}><Users size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : impact.totalBeneficiariesServed}</div>
            <div className="stat-label">Beneficiaries Served</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#faf5ff', color: '#7e22ce' }}><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : impact.successfulDistributions}</div>
            <div className="stat-label">Successful Drives</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#c2410c' }}><Leaf size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : `${impact.wastePreventedKg} kg`}</div>
            <div className="stat-label">Waste Prevented</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f0fdf4', color: '#15803d' }}><Award size={24} /></div>
          <div>
            <div className="stat-value">{loading ? '...' : impact.totalMatchesCompleted}</div>
            <div className="stat-label">Matches Completed</div>
          </div>
        </div>

      </div>

      {/* WASTE REDUCTION & CO2 SUMMARY */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: 'white', padding: '2rem', borderRadius: '20px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
          <Leaf size={22} color="#86efac" /> Waste Reduction & Ecological Savings
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>🍱 {impact.totalFoodDistributedKg} kg</div>
            <div style={{ fontSize: '0.85rem', color: '#dcfce7', marginTop: '0.2rem', fontWeight: '700' }}>Food Rescued & Served</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>♻️ {impact.wastePreventedKg} kg</div>
            <div style={{ fontSize: '0.85rem', color: '#dcfce7', marginTop: '0.2rem', fontWeight: '700' }}>Landfill Waste Prevented</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>🌱 {impact.co2SavedKg} kg</div>
            <div style={{ fontSize: '0.85rem', color: '#dcfce7', marginTop: '0.2rem', fontWeight: '700' }}>CO₂ Emissions Avoided</div>
          </div>
        </div>
      </div>

      {/* MONTHLY METRIC CHARTS */}
      <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="#15803d" /> Monthly Distribution & Beneficiary Growth
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(impact.monthlyCharts || []).map((m) => {
            const maxVal = Math.max(1, ...(impact.monthlyCharts || []).map(item => item.beneficiaries));
            const barWidth = m.beneficiaries > 0 ? Math.min(100, Math.round((m.beneficiaries / maxVal) * 100)) : 0;

            return (
              <div key={`${m.month}-${m.year || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                <span style={{ width: '45px', fontWeight: '800', color: m.beneficiaries > 0 ? '#111827' : '#9ca3af' }}>{m.month}</span>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: m.beneficiaries > 0 ? '800' : '500', color: m.beneficiaries > 0 ? '#1d4ed8' : '#9ca3af' }}>
                      {m.beneficiaries} Beneficiaries
                    </span>
                    <span style={{ fontWeight: m.wastePreventedKg > 0 ? '700' : '500', color: m.wastePreventedKg > 0 ? '#15803d' : '#9ca3af' }}>
                      {m.wastePreventedKg} kg Waste Prevented
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '10px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${barWidth}%`, background: m.beneficiaries > 0 ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'transparent', height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

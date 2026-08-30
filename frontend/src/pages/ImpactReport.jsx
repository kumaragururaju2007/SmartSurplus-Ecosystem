import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft, Leaf, ShieldCheck, FileText } from 'lucide-react';

export default function ImpactReport({ token }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const tokenVal = token || localStorage.getItem('smartsurplus_token');
        const res = await fetch('/api/impact/report', {
          headers: tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {}
        });
        const data = await res.json();
        if (data.success) setReportData(data.report);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [token]);

  if (loading) return <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '1rem' }}>Generating ESG Impact Report...</div>;

  const r = reportData || {
    title: 'SmartSurplus Annual Corporate Sustainability & ESG Impact Summary',
    generatedAt: new Date().toLocaleDateString(),
    reportingPeriod: '2026 YTD',
    metrics: {
      foodRedistributedKg: 0,
      mealsProvided: 0,
      organicWasteDivertedKg: 0,
      cleanBiogasGeneratedM3: 0,
      co2EmissionsPreventedKg: 0,
      landfillDivertedPercent: '0%'
    },
    impactScore: '0 / 100'
  };

  return (
    <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 0.5rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/impact" className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Impact Dashboard
        </Link>
        <button onClick={() => window.print()} className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
          <Printer size={16} /> Print ESG Report
        </button>
      </div>

      <div className="glass-card print-container" style={{ background: 'white', padding: 'clamp(1.25rem, 4vw, 2.5rem)', borderRadius: '16px', border: '1px solid #e5e7eb', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #16a34a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Leaf size={24} color="#16a34a" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#15803d' }}>SmartSurplus Ecosystem</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Verified Corporate ESG & Sustainability Report</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block' }}>Date Generated</span>
            <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{new Date().toLocaleDateString()}</strong>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
          {r.title}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Reporting Period: <strong>{r.reportingPeriod}</strong> | SmartSurplus Impact Score: <strong style={{ color: '#15803d' }}>{r.impactScore}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#f0fdf4', padding: '1.25rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700', display: 'block' }}>HUMAN FOOD REDISTRIBUTION</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#15803d', display: 'block', marginTop: '0.2rem' }}>
              {r.metrics.foodRedistributedKg} kg
            </span>
            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Directly Supported: <strong>{r.metrics.mealsProvided} Meals</strong></span>
          </div>

          <div style={{ background: '#fffbe6', padding: '1.25rem 1rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '700', display: 'block' }}>BIOGAS ENERGY CONVERSION</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', display: 'block', marginTop: '0.2rem' }}>
              {r.metrics.organicWasteDivertedKg} kg
            </span>
            <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Clean Fuel Produced: <strong>~{r.metrics.cleanBiogasGeneratedM3} m³</strong></span>
          </div>
        </div>

        <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
            Carbon & Landfill Offset Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
            <div><strong>CO₂ Emissions Prevented:</strong> {r.metrics.co2EmissionsPreventedKg} kg CO₂e</div>
            <div><strong>Landfill Diversion Efficiency:</strong> {r.metrics.landfillDivertedPercent}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
          ℹ️ Generated via SmartSurplus Operational Data Pipeline. Calculated based on actual completed redistribution and biogas recovery records.
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { getNGOReports } from '../services/ngoAPI';
import { FileSpreadsheet, Download, Filter, Calendar, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import '../styles/dashboard.css';

export default function NGOReports({ token }) {
  const [reportType, setReportType] = useState('Donation Received');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getNGOReports(reportType, dateFilter, token);
      if (res.success) setReportData(res.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateFilter, token]);

  const handleDownload = () => {
    alert(`Downloading ${reportType} (${dateFilter}) as CSV / PDF audit report...`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '900', color: '#0f172a' }}>📑 NGO Reports & ESG Documentation</h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
            Generate compliant reports for food receipt, distribution drives, beneficiary audits, and ESG impact.
          </p>
        </div>

        <button onClick={handleDownload} className="btn-primary" style={{ padding: '0.75rem 1.6rem', borderRadius: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Export Audit Report
        </button>
      </div>

      {/* FILTER CONTROLS WITH RICH INPUT LABELS */}
      <div className="glass-card" style={{ background: 'white', padding: '1.5rem 1.75rem', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '1.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }}>
        
        <div>
          <label className="input-label">Select Report Module</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input-field"
            style={{ minWidth: '240px' }}
          >
            <option value="Donation Received">Donation Received Report</option>
            <option value="Distribution">Distribution Audit Report</option>
            <option value="Beneficiary">Beneficiary Reach Report</option>
            <option value="Matching">Smart Matching Summary</option>
            <option value="Impact">Sustainability & Impact Report</option>
            <option value="ESG Contribution">ESG Contribution Certificate</option>
          </select>
        </div>

        <div>
          <label className="input-label">Timeframe Filter</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
            style={{ minWidth: '200px' }}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
            <option value="Custom Date Range">Custom Date Range</option>
          </select>
        </div>

      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)' }}>
        {loading ? (
          <p style={{ color: '#64748b' }}>Generating {reportType} report...</p>
        ) : reportData ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  {reportData.title}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Organization: <strong style={{ color: '#0f172a' }}>{reportData.organization}</strong> &bull; Period: <strong style={{ color: '#16a34a' }}>{reportData.filterApplied}</strong>
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', background: '#f0fdf4', color: '#15803d', padding: '0.3rem 0.75rem', borderRadius: '999px', fontWeight: '800', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> VERIFIED NGO AUDIT
              </span>
            </div>

            {/* REPORT SUMMARY METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.75rem', border: '1px solid #e2e8f0' }}>
              {(reportData.summaryCards && reportData.summaryCards.length > 0) ? (
                reportData.summaryCards.map((card, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{card.label}</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: card.color || '#0f172a', marginTop: '0.2rem' }}>{card.value}</div>
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Donations</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>{reportData.summary?.totalDonations}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total Quantity (Kg/Meals)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a' }}>{reportData.summary?.totalQuantityKg}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Beneficiaries Served</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0284c7' }}>{reportData.summary?.beneficiariesServed}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Match Success Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#7e22ce' }}>{reportData.summary?.successRate}</div>
                  </div>
                </>
              )}
            </div>

            {/* AUDIT TABLE RECORDS */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    {(reportData.columns && reportData.columns.length > 0) ? (
                      reportData.columns.map((col, idx) => (
                        <th key={idx} style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {col.header}
                        </th>
                      ))
                    ) : (
                      <>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Record ID</th>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Date</th>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Item / Category</th>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Quantity</th>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Beneficiaries</th>
                        <th style={{ padding: '0.85rem 0.75rem', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(reportData.records || []).map((r, rowIdx) => (
                    <tr key={r.id || rowIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {(reportData.columns && reportData.columns.length > 0) ? (
                        reportData.columns.map((col, colIdx) => (
                          <td key={colIdx} style={{ padding: '1rem 0.75rem', color: col.key === 'id' ? '#0f172a' : '#475569', fontWeight: col.key === 'id' || col.key === 'item' ? '800' : '600' }}>
                            {col.key === 'status' ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800' }}>
                                {r[col.key]}
                              </span>
                            ) : col.key === 'quantity' && typeof r[col.key] === 'string' && r[col.key].includes('kg') ? (
                              <span style={{ color: '#16a34a', fontWeight: '800' }}>{r[col.key]}</span>
                            ) : col.key === 'beneficiaries' ? (
                              <span style={{ color: '#0284c7', fontWeight: '800' }}>{r[col.key]}</span>
                            ) : (
                              r[col.key] || '—'
                            )}
                          </td>
                        ))
                      ) : (
                        <>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: '800', color: '#0f172a' }}>{r.id}</td>
                          <td style={{ padding: '1rem 0.75rem', color: '#475569', fontWeight: '600' }}>{r.date}</td>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: '700', color: '#0f172a' }}>{r.item}</td>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: '800', color: '#16a34a' }}>{r.quantity}</td>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: '800', color: '#0284c7' }}>{r.beneficiaries} People</td>
                          <td style={{ padding: '1rem 0.75rem' }}>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                              {r.status}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ) : null}
      </div>

    </div>
  );
}

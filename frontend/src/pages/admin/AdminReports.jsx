import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Download, Printer, RefreshCw, 
  AlertCircle, Calendar, Filter, FileText
} from 'lucide-react';
import { getAdminReports } from '../../services/adminAPI';
import '../../styles/dashboard.css';

export default function AdminReports({ token }) {
  const [reportType, setReportType] = useState('Platform Activity Report');
  const [period, setPeriod] = useState('This Month');
  const [reportData, setReportData] = useState({ metadata: {}, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reportOptions = [
    'Platform Activity Report',
    'Donor Activity',
    'NGO Activity',
    'Biogas Activity',
    'Donation Report',
    'Matching Report',
    'Transportation Report',
    'Delivery Report',
    'Food Recovery Report'
  ];

  const periodOptions = [
    'Today',
    'This Week',
    'This Month',
    'This Year'
  ];

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminReports(reportType, period, token);
      if (res.success) {
        setReportData(res);
      } else {
        setError(res.message || 'Unable to generate report.');
      }
    } catch (err) {
      setError('Connection failure generating report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, period, token]);

  const handleExportCSV = () => {
    if (!reportData.rows || reportData.rows.length === 0) return;
    const headers = Object.keys(reportData.rows[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartSurplus_${reportType.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const rows = reportData.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            EXECUTIVE AUDIT & COMPLIANCE
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Administrative Reports 📑
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Exportable regulatory compliance summaries and redistribution metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleExportCSV}
            disabled={rows.length === 0}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={rows.length === 0}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Filter Selector Panel */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '0.3rem' }}>
              REPORT CATEGORY:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: 'white'
              }}
            >
              {reportOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', marginBottom: '0.3rem' }}>
              TIME PERIOD:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.88rem',
                fontWeight: '700',
                background: 'white'
              }}
            >
              {periodOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={generateReport} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>

      {/* Generated Report Output */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>
              {reportType}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Period: <strong>{period}</strong> | Records: <strong>{rows.length}</strong> | Generated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
            Aggregating platform database records...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
            <AlertCircle size={36} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#111827' }}>
              No data available for the selected period.
            </strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              As donations, verifications, and collections take place, report tables will generate automatically.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                {columns.map((col) => (
                  <th key={col} style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: '0.75rem', color: '#374151' }}>
                      {String(row[col] !== null && row[col] !== undefined ? row[col] : '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

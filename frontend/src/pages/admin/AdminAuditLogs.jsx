import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Filter, RefreshCw, AlertCircle, 
  Calendar, Search, ShieldCheck, UserCheck, Trash2, Ban
} from 'lucide-react';
import { getAuditLogs } from '../../services/adminAPI';
import '../../styles/dashboard.css';

export default function AdminAuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const typeParam = targetTypeFilter === 'ALL' ? '' : targetTypeFilter;
      const res = await getAuditLogs('', typeParam, token);
      if (res.success) {
        setLogs(res.logs || []);
      } else {
        setError(res.message || 'Unable to fetch audit logs.');
      }
    } catch (err) {
      setError('Connection failure retrieving platform audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter, token]);

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (log.action || '').toLowerCase().includes(q) ||
           (log.target_name || '').toLowerCase().includes(q) ||
           (log.reason || '').toLowerCase().includes(q) ||
           (log.admin_name || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            IMMUTABLE SECURITY LEDGER
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Platform Audit Logs 🛡️
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Permanent record of administrative approvals, rejections, suspensions, and entity modifications.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Audit Trail
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by action, target organization, admin name, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#6b7280" />
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <option value="ALL">All Target Types</option>
            <option value="NGO">NGOs Only</option>
            <option value="DONOR">Donors Only</option>
            <option value="BIOGAS">Biogas Plants Only</option>
            <option value="DONATION">Donations Only</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            Loading immutable audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
            <ShieldAlert size={36} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#111827' }}>
              No audit log entries recorded.
            </strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              When administrative actions are performed on organizations or donations, they will be logged here.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
                <th style={{ padding: '0.75rem' }}>Target Entity</th>
                <th style={{ padding: '0.75rem' }}>Admin Operator</th>
                <th style={{ padding: '0.75rem' }}>Status Transition</th>
                <th style={{ padding: '0.75rem' }}>Administrative Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <strong style={{ color: '#111827' }}>{log.action}</strong>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: '#15803d' }}>
                      {log.target_name || `${log.target_type} #${log.target_id}`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>
                      {log.target_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#374151' }}>
                    {log.admin_name || 'System Admin'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{log.previous_status}</span>
                    <span style={{ margin: '0 0.3rem', color: '#9ca3af' }}>➔</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111827' }}>{log.new_status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#4b5563', maxWidth: '320px' }}>
                    {log.reason || 'Standard operational update'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

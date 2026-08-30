import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Search, Filter, RefreshCw, AlertCircle, 
  ArrowRight, Truck, MapPin, CheckCircle2, Clock, Zap
} from 'lucide-react';
import { getAdminDonations } from '../../services/adminAPI';
import Timer from '../../components/Timer';
import VerifiedDonorBadge from '../../components/VerifiedDonorBadge';
import '../../styles/dashboard.css';

export default function AdminDonations({ token }) {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminDonations(token);
      if (res.success) {
        setDonations(res.donations || []);
      } else {
        setError(res.message || 'Unable to fetch donations.');
      }
    } catch (err) {
      setError('Connection failure loading platform donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [token]);

  const filteredDonations = donations.filter(d => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (d.food_name || '').toLowerCase().includes(query) ||
                          (d.food_category || '').toLowerCase().includes(query) ||
                          (d.donor_name || '').toLowerCase().includes(query) ||
                          (d.matched_ngo_name || '').toLowerCase().includes(query) ||
                          (d.matched_biogas_name || '').toLowerCase().includes(query) ||
                          String(d.id).includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return ['POSTED', 'MATCHING'].includes(d.status);
    if (statusFilter === 'MATCHED') return ['MATCHED', 'ACCEPTED'].includes(d.status);
    if (statusFilter === 'IN_TRANSIT') return ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status);
    if (statusFilter === 'COMPLETED') return ['DELIVERED', 'COMPLETED'].includes(d.status);
    if (statusFilter === 'CANCELLED') return d.status === 'CANCELLED';
    if (statusFilter === 'BIOGAS') return ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(d.status) || Boolean(d.matched_biogas_name);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            SURPLUS REDISTRIBUTION AUDIT
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Platform Food Surplus Donations 📦
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Real-time audit log of all food surplus listings, NGO matching statuses, and biogas energy redirections.
          </p>
        </div>

        <button onClick={fetchDonations} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Listings
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by food name, donor, matched NGO, biogas plant, or ID..."
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

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'MATCHED', 'IN_TRANSIT', 'COMPLETED', 'BIOGAS', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: statusFilter === st ? '800' : '600',
                background: statusFilter === st ? '#16a34a' : '#f3f4f6',
                color: statusFilter === st ? 'white' : '#4b5563',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Donations Table */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            Loading surplus donations...
          </div>
        ) : filteredDonations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
            <AlertCircle size={36} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#111827' }}>
              No donations available yet.
            </strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'When food donors list surplus food, records will be monitored here in real-time.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Food Details</th>
                <th style={{ padding: '0.75rem' }}>Quantity</th>
                <th style={{ padding: '0.75rem' }}>Donor</th>
                <th style={{ padding: '0.75rem' }}>Matched Destination</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Safety Timer</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((d) => {
                const isBiogas = ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(d.status) || Boolean(d.matched_biogas_name);
                const destName = isBiogas ? d.matched_biogas_name : d.matched_ngo_name;

                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#6b7280' }}>#{d.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#111827', display: 'block', fontSize: '0.92rem' }}>{d.food_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{d.food_category}</span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#111827' }}>
                      {d.quantity} {d.quantity_unit || 'Meals'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#4b5563' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <strong>{d.donor_name || 'Donor'}</strong>
                        <VerifiedDonorBadge isVerified={d.is_donor_verified || d.is_verified} compact={true} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {destName ? (
                        <div>
                          <strong style={{ color: isBiogas ? '#d97706' : '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {isBiogas ? <Zap size={13} /> : <CheckCircle2 size={13} />} {destName}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {isBiogas ? 'Biogas Facility' : 'NGO Shelter'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.82rem' }}>
                          Pending Match Confirmation
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${d.status ? d.status.toLowerCase() : 'posted'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {d.safe_until ? (
                        <Timer safeUntil={d.safe_until} status={d.status} />
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <Link
                        to={`/tracking/${d.id}`}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Truck size={13} /> Journey
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

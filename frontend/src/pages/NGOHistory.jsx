import React, { useState, useEffect } from 'react';
import { getNGOHistory, updateActualPeopleServed } from '../services/ngoAPI';
import {
  History,
  Users,
  Utensils,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  Edit3,
  X,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function NGOHistory({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingDonation, setEditingDonation] = useState(null);
  const [actualCountInput, setActualCountInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getNGOHistory(token);
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleUpdateActualCount = async (e) => {
    e.preventDefault();
    if (!editingDonation) return;
    setError('');
    const count = parseInt(actualCountInput, 10);
    if (isNaN(count) || count <= 0) {
      return setError('Please enter a valid actual number of people served.');
    }

    setUpdating(true);
    try {
      const res = await updateActualPeopleServed(editingDonation.donation_id || editingDonation.id, {
        actualPeopleServed: count
      }, token);

      if (res.success) {
        setUpdateMsg(`✓ Verified actual count (${count} people) updated for Donation #${editingDonation.donation_id || editingDonation.id}.`);
        setEditingDonation(null);
        setActualCountInput('');
        fetchHistory();
      } else {
        setError(res.message || 'Failed to update actual count.');
      }
    } catch (err) {
      setError('Connection error while updating verified count.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const dName = (item.donor_name || '').toLowerCase();
    const fName = (item.food_name || '').toLowerCase();
    const matchesSearch = dName.includes(searchTerm.toLowerCase()) || fName.includes(searchTerm.toLowerCase()) || String(item.donation_id || '').includes(searchTerm);
    const matchesCategory = categoryFilter === 'ALL' || item.food_category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || item.impact_status === statusFilter || (statusFilter === 'ACTUAL' && item.people_served_type === 'ACTUAL');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPeopleServedAll = history.reduce((acc, curr) => acc + (parseInt(curr.people_served) || 0), 0);
  const totalFoodReceivedAll = history.reduce((acc, curr) => acc + (parseFloat(curr.quantity_received || curr.quantity) || 0), 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
        color: '#ffffff',
        padding: '2rem 2.25rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(21, 128, 61, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', letterSpacing: '0.5px' }}>
            DONATION & IMPACT LEDGER
          </span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: '900', marginTop: '0.5rem', color: '#ffffff' }}>
            Donation History & People Benefited 📋
          </h1>
          <p style={{ color: '#dcfce7', fontSize: '0.95rem', margin: '0.3rem 0 0', opacity: 0.9 }}>
            Review every completed food collection, verified received weights, and people served statistics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.15)', padding: '1rem 1.5rem', borderRadius: '16px', backdropFilter: 'blur(4px)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#dcfce7', fontWeight: '700', textTransform: 'uppercase' }}>Total People Benefited</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>~{totalPeopleServedAll.toLocaleString()}</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#dcfce7', fontWeight: '700', textTransform: 'uppercase' }}>Total Food Received</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>{Math.round(totalFoodReceivedAll).toLocaleString()} kg</div>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
          {updateMsg}
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="glass-card" style={{ background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Donor, Food item, or #ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.4rem',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="#64748b" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: '#334155',
              outline: 'none',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Food Categories</option>
            <option value="Cooked gravy-based food">Cooked Gravy Food</option>
            <option value="Cooked dry food">Cooked Dry Food</option>
            <option value="Fresh-cut fruits/vegetables">Fruits & Vegetables</option>
            <option value="Packaged/sealed food">Packaged Food</option>
            <option value="Bakery items">Bakery Items</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.85rem',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: '600',
              color: '#334155',
              outline: 'none',
              background: '#ffffff'
            }}
          >
            <option value="ALL">All Impact Statuses</option>
            <option value="CONFIRMED">Impact Confirmed</option>
            <option value="ACTUAL">Verified Actual Counts Only</option>
          </select>
        </div>

      </div>

      {/* HISTORY TABLE */}
      <div className="glass-card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading donation impact history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No donation records matched your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Donation</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Donor / Partner</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Food Donated</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Food Received</th>
                  <th style={{ padding: '1rem 1.25rem' }}>People Served</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Date</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                {filteredHistory.map((item) => {
                  const donId = item.donation_id || item.id;
                  const isActual = item.people_served_type === 'ACTUAL';
                  const peopleCount = item.people_served_actual || item.people_served_estimate || item.people_served || 0;
                  const formattedDate = new Date(item.impact_confirmed_at || item.created_at || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <tr key={item.match_id || donId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '800' }}>
                        <span style={{ background: '#f1f5f9', color: '#0f172a', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                          #DON-{donId}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', fontWeight: '600' }}>
                          {item.food_name}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building size={14} color="#15803d" />
                          {item.donor_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {item.donor_business_type || 'Hotel'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#475569' }}>
                        {item.quantity} kg
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: '800', color: '#15803d' }}>
                        {item.quantity_received !== null && item.quantity_received !== undefined ? `${item.quantity_received} kg` : `${item.quantity} kg`}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={15} color="#15803d" />
                          <span style={{ fontWeight: '800', color: '#0f172a' }}>
                            {isActual ? peopleCount : `~${peopleCount}`}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginTop: '0.2rem',
                          background: isActual ? '#dcfce7' : '#fef3c7',
                          color: isActual ? '#166534' : '#b45309'
                        }}>
                          {isActual ? '✓ Verified Actual' : '~ Estimated'}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <CheckCircle2 size={12} /> Impact Recorded
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} />
                          {formattedDate}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingDonation(item);
                            setActualCountInput(String(peopleCount));
                          }}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Edit3 size={12} /> Update Count
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE VERIFIED ACTUAL COUNT MODAL */}
      {editingDonation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Update Verified Actual Count 👥
              </h3>
              <button onClick={() => setEditingDonation(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Record the verified post-distribution headcount for <strong>Donation #{editingDonation.donation_id || editingDonation.id}</strong> from <strong>{editingDonation.donor_name}</strong>.
            </p>

            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.65rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateActualCount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem' }}>
                  Verified People Served Count *
                </label>
                <input
                  type="number"
                  min="1"
                  value={actualCountInput}
                  onChange={(e) => setActualCountInput(e.target.value)}
                  placeholder="e.g. 552"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600', marginTop: '0.3rem', display: 'block' }}>
                  This will be recorded as a verified actual headcount across donor and platform impact reports.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  disabled={updating}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#475569',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    flex: 2,
                    padding: '0.7rem',
                    background: '#15803d',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CheckCircle2 size={16} />
                  {updating ? 'Updating...' : 'Save Verified Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Utensils, Factory, Check, X, Ban, RotateCcw, 
  Trash2, Eye, Search, Filter, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { getOrganizations, performOrganizationAction } from '../../services/adminAPI';
import ActionReasonModal from '../../components/ActionReasonModal';
import VerifiedBadge from '../../components/VerifiedBadge';
import '../../styles/dashboard.css';

export default function AdminOrganizations({ token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('type') || 'donors'; // 'donors' | 'ngos' | 'biogas'
  const [data, setData] = useState({ donors: [], ngos: [], biogasPlants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: '',
    entity: null,
    type: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrganizations('', token);
      if (res.success) {
        setData({
          donors: res.donors || [],
          ngos: res.ngos || [],
          biogasPlants: res.biogasPlants || []
        });
      } else {
        setError(res.message || 'Unable to fetch organizations.');
      }
    } catch (err) {
      setError('Failed to connect to platform database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [token]);

  const handleTabChange = (type) => {
    setSearchParams({ type });
    setSearchQuery('');
  };

  const handleOpenActionModal = (action, entity, type) => {
    setModalState({
      isOpen: true,
      action,
      entity,
      type
    });
  };

  const handleConfirmAction = async (reason) => {
    if (!modalState.entity || !modalState.action) return;
    setActionLoading(true);
    try {
      const res = await performOrganizationAction(
        modalState.type,
        modalState.entity.id,
        modalState.action,
        reason,
        token
      );
      if (res.success) {
        setModalState({ isOpen: false, action: '', entity: null, type: '' });
        await fetchOrgs();
      } else {
        alert(res.message || 'Action failed');
      }
    } catch (err) {
      alert('Error executing administrative action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter items based on active tab, search, and status
  const currentList = activeTab === 'donors' ? data.donors : activeTab === 'ngos' ? data.ngos : data.biogasPlants;

  const filteredList = currentList.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = !q || (
      (item.name || item.business_name || item.organization_name || item.plant_name || '').toLowerCase().includes(q) ||
      (item.contact_person || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.legal_registration_number || item.registration_number || '').toLowerCase().includes(q) ||
      (item.ngo_darpan_id || '').toLowerCase().includes(q) ||
      (item.gobardhan_registration_number || '').toLowerCase().includes(q) ||
      (item.mnre_application_id || '').toLowerCase().includes(q) ||
      (item.pan || '').toLowerCase().includes(q) ||
      (item.fssai_number || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q)
    );
    
    if (!nameMatch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'VERIFIED') return item.is_verified && item.is_available;
    if (statusFilter === 'PENDING') return !item.is_verified && item.is_available;
    if (statusFilter === 'SUSPENDED') return !item.is_available;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            ORGANIZATION LIFECYCLE & DIRECTORY
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Organizations Management 👥
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Comprehensive directory for Donors, NGOs, and Biogas Plants across the SmartSurplus ecosystem.
          </p>
        </div>

        <button onClick={fetchOrgs} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Directory
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => handleTabChange('donors')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'donors' ? '800' : '600',
            background: activeTab === 'donors' ? '#16a34a' : 'transparent',
            color: activeTab === 'donors' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Utensils size={16} /> Food Donors ({data.donors.length})
        </button>

        <button
          onClick={() => handleTabChange('ngos')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'ngos' ? '800' : '600',
            background: activeTab === 'ngos' ? '#16a34a' : 'transparent',
            color: activeTab === 'ngos' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Building2 size={16} /> NGOs & Shelters ({data.ngos.length})
        </button>

        <button
          onClick={() => handleTabChange('biogas')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'biogas' ? '800' : '600',
            background: activeTab === 'biogas' ? '#16a34a' : 'transparent',
            color: activeTab === 'biogas' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Factory size={16} /> Biogas Conversion Plants ({data.biogasPlants.length})
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'donors' ? 'donors' : activeTab === 'ngos' ? 'NGOs' : 'biogas plants'} by name, email, phone, location...`}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="#6b7280" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Main Table / Directory List */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
            Loading organization directory...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
            <AlertCircle size={32} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#374151' }}>
              No {activeTab === 'donors' ? 'donors' : activeTab === 'ngos' ? 'NGOs' : 'biogas plants'} registered yet.
            </strong>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {searchQuery ? 'Try adjusting your search criteria.' : 'Registered organization records will populate this table automatically.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Organization / Name</th>
                <th style={{ padding: '0.75rem' }}>Contact Info</th>
                <th style={{ padding: '0.75rem' }}>Location / Address</th>
                {activeTab === 'donors' && (
                  <>
                    <th style={{ padding: '0.75rem' }}>Total Donations</th>
                    <th style={{ padding: '0.75rem' }}>Active / Completed</th>
                  </>
                )}
                {activeTab === 'ngos' && (
                  <>
                    <th style={{ padding: '0.75rem' }}>Capacity</th>
                    <th style={{ padding: '0.75rem' }}>Received / Beneficiaries</th>
                  </>
                )}
                {activeTab === 'biogas' && (
                  <>
                    <th style={{ padding: '0.75rem' }}>Processing Capacity</th>
                    <th style={{ padding: '0.75rem' }}>Waste Diverted</th>
                  </>
                )}
                <th style={{ padding: '0.75rem' }}>Verification</th>
                <th style={{ padding: '0.75rem' }}>Account Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => {
                const displayName = item.name || item.business_name || item.organization_name || item.plant_name;
                const isVerified = item.is_verified;
                const isSuspended = !item.is_available;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '700', color: '#6b7280' }}>#{item.id}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.92rem', flexWrap: 'wrap' }}>
                        <span>{displayName}</span>
                        <VerifiedBadge
                          type={activeTab === 'ngos' ? 'NGO' : activeTab === 'biogas' ? 'BIOGAS' : 'DONOR'}
                          isVerified={Boolean(isVerified)}
                          status={item.verification_status}
                          isAvailable={!isSuspended}
                          compact={true}
                        />
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {item.business_type || item.ngo_type || 'Biogas Facility'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#4b5563' }}>
                      <div>{item.email}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.phone}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#4b5563', maxWidth: '220px' }}>
                      <span style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.address || 'Location on file'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Reg: {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Donor Specific Cols */}
                    {activeTab === 'donors' && (
                      <>
                        <td style={{ padding: '0.75rem', fontWeight: '700', color: '#111827' }}>
                          {item.total_donations || 0}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#15803d', fontWeight: '700' }}>
                          {item.active_donations || 0} Active / {item.completed_donations || 0} Done
                        </td>
                      </>
                    )}

                    {/* NGO Specific Cols */}
                    {activeTab === 'ngos' && (
                      <>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: '700', color: '#0369a1' }}>{item.food_capacity || 150} Meals</span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#15803d', fontWeight: '700' }}>
                          {item.donations_received || 0} Rec / {item.beneficiaries_served || 0} Serv
                        </td>
                      </>
                    )}

                    {/* Biogas Specific Cols */}
                    {activeTab === 'biogas' && (
                      <>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontWeight: '700', color: '#d97706' }}>{item.processing_capacity || 500} kg/day</span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#15803d', fontWeight: '700' }}>
                          {item.waste_processed_kg || 0} kg
                        </td>
                      </>
                    )}

                    {/* Verification Status */}
                    <td style={{ padding: '0.75rem' }}>
                      {isVerified ? (
                        <span style={{ color: '#15803d', fontWeight: '700', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Verified
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: '700', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td style={{ padding: '0.75rem' }}>
                      {isSuspended ? (
                        <span style={{ color: '#dc2626', fontWeight: '700', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                          Suspended
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: '700', background: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                          Active
                        </span>
                      )}
                    </td>

                    {/* Action Controls */}
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/admin/organizations/${activeTab}/${item.id}`)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                          title="View Full Profile & Activity"
                        >
                          <Eye size={13} /> View
                        </button>

                        {/* Verify if not verified */}
                        {!isVerified && (
                          <button
                            onClick={() => handleOpenActionModal('VERIFY', item, activeTab)}
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                            title="Verify Organization"
                          >
                            <Check size={13} /> Verify
                          </button>
                        )}

                        {/* Reject if pending */}
                        {!isVerified && (
                          <button
                            onClick={() => handleOpenActionModal('REJECT', item, activeTab)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5' }}
                            title="Reject Verification"
                          >
                            <X size={13} />
                          </button>
                        )}

                        {/* Suspend if active, Reactivate if suspended */}
                        {isSuspended ? (
                          <button
                            onClick={() => handleOpenActionModal('REACTIVATE', item, activeTab)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#16a34a', borderColor: '#86efac' }}
                            title="Reactivate Account"
                          >
                            <RotateCcw size={13} /> Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenActionModal('SUSPEND', item, activeTab)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#ea580c', borderColor: '#fdba74' }}
                            title="Suspend Account"
                          >
                            <Ban size={13} />
                          </button>
                        )}

                        {/* Remove / Soft-Delete */}
                        <button
                          onClick={() => handleOpenActionModal('REMOVE', item, activeTab)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#991b1b', borderColor: '#fecaca' }}
                          title="Remove Organization"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Reason Confirmation Modal */}
      <ActionReasonModal
        isOpen={modalState.isOpen}
        action={modalState.action}
        entityName={modalState.entity?.name || modalState.entity?.business_name || modalState.entity?.organization_name || modalState.entity?.plant_name || 'Organization'}
        entityType={activeTab.slice(0, -1).toUpperCase()}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => setModalState({ isOpen: false, action: '', entity: null, type: '' })}
      />
    </div>
  );
}

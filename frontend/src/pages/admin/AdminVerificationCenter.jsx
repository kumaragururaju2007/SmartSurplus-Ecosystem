import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Check, X, Ban, RotateCcw, Building2, 
  Utensils, Factory, FileText, MapPin, Mail, Phone, RefreshCw, 
  AlertCircle, Search, Eye, ExternalLink, Clock, ShieldAlert, 
  CheckCircle2, XCircle, ChevronRight, Layers, Zap
} from 'lucide-react';
import { getVerificationQueue, performOrganizationAction, performDocumentAction } from '../../services/adminAPI';
import ActionReasonModal from '../../components/ActionReasonModal';
import VerifiedBadge from '../../components/VerifiedBadge';
import Map from '../../components/Map';
import '../../styles/dashboard.css';

export default function AdminVerificationCenter({ token }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'verified' | 'rejected' | 'suspended'
  const [queue, setQueue] = useState({ pending: [], verified: [], rejected: [], suspended: [] });
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'NGO' | 'DONOR' | 'BIOGAS'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Entity for Full Review Dossier Drawer / Modal
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Modal State for Org-level Actions
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: '',
    entity: null,
    type: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State for Individual Document-level Action
  const [docModalState, setDocModalState] = useState({
    isOpen: false,
    action: '',
    doc: null,
    entity: null,
    type: ''
  });

  // Modal State for Full File / Certificate Preview
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getVerificationQueue(token);
      if (res.success) {
        setQueue({
          pending: res.pending || [],
          verified: res.verified || [],
          rejected: res.rejected || [],
          suspended: res.suspended || []
        });

        // Update selectedEntity if it's currently open
        if (selectedEntity) {
          const allList = [...(res.pending || []), ...(res.verified || []), ...(res.rejected || []), ...(res.suspended || [])];
          const updated = allList.find(item => item.id === selectedEntity.id && item.type === selectedEntity.type);
          if (updated) setSelectedEntity(updated);
        }
      } else {
        setError(res.message || 'Failed to load verification queue.');
      }
    } catch (err) {
      setError('Connection failure loading verification center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [token]);

  const handleOpenAction = (action, entity) => {
    const orgType = entity.type === 'NGO' ? 'ngos' : entity.type === 'DONOR' ? 'donors' : 'biogas';
    setModalState({
      isOpen: true,
      action,
      entity,
      type: orgType
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
        await fetchQueue();
      } else {
        alert(res.message || 'Action could not be executed.');
      }
    } catch (err) {
      alert('Error updating organization status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentAction = async (doc, action, reason = '') => {
    if (!selectedEntity) return;
    const orgType = selectedEntity.type === 'NGO' ? 'ngos' : selectedEntity.type === 'DONOR' ? 'donors' : 'biogas';
    
    if (action === 'REJECT' && !reason) {
      setDocModalState({
        isOpen: true,
        action: 'REJECT',
        doc,
        entity: selectedEntity,
        type: orgType
      });
      return;
    }

    try {
      const res = await performDocumentAction(orgType, selectedEntity.id, doc.id, action, reason, token);
      if (res.success) {
        setDocModalState({ isOpen: false, action: '', doc: null, entity: null, type: '' });
        await fetchQueue();
      } else {
        alert(res.message || 'Document action failed.');
      }
    } catch (err) {
      alert('Error updating document status.');
    }
  };

  const currentList = queue[activeTab] || [];
  const filteredList = currentList.filter(item => {
    const matchType = typeFilter === 'ALL' || item.type === typeFilter;
    if (!matchType) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.contact_person && item.contact_person.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.phone && item.phone.toLowerCase().includes(q)) ||
      (item.registration_number && item.registration_number.toLowerCase().includes(q)) ||
      (item.ngo_darpan_id && item.ngo_darpan_id.toLowerCase().includes(q)) ||
      (item.gobardhan_registration_number && item.gobardhan_registration_number.toLowerCase().includes(q)) ||
      (item.mnre_application_id && item.mnre_application_id.toLowerCase().includes(q)) ||
      (item.pan && item.pan.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            REGULATORY COMPLIANCE & VERIFICATION SYSTEM
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111827', margin: '0.4rem 0 0.2rem 0' }}>
            Platform Verification Center
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            Audit authentic legal certificates, DARPAN IDs, GOBARdhan numbers, and physical facility coordinates before issuing verification badges.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}
        >
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          Refresh Records
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.85rem 1.2rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Status Tabs (Pending / Verified / Rejected / Suspended) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '1.1rem',
            borderRadius: '12px',
            border: activeTab === 'pending' ? '2px solid #d97706' : '1px solid #e5e7eb',
            background: activeTab === 'pending' ? '#fffbeb' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b45309' }}>PENDING AUDIT</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', marginTop: '0.2rem' }}>
              {queue.pending.length}
            </div>
          </div>
          <Clock size={26} color="#d97706" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          style={{
            padding: '1.1rem',
            borderRadius: '12px',
            border: activeTab === 'verified' ? '2px solid #16a34a' : '1px solid #e5e7eb',
            background: activeTab === 'verified' ? '#f0fdf4' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#15803d' }}>VERIFIED ✓ ACTIVE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', marginTop: '0.2rem' }}>
              {queue.verified.length}
            </div>
          </div>
          <ShieldCheck size={26} color="#16a34a" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          style={{
            padding: '1.1rem',
            borderRadius: '12px',
            border: activeTab === 'rejected' ? '2px solid #dc2626' : '1px solid #e5e7eb',
            background: activeTab === 'rejected' ? '#fef2f2' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b91c1c' }}>REJECTED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', marginTop: '0.2rem' }}>
              {queue.rejected.length}
            </div>
          </div>
          <XCircle size={26} color="#dc2626" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suspended')}
          style={{
            padding: '1.1rem',
            borderRadius: '12px',
            border: activeTab === 'suspended' ? '2px solid #4b5563' : '1px solid #e5e7eb',
            background: activeTab === 'suspended' ? '#f3f4f6' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4b5563' }}>SUSPENDED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', marginTop: '0.2rem' }}>
              {queue.suspended.length}
            </div>
          </div>
          <Ban size={26} color="#4b5563" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.2rem', borderRadius: '12px', background: '#ffffff', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'NGO', 'BIOGAS', 'DONOR'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '8px',
                border: typeFilter === t ? '2px solid #111827' : '1px solid #e5e7eb',
                background: typeFilter === t ? '#111827' : '#ffffff',
                color: typeFilter === t ? '#ffffff' : '#374151',
                fontSize: '0.8rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {t === 'ALL' ? 'All Types' : t === 'NGO' ? 'NGOs' : t === 'BIOGAS' ? 'Biogas Facilities' : 'Food Donors'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '300px', flex: '1', maxWidth: '420px' }}>
          <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Name, DARPAN ID, GOBARdhan, Reg No, PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#6b7280', fontWeight: '600' }}>Loading verification records...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', borderRadius: '14px', background: '#ffffff' }}>
          <ShieldCheck size={44} color="#9ca3af" style={{ margin: '0 auto 0.8rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: '0 0 0.4rem 0' }}>
            No records match the current filter
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {activeTab === 'pending' ? 'All submitted organizations and documents have been audited!' : 'No organizations found in this status category.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredList.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="glass-card"
              style={{
                padding: '1.5rem',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.2rem'
              }}
            >
              <div style={{ flex: '1', minWidth: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    background: item.type === 'NGO' ? '#dcfce7' : item.type === 'BIOGAS' ? '#fef3c7' : '#eff6ff',
                    color: item.type === 'NGO' ? '#15803d' : item.type === 'BIOGAS' ? '#b45309' : '#1d4ed8'
                  }}>
                    {item.type}
                  </span>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>
                    {item.name}
                  </h3>

                  <VerifiedBadge
                    type={item.type}
                    isVerified={Boolean(item.is_verified)}
                    status={item.verification_status}
                    isAvailable={Boolean(item.is_available)}
                    compact
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.8rem', fontSize: '0.82rem', color: '#4b5563' }}>
                  <div>
                    <strong style={{ color: '#111827' }}>Registration:</strong> {item.registration_number || 'Under Filing'}
                  </div>
                  {item.ngo_darpan_id && (
                    <div>
                      <strong style={{ color: '#15803d' }}>DARPAN ID:</strong> {item.ngo_darpan_id}
                    </div>
                  )}
                  {item.gobardhan_registration_number && (
                    <div>
                      <strong style={{ color: '#b45309' }}>GOBARdhan:</strong> {item.gobardhan_registration_number}
                    </div>
                  )}
                  {item.pan && (
                    <div>
                      <strong style={{ color: '#111827' }}>PAN:</strong> {item.pan}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: '#111827' }}>Contact:</strong> {item.contact_person} ({item.phone || item.email})
                  </div>
                  <div>
                    <strong style={{ color: '#111827' }}>Location:</strong> {item.city || 'Coordinates provided'}, {item.state || ''}
                  </div>
                  <div>
                    <strong style={{ color: '#111827' }}>Documents:</strong> {(item.documents || []).length} Attached
                  </div>
                </div>

                {/* Attached Documents Quick Tags */}
                {item.documents && item.documents.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                    {item.documents.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: d.status === 'VERIFIED' ? '#dcfce7' : d.status === 'REJECTED' ? '#fee2e2' : '#f3f4f6',
                          color: d.status === 'VERIFIED' ? '#15803d' : d.status === 'REJECTED' ? '#b91c1c' : '#4b5563'
                        }}
                      >
                        📄 {d.document_type} ({d.status})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedEntity(item)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', padding: '0.5rem 0.85rem' }}
                >
                  <Eye size={15} /> Review Dossier
                </button>

                {activeTab === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenAction('VERIFY', item)}
                      className="btn-primary"
                      style={{ background: '#16a34a', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '800', padding: '0.5rem 0.85rem' }}
                    >
                      <Check size={15} /> Verify ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAction('REJECT', item)}
                      className="btn-secondary"
                      style={{ color: '#dc2626', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', padding: '0.5rem 0.85rem' }}
                    >
                      <X size={15} /> Reject
                    </button>
                  </>
                )}

                {activeTab === 'verified' && (
                  <button
                    type="button"
                    onClick={() => handleOpenAction('SUSPEND', item)}
                    className="btn-secondary"
                    style={{ color: '#4b5563', borderColor: '#d1d5db', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '700', padding: '0.5rem 0.85rem' }}
                  >
                    <Ban size={15} /> Suspend
                  </button>
                )}

                {(activeTab === 'rejected' || activeTab === 'suspended') && (
                  <button
                    type="button"
                    onClick={() => handleOpenAction('REACTIVATE', item)}
                    className="btn-primary"
                    style={{ background: '#16a34a', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: '800', padding: '0.5rem 0.85rem' }}
                  >
                    <RotateCcw size={15} /> Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================================= */}
      {/* REVIEW DOSSIER DRAWER / MODAL */}
      {/* ======================================================================= */}
      {selectedEntity && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 999 }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '780px', height: '100%', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)' }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  {selectedEntity.type} VERIFICATION DOSSIER
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0.3rem 0 0 0', color: '#111827' }}>
                  {selectedEntity.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Badges */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <VerifiedBadge
                type={selectedEntity.type}
                isVerified={Boolean(selectedEntity.is_verified)}
                status={selectedEntity.verification_status}
                isAvailable={Boolean(selectedEntity.is_available)}
              />
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Registered: {new Date(selectedEntity.created_at || Date.now()).toLocaleDateString()}</span>
            </div>

            {/* Section 1: Identification & Legal Certs */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.2rem', background: '#fafafa' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                Legal & Identification Records
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#6b7280' }}>Registration No:</span> <strong>{selectedEntity.registration_number || 'Not provided'}</strong></div>
                {selectedEntity.registration_authority && <div><span style={{ color: '#6b7280' }}>Authority:</span> <strong>{selectedEntity.registration_authority}</strong></div>}
                {selectedEntity.ngo_darpan_id && <div><span style={{ color: '#6b7280' }}>DARPAN ID:</span> <strong style={{ color: '#15803d' }}>{selectedEntity.ngo_darpan_id}</strong></div>}
                {selectedEntity.gobardhan_registration_number && <div><span style={{ color: '#6b7280' }}>GOBARdhan ID:</span> <strong style={{ color: '#b45309' }}>{selectedEntity.gobardhan_registration_number}</strong></div>}
                {selectedEntity.mnre_application_id && <div><span style={{ color: '#6b7280' }}>MNRE ID:</span> <strong>{selectedEntity.mnre_application_id}</strong></div>}
                {selectedEntity.pan && <div><span style={{ color: '#6b7280' }}>PAN No:</span> <strong>{selectedEntity.pan}</strong></div>}
                {selectedEntity.tax_12a_12ab && <div><span style={{ color: '#6b7280' }}>12A / 12AB:</span> <strong>{selectedEntity.tax_12a_12ab}</strong></div>}
                {selectedEntity.tax_80g && <div><span style={{ color: '#6b7280' }}>80G Number:</span> <strong>{selectedEntity.tax_80g}</strong></div>}
                {selectedEntity.fcra_number && <div><span style={{ color: '#6b7280' }}>FCRA No:</span> <strong>{selectedEntity.fcra_number}</strong></div>}
              </div>
            </div>

            {/* Section 2: Contact & Representative */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.2rem', background: '#fafafa' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                Authorized Representative & Contact
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: '#6b7280' }}>Contact Person:</span> <strong>{selectedEntity.contact_person || 'Not provided'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Designation:</span> <strong>{selectedEntity.designation || 'Authorized Representative'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Email Address:</span> <strong>{selectedEntity.email || 'Not provided'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Mobile Phone:</span> <strong>{selectedEntity.phone || 'Not provided'}</strong></div>
              </div>
            </div>

            {/* Section 3: Physical Address & Map */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.2rem', background: '#fafafa' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                Physical Location & Verified Map Pin
              </h4>
              <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#374151' }}>
                📍 {selectedEntity.address || 'Address not provided'} {selectedEntity.city ? `• ${selectedEntity.city}` : ''} {selectedEntity.pincode ? `• PIN: ${selectedEntity.pincode}` : ''}
              </p>

              {selectedEntity.latitude && selectedEntity.longitude ? (
                <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <Map
                    center={[parseFloat(selectedEntity.latitude), parseFloat(selectedEntity.longitude)]}
                    markers={[{ lat: parseFloat(selectedEntity.latitude), lng: parseFloat(selectedEntity.longitude), title: selectedEntity.name }]}
                    zoom={14}
                  />
                </div>
              ) : (
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', fontWeight: '600' }}>
                  ⚠️ No exact GPS coordinates provided for this facility.
                </div>
              )}
            </div>

            {/* Section 4: Attached Verification Documents & Auditing */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.2rem', background: '#ffffff' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                Official Uploaded Certificates ({(selectedEntity.documents || []).length})
              </h4>

              {(!selectedEntity.documents || selectedEntity.documents.length === 0) ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', color: '#6b7280', fontSize: '0.85rem' }}>
                  No supporting certificates uploaded by this organization yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedEntity.documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        background: '#fafafa'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileText size={16} color="#15803d" />
                          <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{doc.document_type}</strong>
                          <span style={{
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            background: doc.status === 'VERIFIED' ? '#dcfce7' : doc.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                            color: doc.status === 'VERIFIED' ? '#15803d' : doc.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                          }}>
                            {doc.status === 'VERIFIED' ? '✓ Verified' : doc.status === 'REJECTED' ? 'Rejected' : 'Under Review'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>
                          {doc.document_name} ({doc.file_size || 'Attached File'})
                        </div>
                        {doc.rejection_reason && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem' }}>
                            Reason: {doc.rejection_reason}
                          </div>
                        )}
                      </div>

                      {/* Document Actions: View / Verify / Reject */}
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={13} /> View Certificate
                        </button>

                        {doc.status !== 'VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleDocumentAction(doc, 'VERIFY')}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: '800', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleDocumentAction(doc, 'REJECT')}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', background: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions for Organization Status */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.2rem', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.2rem', fontWeight: '700' }}
              >
                Close Dossier
              </button>

              <button
                type="button"
                onClick={() => handleOpenAction('VERIFY', selectedEntity)}
                className="btn-primary"
                style={{ background: '#16a34a', border: 'none', padding: '0.6rem 1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Check size={16} /> Issue Verified ✓ Badge
              </button>

              <button
                type="button"
                onClick={() => handleOpenAction('REJECT', selectedEntity)}
                className="btn-secondary"
                style={{ color: '#dc2626', borderColor: '#fecaca', padding: '0.6rem 1.2rem', fontWeight: '700' }}
              >
                <X size={16} /> Reject Registration
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* FULL DOCUMENT / CERTIFICATE PREVIEW MODAL */}
      {/* ======================================================================= */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            
            {/* Preview Modal Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={22} color="#15803d" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                    {previewDoc.document_type}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    {previewDoc.document_name} • {previewDoc.file_size || 'Attached File'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {previewDoc.file_url && (
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download={previewDoc.document_name}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ExternalLink size={14} /> Open in New Tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: '#e5e7eb', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '800', color: '#374151' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Modal Content Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', minHeight: '350px' }}>
              {previewDoc.file_url ? (
                previewDoc.file_url.startsWith('data:image/') || previewDoc.document_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.document_name}
                    style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                ) : (
                  <iframe
                    src={previewDoc.file_url}
                    title={previewDoc.document_name}
                    style={{ width: '100%', height: '550px', border: 'none', borderRadius: '8px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#fff', borderRadius: '12px', maxWidth: '450px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <FileText size={54} color="#15803d" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontWeight: '800' }}>Official Document Attached</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: '0 0 1.2rem 0' }}>
                    {previewDoc.document_type} on file for administrative compliance review.
                  </p>
                  <span style={{ display: 'inline-block', background: '#dcfce7', color: '#15803d', fontWeight: '800', fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '999px' }}>
                    Status: {previewDoc.status}
                  </span>
                </div>
              )}
            </div>

            {/* Preview Modal Footer Controls */}
            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: previewDoc.status === 'VERIFIED' ? '#15803d' : previewDoc.status === 'REJECTED' ? '#dc2626' : '#d97706' }}>
                Current Status: {previewDoc.status === 'VERIFIED' ? '✓ Verified Certificate' : previewDoc.status === 'REJECTED' ? 'Rejected' : 'Pending Review'}
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {previewDoc.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDocumentAction(previewDoc, 'VERIFY');
                      setPreviewDoc(null);
                    }}
                    style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: '800', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    ✓ Approve Certificate
                  </button>
                )}
                {previewDoc.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = previewDoc;
                      setPreviewDoc(null);
                      handleDocumentAction(d, 'REJECT');
                    }}
                    style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: '700', background: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    ✕ Reject Certificate
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Org-level Action Reason Modal */}
      <ActionReasonModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, action: '', entity: null, type: '' })}
        onConfirm={handleConfirmAction}
        action={modalState.action}
        entityName={modalState.entity?.name || 'Organization'}
        loading={actionLoading}
      />

      {/* Document-level Action Reason Modal */}
      <ActionReasonModal
        isOpen={docModalState.isOpen}
        onClose={() => setDocModalState({ isOpen: false, action: '', doc: null, entity: null, type: '' })}
        onConfirm={(reason) => handleDocumentAction(docModalState.doc, 'REJECT', reason)}
        action="REJECT_DOCUMENT"
        entityName={docModalState.doc?.document_type || 'Document'}
        loading={false}
      />
    </div>
  );
}

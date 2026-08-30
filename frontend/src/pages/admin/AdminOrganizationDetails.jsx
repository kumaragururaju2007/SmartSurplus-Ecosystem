import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Utensils, Factory, ShieldCheck, 
  MapPin, Phone, Mail, Calendar, CheckCircle2, AlertCircle, RefreshCw, 
  Clock, History, FileText, Check, X, Ban, RotateCcw, Zap, ExternalLink
} from 'lucide-react';
import { getOrganizationDetails, performOrganizationAction, performDocumentAction } from '../../services/adminAPI';
import ActionReasonModal from '../../components/ActionReasonModal';
import VerifiedBadge from '../../components/VerifiedBadge';
import Map from '../../components/Map';
import DonorProfileCard from '../../components/DonorProfileCard';
import '../../styles/dashboard.css';

export default function AdminOrganizationDetails({ token }) {
  const { type, id } = useParams(); // type: 'donors' | 'ngos' | 'biogas'
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for Org
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State for Document
  const [docModalState, setDocModalState] = useState({
    isOpen: false,
    doc: null
  });

  // Modal State for File / Certificate Preview
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrganizationDetails(type, id, token);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Failed to load organization profile.');
      }
    } catch (err) {
      setError('Database error loading organization details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [type, id, token]);

  const handleConfirmAction = async (reason) => {
    setActionLoading(true);
    try {
      const res = await performOrganizationAction(type, id, modalState.action, reason, token);
      if (res.success) {
        setModalState({ isOpen: false, action: '' });
        await fetchDetails();
      } else {
        alert(res.message || 'Action failed');
      }
    } catch (err) {
      alert('Error updating organization status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentAction = async (doc, action, reason = '') => {
    if (action === 'REJECT' && !reason) {
      setDocModalState({
        isOpen: true,
        doc
      });
      return;
    }

    try {
      const res = await performDocumentAction(type, id, doc.id, action, reason, token);
      if (res.success) {
        setDocModalState({ isOpen: false, doc: null });
        await fetchDetails();
      } else {
        alert(res.message || 'Document action failed.');
      }
    } catch (err) {
      alert('Error auditing document.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 0.75rem' }} />
        Loading organization verification dossier and platform activity...
      </div>
    );
  }

  if (error || !data?.details) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#dc2626', fontSize: '1.3rem', fontWeight: '800' }}>Organization Not Found</h3>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 1.5rem' }}>{error || 'No matching organization records located.'}</p>
        <button onClick={() => navigate('/admin/organizations')} className="btn-primary">
          <ArrowLeft size={16} /> Return to Directory
        </button>
      </div>
    );
  }

  const org = data.details;
  const activityHistory = data.activityHistory || [];
  const auditLogs = data.auditLogs || [];
  const documents = org.documents || [];
  const orgName = org.organization_name || org.business_name || org.plant_name || org.name;
  const isVerified = Boolean(org.is_verified);
  const isAvailable = Boolean(org.is_available);
  const verificationStatus = org.verification_status || (isVerified ? 'VERIFIED' : 'PENDING');
  const orgTypeUpper = type === 'ngos' ? 'NGO' : type === 'biogas' ? 'BIOGAS' : 'DONOR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Back Button & Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => navigate(`/admin/organizations?type=${type}`)}
          className="btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Organizations Directory
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!isVerified && (
            <button
              onClick={() => setModalState({ isOpen: true, action: 'VERIFY' })}
              className="btn-primary"
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', background: '#16a34a', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Check size={16} /> Issue Verified ✓ Badge
            </button>
          )}

          {!isVerified && (
            <button
              onClick={() => setModalState({ isOpen: true, action: 'REJECT' })}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <X size={16} /> Reject Registration
            </button>
          )}

          <button
            onClick={() => setModalState({ isOpen: true, action: isAvailable ? 'SUSPEND' : 'REACTIVATE' })}
            className="btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              color: isAvailable ? '#ea580c' : '#16a34a',
              borderColor: isAvailable ? '#fdba74' : '#86efac'
            }}
          >
            {isAvailable ? 'Suspend Account' : 'Reactivate Account'}
          </button>
        </div>
      </div>

      {/* Profile Overview Glass Card */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: type === 'donors' ? '#eff6ff' : type === 'ngos' ? '#f0fdf4' : '#fffbeb',
              color: type === 'donors' ? '#2563eb' : type === 'ngos' ? '#16a34a' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {type === 'donors' ? <Utensils size={28} /> : type === 'ngos' ? <Building2 size={28} /> : <Factory size={28} />}
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase' }}>
                {orgTypeUpper} OFFICIAL RECORD
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#111827', margin: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>{orgName}</span>
                <VerifiedBadge 
                  type={orgTypeUpper}
                  isVerified={isVerified}
                  status={verificationStatus}
                  isAvailable={isAvailable}
                />
              </h1>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Registration No: <strong>{org.legal_registration_number || org.registration_number || org.gobardhan_registration_number || org.fssai_number || 'N/A'}</strong> | Entity ID: #{org.id}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block' }}>Authorized Representative</span>
            <div style={{ fontSize: '0.95rem', color: '#111827', fontWeight: '700', marginTop: '0.2rem' }}>
              {org.contact_person || 'Not specified'} ({org.designation || 'Representative'})
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
              <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} /> {org.email || 'Not provided'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.2rem' }}>
              <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} /> {org.phone || 'Not provided'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block' }}>Physical Address</span>
            <div style={{ fontSize: '0.9rem', color: '#111827', fontWeight: '600', marginTop: '0.2rem' }}>
              {org.address || 'Address not provided'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.2rem' }}>
              {org.city || 'N/A'}, {org.state || ''} {org.pincode ? `• PIN: ${org.pincode}` : ''}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block' }}>Compliance & Legal Identifiers</span>
            {type === 'ngos' && (
              <div style={{ fontSize: '0.85rem', color: '#111827', marginTop: '0.2rem', lineHeight: '1.4' }}>
                <div><strong>DARPAN ID:</strong> {org.ngo_darpan_id || 'Not registered'}</div>
                <div><strong>PAN:</strong> {org.pan || 'Not provided'}</div>
                <div><strong>12A/80G:</strong> {org.tax_12a_12ab || 'None'} / {org.tax_80g || 'None'}</div>
              </div>
            )}
            {type === 'biogas' && (
              <div style={{ fontSize: '0.85rem', color: '#111827', marginTop: '0.2rem', lineHeight: '1.4' }}>
                <div><strong>GOBARdhan:</strong> {org.gobardhan_registration_number || 'Not registered'}</div>
                <div><strong>MNRE ID:</strong> {org.mnre_application_id || 'Not provided'}</div>
                <div><strong>Capacity:</strong> {org.feedstock_capacity_daily || org.processing_capacity || '0'} {org.capacity_unit || 'kg/day'}</div>
              </div>
            )}
            {type === 'donors' && (
              <div style={{ fontSize: '0.85rem', color: '#111827', marginTop: '0.2rem', lineHeight: '1.4' }}>
                <div><strong>FSSAI Number:</strong> {org.fssai_number || 'Not Submitted'}</div>
                <div><strong>Type:</strong> {org.business_type || 'Food Provider'}</div>
                <div><strong>Status:</strong> {org.fssai_status || 'PENDING'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Physical Map Preview */}
        {org.latitude && org.longitude && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1.2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>
              📍 Geo-Hub Map Location (Lat: {org.latitude}, Lng: {org.longitude})
            </span>
            <div style={{ height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <Map
                center={[parseFloat(org.latitude), parseFloat(org.longitude)]}
                markers={[{ lat: parseFloat(org.latitude), lng: parseFloat(org.longitude), title: orgName }]}
                zoom={14}
              />
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents Dossier Section */}
      <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
          <FileText size={22} color="#15803d" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#111827' }}>
            Official Legal & Supporting Documents ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '10px', color: '#6b7280', fontSize: '0.9rem' }}>
            No legal certificates attached to this profile.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{doc.document_type}</strong>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    background: doc.status === 'VERIFIED' ? '#dcfce7' : doc.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                    color: doc.status === 'VERIFIED' ? '#15803d' : doc.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                  }}>
                    {doc.status === 'VERIFIED' ? '✓ Verified' : doc.status === 'REJECTED' ? 'Rejected' : 'Under Review'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {doc.document_name} ({doc.file_size || 'PDF'})
                </div>
                {doc.rejection_reason && (
                  <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', padding: '0.35rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                    Rejection note: {doc.rejection_reason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FileText size={13} /> View File
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

      {/* Full Document / Certificate Preview Modal */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            
            {/* Header */}
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

            {/* Content Body */}
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

            {/* Footer */}
            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: previewDoc.status === 'VERIFIED' ? '#15803d' : previewDoc.status === 'REJECTED' ? '#dc2626' : '#d97706' }}>
                Status: {previewDoc.status === 'VERIFIED' ? '✓ Verified' : previewDoc.status === 'REJECTED' ? 'Rejected' : 'Pending Review'}
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
                    ✓ Approve
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
                    ✕ Reject
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Action Reason Modal */}
      <ActionReasonModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, action: '' })}
        onConfirm={handleConfirmAction}
        action={modalState.action}
        entityName={orgName}
        loading={actionLoading}
      />

      {/* Document Rejection Modal */}
      <ActionReasonModal
        isOpen={docModalState.isOpen}
        onClose={() => setDocModalState({ isOpen: false, doc: null })}
        onConfirm={(reason) => handleDocumentAction(docModalState.doc, 'REJECT', reason)}
        action="REJECT_DOCUMENT"
        entityName={docModalState.doc?.document_type || 'Document'}
        loading={false}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import DonorProfileCard from './DonorProfileCard';
import { getPublicDonorProfile } from '../services/donationAPI';

export default function DonorProfileModal({ isOpen, onClose, donorId, initialData, token }) {
  const [donorData, setDonorData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData && Boolean(donorId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setDonorData(initialData);
      setLoading(false);
    } else if (isOpen && donorId) {
      setLoading(true);
      setError('');
      getPublicDonorProfile(donorId, token)
        .then(res => {
          if (res.success && res.donor) {
            setDonorData(res.donor);
          } else {
            setError(res.message || 'Unable to retrieve donor credentials.');
          }
        })
        .catch(() => setError('Connection failure loading donor profile.'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, donorId, initialData, token]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #f3f4f6',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>
                Donor Trust & Verification Profile
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                Platform Authenticated Partner Dossier
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4b5563',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#e5e7eb')}
            onMouseOut={e => (e.currentTarget.style.background = '#f3f4f6')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 0', color: '#6b7280' }}>
              <RefreshCw className="animate-spin" size={30} style={{ margin: '0 auto 0.75rem', color: '#16a34a' }} />
              <p style={{ margin: 0, fontSize: '0.92rem' }}>Verifying platform credentials...</p>
            </div>
          ) : error ? (
            <div style={{
              padding: '1.5rem',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: '700', margin: 0 }}>{error}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <DonorProfileCard donor={donorData} showDetailedTable={true} />

              <div style={{
                marginTop: '0.5rem',
                padding: '0.9rem 1.1rem',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                fontSize: '0.82rem',
                color: '#166534',
                lineHeight: '1.45'
              }}>
                <strong>🛡️ Food Safety & Authenticity Guarantee:</strong> This donor's FSSAI credentials and facility identity have been checked against official regulatory records to ensure compliant and safe food redistribution.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#fafafa',
          borderRadius: '0 0 20px 20px'
        }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '0.55rem 1.5rem', fontSize: '0.88rem' }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

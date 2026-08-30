import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export default function ActionReasonModal({
  isOpen,
  action, // 'REJECT' | 'SUSPEND' | 'REMOVE' | 'REACTIVATE' | 'VERIFY'
  entityName,
  entityType = 'Organization',
  onConfirm,
  onClose,
  loading = false
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isDestructive = action === 'REMOVE' || action === 'REJECT' || action === 'SUSPEND';

  const handleConfirm = () => {
    if (isDestructive && !reason.trim()) {
      setError('Please provide a specific reason for this action.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  const getActionTitle = () => {
    switch (action) {
      case 'VERIFY': return `Verify ${entityType}`;
      case 'REJECT': return `Reject ${entityType} Verification`;
      case 'SUSPEND': return `Suspend ${entityType}`;
      case 'REACTIVATE': return `Reactivate ${entityType}`;
      case 'REMOVE': return `Remove ${entityType}`;
      default: return `${action} ${entityType}`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af'
          }}
        >
          <X size={20} />
        </button>

        {/* Header with Warning Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: isDestructive ? '#fee2e2' : '#f0fdf4',
            color: isDestructive ? '#dc2626' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isDestructive ? <AlertTriangle size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
              {getActionTitle()}
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Target: <strong style={{ color: '#111827' }}>{entityName}</strong>
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem', lineHeight: '1.5' }}>
          {isDestructive 
            ? `Please specify the administrative reason for this action. This will be logged in the immutable platform audit log.`
            : `Are you sure you want to confirm this administrative action for ${entityName}?`}
        </p>

        {/* Reason Field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
            Administrative Reason {isDestructive && <span style={{ color: '#dc2626' }}>*</span>}:
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={isDestructive ? "e.g., Incomplete documentation, compliance failure, policy violation..." : "Optional administrative note..."}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: error ? '1.5px solid #dc2626' : '1px solid #d1d5db',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          {error && (
            <span style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.3rem', display: 'block' }}>
              {error}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={isDestructive ? 'btn-secondary' : 'btn-primary'}
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '0.9rem',
              fontWeight: '700',
              ...(isDestructive ? {
                background: '#dc2626',
                color: 'white',
                border: 'none'
              } : {})
            }}
          >
            {loading ? 'Processing...' : `Confirm ${action}`}
          </button>
        </div>
      </div>
    </div>
  );
}

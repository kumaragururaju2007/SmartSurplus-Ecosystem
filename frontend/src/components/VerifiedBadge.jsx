import React from 'react';
import { Check, ShieldCheck, Clock, AlertTriangle, Ban, XCircle } from 'lucide-react';

/**
 * Universal Verification Badge Component for SmartSurplus
 * Only displays "✓ Verified [Type]" when actually verified by Admin.
 * Displays "Pending Verification", "Verification Rejected", or "Account Suspended" appropriately.
 *
 * @param {string} type - 'NGO' | 'BIOGAS' | 'DONOR' | 'USER'
 * @param {boolean} isVerified - Boolean verified flag
 * @param {string} status - 'VERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE'
 * @param {boolean} isAvailable - Boolean availability / active flag
 * @param {boolean} compact - Compact badge format
 * @param {boolean} iconOnly - Only icon display
 * @param {string} className - Additional CSS classes
 * @param {object} style - Custom inline styles
 */
export default function VerifiedBadge({
  type = 'NGO',
  isVerified = false,
  status = '',
  isAvailable = true,
  compact = false,
  iconOnly = false,
  className = '',
  style = {}
}) {
  const orgTypeUpper = String(type).toUpperCase();
  const typeLabel = orgTypeUpper === 'NGO' ? 'NGO' : orgTypeUpper === 'BIOGAS' ? 'Biogas Plant' : 'Donor';

  // Normalize verification state
  const isActuallyVerified = Boolean(isVerified || status === 'VERIFIED' || status === 'ACTIVE');
  const isSuspended = isAvailable === false || status === 'SUSPENDED';
  const isRejected = status === 'REJECTED';
  const isPending = !isActuallyVerified && !isSuspended && !isRejected;

  if (isActuallyVerified) {
    if (iconOnly) {
      return (
        <span
          title={`✓ Verified ${typeLabel}`}
          className={`verified-badge-icon ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#16a34a',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: '900',
            marginLeft: '0.35rem',
            verticalAlign: 'middle',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
            ...style
          }}
        >
          ✓
        </span>
      );
    }

    if (compact) {
      return (
        <span
          title={`Verified ${typeLabel} by SmartSurplus Platform Admin`}
          className={`verified-badge compact verified-success ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #86efac',
            padding: '0.12rem 0.45rem',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '800',
            marginLeft: '0.35rem',
            verticalAlign: 'middle',
            lineHeight: '1.2',
            ...style
          }}
        >
          <Check size={12} strokeWidth={3.2} />
          <span>Verified {typeLabel}</span>
        </span>
      );
    }

    return (
      <span
        title={`Verified ${typeLabel} by SmartSurplus Platform Admin`}
        className={`verified-badge verified-success ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #86efac',
          padding: '0.22rem 0.65rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: '800',
          boxShadow: '0 2px 5px rgba(22, 163, 74, 0.15)',
          verticalAlign: 'middle',
          ...style
        }}
      >
        <ShieldCheck size={14} strokeWidth={2.5} />
        <span>✓ Verified {typeLabel}</span>
      </span>
    );
  }

  if (isRejected) {
    if (iconOnly) {
      return (
        <span
          title="Verification Rejected by Platform Admin"
          className={`verified-badge-icon ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#dc2626',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: '900',
            marginLeft: '0.35rem',
            verticalAlign: 'middle',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
            ...style
          }}
        >
          ✕
        </span>
      );
    }

    return (
      <span
        title="Verification Rejected by Platform Admin"
        className={`verified-badge verified-rejected ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          padding: compact ? '0.12rem 0.45rem' : '0.22rem 0.65rem',
          borderRadius: '999px',
          fontSize: compact ? '0.72rem' : '0.8rem',
          fontWeight: '700',
          verticalAlign: 'middle',
          ...style
        }}
      >
        <XCircle size={compact ? 12 : 14} />
        <span>Verification Rejected</span>
      </span>
    );
  }

  if (isSuspended) {
    if (iconOnly) {
      return (
        <span
          title="Account Suspended"
          className={`verified-badge-icon ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#6b7280',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: '900',
            marginLeft: '0.35rem',
            verticalAlign: 'middle',
            ...style
          }}
        >
          ⊘
        </span>
      );
    }

    return (
      <span
        title="Account Suspended"
        className={`verified-badge verified-suspended ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: '#f3f4f6',
          color: '#4b5563',
          border: '1px solid #d1d5db',
          padding: compact ? '0.12rem 0.45rem' : '0.22rem 0.65rem',
          borderRadius: '999px',
          fontSize: compact ? '0.72rem' : '0.8rem',
          fontWeight: '700',
          verticalAlign: 'middle',
          ...style
        }}
      >
        <Ban size={compact ? 12 : 14} />
        <span>Account Suspended</span>
      </span>
    );
  }

  // Pending verification (Default state)
  if (iconOnly) {
    return (
      <span
        title="Pending Verification by Platform System Administrator"
        className={`verified-badge-icon ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#f59e0b',
          color: 'white',
          fontSize: '0.65rem',
          fontWeight: '900',
          marginLeft: '0.35rem',
          verticalAlign: 'middle',
          boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
          ...style
        }}
      >
        ⏳
      </span>
    );
  }

  return (
    <span
      title="Pending Verification by Platform System Administrator"
      className={`verified-badge verified-pending ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        background: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fde68a',
        padding: compact ? '0.12rem 0.45rem' : '0.22rem 0.65rem',
        borderRadius: '999px',
        fontSize: compact ? '0.72rem' : '0.8rem',
        fontWeight: '700',
        verticalAlign: 'middle',
        ...style
      }}
    >
      <Clock size={compact ? 12 : 14} />
      <span>Pending Verification</span>
    </span>
  );
}

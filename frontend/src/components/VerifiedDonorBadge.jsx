import React from 'react';
import VerifiedBadge from './VerifiedBadge';

/**
 * Universal Verified Donor Badge Component
 * Displays a prominent green tick symbol and verification badge next to verified donor names.
 */
export default function VerifiedDonorBadge({
  isVerified = false,
  donor = null,
  compact = false,
  iconOnly = false,
  className = '',
  style = {}
}) {
  const verified = Boolean(
    isVerified ||
    donor?.isVerified ||
    donor?.is_verified ||
    donor?.is_donor_verified ||
    donor?.isVerifiedDonor
  );

  if (!verified && !donor?.verification_status && !donor?.fssai_status) {
    if (!compact && !iconOnly && donor) {
      return (
        <VerifiedBadge
          type="DONOR"
          isVerified={false}
          status="PENDING"
          compact={compact}
          className={className}
          style={style}
        />
      );
    }
    return null;
  }

  return (
    <VerifiedBadge
      type="DONOR"
      isVerified={verified}
      status={verified ? 'VERIFIED' : (donor?.verification_status || 'PENDING')}
      isAvailable={donor?.is_available !== false}
      compact={compact}
      iconOnly={iconOnly}
      className={className}
      style={style}
    />
  );
}

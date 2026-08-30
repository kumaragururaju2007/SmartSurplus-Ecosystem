import React from 'react';
import { 
  CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Building2, 
  User, Phone, Mail, MapPin, Award, Check, Utensils, AlertTriangle
} from 'lucide-react';

export default function DonorProfileCard({ donor, showDetailedTable = true, compact = false }) {
  if (!donor) return null;

  const businessName = donor.businessName || donor.business_name || donor.name || 'Food Donor';
  const contactPerson = donor.contactPerson || donor.contact_person || donor.name || 'Authorized Representative';
  const phone = donor.phone || donor.donor_phone || 'Not Available';
  const email = donor.email || donor.donor_email || 'Not Available';
  const businessType = donor.businessType || donor.business_type || donor.donor_business_type || 'Hotel';
  const fssaiNumber = donor.fssaiNumber || donor.fssai_number || donor.donor_fssai_number || '';
  const fssaiStatus = donor.fssaiStatus || donor.fssai_status || donor.donor_fssai_status || '';

  // Formatted location
  const city = donor.city || donor.donor_city || '';
  const state = donor.state || donor.donor_state || '';
  const address = donor.address || donor.pickup_address || donor.donor_address || '';
  const locationDisplay = [city, state].filter(Boolean).join(', ') || address || 'Tamil Nadu, India';

  // Strict boolean checks
  const isVerifiedDonor = Boolean(donor.isVerified ?? donor.is_verified ?? donor.is_donor_verified);
  const isFssaiVerified = Boolean(donor.isFssaiVerified ?? donor.is_fssai_verified);
  const isBusinessVerified = Boolean(donor.isBusinessVerified ?? donor.is_business_verified ?? isVerifiedDonor);
  const isLocationVerified = Boolean(donor.isLocationVerified ?? donor.is_location_verified ?? isVerifiedDonor);
  const isPhoneVerified = Boolean(donor.isPhoneVerified ?? donor.is_phone_verified ?? isVerifiedDonor);

  return (
    <div className="glass-card" style={{
      background: 'white',
      borderRadius: '16px',
      border: isVerifiedDonor ? '1.5px solid #86efac' : '1px solid #e5e7eb',
      boxShadow: isVerifiedDonor ? '0 10px 25px -5px rgba(22, 163, 74, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      padding: compact ? '1.25rem' : '1.75rem'
    }}>
      {/* 1. HEADER WITH PROMINENT VERIFIED BADGE */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: compact ? '48px' : '56px',
            height: compact ? '48px' : '56px',
            borderRadius: '14px',
            background: isVerifiedDonor ? '#dcfce7' : '#f3f4f6',
            color: isVerifiedDonor ? '#15803d' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
          }}>
            <Utensils size={compact ? 24 : 28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{
                fontSize: compact ? '1.25rem' : '1.55rem',
                fontWeight: '900',
                color: '#111827',
                margin: 0
              }}>
                {businessName}
              </h2>

              {/* PROMINENT VERIFIED DONOR BADGE */}
              {isVerifiedDonor ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  letterSpacing: '0.2px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.15)'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#16a34a',
                    display: 'inline-block'
                  }} />
                  ✓ Verified Donor
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: '700'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#d97706',
                    display: 'inline-block'
                  }} />
                  {fssaiNumber ? 'Pending Verification' : 'Not Verified'}
                </span>
              )}
            </div>

            <div style={{
              fontSize: '0.84rem',
              color: '#6b7280',
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                background: '#f0fdf4',
                color: '#166534',
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px'
              }}>
                🏨 {businessType}
              </span>
              <span>&bull;</span>
              <span>📍 {locationDisplay}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '800',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            TRUST ASSESSMENT
          </span>
          <div style={{
            marginTop: '0.2rem',
            fontSize: '0.88rem',
            fontWeight: '800',
            color: isVerifiedDonor ? '#15803d' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            justifyContent: 'flex-end'
          }}>
            {isVerifiedDonor ? (
              <>
                <ShieldCheck size={18} color="#16a34a" /> 100% Platform Verified
              </>
            ) : (
              <>
                <AlertTriangle size={17} color="#d97706" /> Pending Admin Review
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. CORE INFORMATION GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        padding: '1.25rem 0'
      }}>
        {/* Authorized Person */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
              Authorized Person
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827', marginTop: '1px' }}>
              {contactPerson}
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Phone size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
              Phone Contact
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#111827', marginTop: '1px' }}>
              {phone}
            </div>
          </div>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
              Email Address
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af', marginTop: '1px', wordBreak: 'break-all' }}>
              {email}
            </div>
          </div>
        </div>

        {/* Physical Address */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#f8fafc',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
              Business Address
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#374151', marginTop: '1px' }}>
              {address || locationDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FSSAI & VERIFICATION BREAKDOWN TABLE */}
      {showDetailedTable && (
        <div style={{
          marginTop: '0.75rem',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.75rem 1.25rem',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#374151', letterSpacing: '0.3px' }}>
              VERIFICATION STATUS & COMPLIANCE
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
              Verified by System / Platform Administrator
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Row 1: FSSAI Licence */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f3f4f6',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🪪</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'block' }}>
                    FSSAI Registration / Licence Number
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#4b5563', fontFamily: 'monospace', fontWeight: '700' }}>
                    {fssaiNumber || 'NOT SUBMITTED'}
                  </span>
                </div>
              </div>

              <div>
                {isFssaiVerified ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <Check size={14} strokeWidth={3} /> Verified
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <XCircle size={14} /> Not Verified
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Business Identity */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f3f4f6',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🏢</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'block' }}>
                    Business Identity & Entity Validation
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {businessName} ({businessType})
                  </span>
                </div>
              </div>

              <div>
                {isBusinessVerified ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <Check size={14} strokeWidth={3} /> Verified
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <XCircle size={14} /> Not Verified
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: Location Verification */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #f3f4f6',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📍</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'block' }}>
                    Pickup Location & Physical Address
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {locationDisplay}
                  </span>
                </div>
              </div>

              <div>
                {isLocationVerified ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <Check size={14} strokeWidth={3} /> Verified
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <XCircle size={14} /> Not Verified
                  </span>
                )}
              </div>
            </div>

            {/* Row 4: Phone Number Verification */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📞</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'block' }}>
                    Authorized Phone Number
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {phone}
                  </span>
                </div>
              </div>

              <div>
                {isPhoneVerified ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <Check size={14} strokeWidth={3} /> Verified
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <XCircle size={14} /> Not Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

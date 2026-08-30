import React, { useState, useEffect } from 'react';
import { 
  Building2, UserCheck, Phone, Mail, MapPin, Award, 
  Save, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, 
  Info, Utensils, FileText, Check, AlertTriangle, Sparkles
} from 'lucide-react';
import { getDonorProfile, updateDonorProfile } from '../services/donationAPI';
import DonorProfileCard from '../components/DonorProfileCard';
import '../styles/dashboard.css';

export default function DonorProfile({ token, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit'

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessType: 'Hotel',
    fssaiNumber: '',
    latitude: '',
    longitude: ''
  });

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getDonorProfile(token);
      if (res.success && res.profile) {
        const p = res.profile;
        setProfile(p);
        setForm({
          businessName: p.businessName || '',
          contactPerson: p.contactPerson || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          businessType: p.businessType || 'Hotel',
          fssaiNumber: p.fssaiNumber || '',
          latitude: p.latitude ? p.latitude.toString() : '',
          longitude: p.longitude ? p.longitude.toString() : ''
        });
      } else {
        setError(res.message || 'Failed to load donor profile.');
      }
    } catch (err) {
      setError('Connection failure loading donor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');

    try {
      const res = await updateDonorProfile(form, token);
      if (res.success) {
        setMsg(res.message || 'Profile updated successfully!');
        await fetchProfile();
        setActiveTab('overview');
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Error saving profile information.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6b7280' }}>
        <RefreshCw className="animate-spin" size={36} style={{ margin: '0 auto 1rem', color: '#16a34a' }} />
        <p style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>Loading Donor Personal Info & Verification Dossier...</p>
      </div>
    );
  }

  const isVerified = Boolean(profile?.isVerified);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 0' }}>
      
      {/* 1. WELCOME & STATUS BANNER */}
      <div className="glass-card" style={{
        background: isVerified 
          ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' 
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '2rem 2.25rem',
        borderRadius: '20px',
        marginBottom: '2rem',
        boxShadow: isVerified 
          ? '0 12px 30px rgba(21, 128, 61, 0.18)' 
          : '0 12px 30px rgba(15, 23, 42, 0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: '800',
              background: 'rgba(255,255,255,0.2)',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              letterSpacing: '0.5px'
            }}>
              DONOR PORTAL &bull; PERSONAL INFO & VERIFICATION
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: '900', color: 'white', margin: 0 }}>
                {profile?.businessName || 'Donor Profile'}
              </h1>

              {isVerified ? (
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Check size={16} strokeWidth={3} /> Verified Donor
                </span>
              ) : (
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <AlertTriangle size={15} /> Not Verified / Pending
                </span>
              )}
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', margin: '0.4rem 0 0', opacity: 0.9 }}>
              Manage your establishment details, authorized contact, and submit FSSAI registration for verified credentials.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveTab(activeTab === 'overview' ? 'edit' : 'overview')}
              className="btn-primary"
              style={{
                background: 'white',
                color: isVerified ? '#15803d' : '#0f172a',
                border: 'none',
                fontWeight: '800',
                padding: '0.65rem 1.3rem'
              }}
            >
              {activeTab === 'overview' ? '✏️ Edit Profile Details' : '👁️ View Verified Card'}
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {msg && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#f0fdf4',
          color: '#15803d',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: '700',
          fontSize: '0.92rem',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontWeight: '700',
          fontSize: '0.92rem',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. TAB TOGGLE */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'overview' ? '800' : '600',
            background: activeTab === 'overview' ? '#16a34a' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          🪪 Live Profile Card & Badges
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'edit' ? '800' : '600',
            background: activeTab === 'edit' ? '#16a34a' : 'transparent',
            color: activeTab === 'edit' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ⚙️ Edit Personal Info & FSSAI
        </button>
      </div>

      {/* 3. MAIN TAB CONTENT */}
      {activeTab === 'overview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* PROFILE CARD */}
          <DonorProfileCard donor={profile || {
            businessName: form.businessName || user?.name || 'Food Donor',
            contactPerson: form.contactPerson || user?.name || 'Authorized Person',
            phone: form.phone || user?.phone || '',
            email: form.email || user?.email || '',
            address: form.address || '',
            city: form.city || '',
            state: form.state || '',
            pincode: form.pincode || '',
            businessType: form.businessType || 'Hotel',
            fssaiNumber: form.fssaiNumber || '',
            fssaiStatus: profile?.fssaiStatus || 'NOT_SUBMITTED',
            isVerified: Boolean(profile?.isVerified ?? user?.is_verified),
            isFssaiVerified: Boolean(profile?.isFssaiVerified),
            isBusinessVerified: Boolean(profile?.isBusinessVerified),
            isLocationVerified: Boolean(profile?.isLocationVerified),
            isPhoneVerified: Boolean(profile?.isPhoneVerified)
          }} showDetailedTable={true} />

          {/* VERIFICATION GUIDANCE BANNER */}
          <div className="glass-card" style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={20} color="#16a34a" /> Platform Trust & Admin Verification Standard
            </h3>
            <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
              To ensure beneficiary health and food safety, the SmartSurplus administration authenticates each donor's FSSAI registration, business identity, and physical pickup address. Once verified by the platform team, your listings will automatically feature the prominent <strong>✓ Verified Donor</strong> badge in NGO search results and match notifications.
            </p>
          </div>

        </div>
      ) : (
        /* EDIT PROFILE FORM */
        <div className="glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827', margin: 0 }}>
              Edit Personal Info & Credentials
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Keep your contact and regulatory information updated for seamless NGO coordination.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              
              {/* Hotel / Donor Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Donor / Hotel Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g. ABC Hotel"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Owner / Authorized Person */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Owner / Authorized Person Name *
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="e.g. Kumar"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Food Business Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Food Business Type *
                </label>
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: '600',
                    background: 'white'
                  }}
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Catering">Catering Service</option>
                  <option value="Supermarket">Supermarket / Grocery</option>
                  <option value="Bakery">Bakery & Confectionery</option>
                  <option value="Corporate Cafeteria">Corporate Cafeteria</option>
                  <option value="Event Organizer">Event / Wedding Organizer</option>
                  <option value="Other">Other Food Provider</option>
                </select>
              </div>

              {/* FSSAI Registration Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  FSSAI Registration / Licence Number
                </label>
                <input
                  type="text"
                  name="fssaiNumber"
                  value={form.fssaiNumber}
                  onChange={handleChange}
                  placeholder="14-digit FSSAI License Number (e.g. 12345678901234)"
                  maxLength="20"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    fontFamily: 'monospace'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                  Entering or updating this sends your licence to Admin for verification.
                </span>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Authorized Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.92rem',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Email Address (Account ID)
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  readOnly
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.92rem',
                    color: '#6b7280',
                    background: '#f9fafb'
                  }}
                />
              </div>

            </div>

            {/* Address & Location */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#111827', marginBottom: '1rem' }}>
                📍 Business Location & Pickup Address
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                    Business Address / Landmark *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main Bazaar Road, Near Central Bus Stand"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                    City / Town *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Erode"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 638001"
                    maxLength="10"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.92rem',
                      fontWeight: '600'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submit Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ padding: '0.75rem 2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving Changes...' : 'Save & Submit Profile'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

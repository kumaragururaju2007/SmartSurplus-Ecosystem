import React, { useState, useEffect } from 'react';
import { getNGOProfile, updateNGOProfile, uploadNGODocument } from '../services/ngoAPI';
import Map from '../components/Map';
import VerifiedBadge from '../components/VerifiedBadge';
import { 
  Building2, UserCheck, MapPin, Layers, Save, Edit3, CheckCircle2, 
  AlertCircle, ShieldCheck, Sparkles, Compass, FileText, UploadCloud, 
  Clock, ShieldAlert, Check, XCircle, Info, ExternalLink
} from 'lucide-react';
import { detectCurrentLocation, reverseGeocode, forwardGeocode } from '../services/locationService';
import '../styles/dashboard.css';

export default function NGOProfile({ token }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [rawProfile, setRawProfile] = useState(null);
  const [locating, setLocating] = useState(false);

  // Document Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newDocType, setNewDocType] = useState('Organization Registration Certificate');
  const [newDocFile, setNewDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [form, setForm] = useState({
    organization_name: '',
    ngo_type: 'Trust',
    legal_registration_number: '',
    registration_authority: '',
    registration_date: '',
    ngo_darpan_id: '',
    pan: '',
    tax_12a_12ab: '',
    tax_80g: '',
    fcra_number: '',
    fcra_status: '',
    contact_person: '',
    designation: '',
    email: '',
    phone: '',
    official_website: '',
    official_email: '',
    official_phone: '',
    year_established: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    food_capacity: '0',
    max_distribution_capacity: '0',
    meals_per_day: '0',
    service_areas: '',
    beneficiary_types: '',
    donation_categories_required: '',
    operating_days: '',
    operating_hours: '',
    emergency_support: false,
    is_available: true
  });

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getNGOProfile(token);
      if (res.success && res.ngo) {
        const ngo = res.ngo;
        setRawProfile(ngo);
        setForm({
          organization_name: ngo.organization_name || '',
          ngo_type: ngo.ngo_type || 'Trust',
          legal_registration_number: ngo.legal_registration_number || ngo.registration_number || '',
          registration_authority: ngo.registration_authority || '',
          registration_date: ngo.registration_date ? ngo.registration_date.split('T')[0] : '',
          ngo_darpan_id: ngo.ngo_darpan_id || '',
          pan: ngo.pan || '',
          tax_12a_12ab: ngo.tax_12a_12ab || '',
          tax_80g: ngo.tax_80g || '',
          fcra_number: ngo.fcra_number || '',
          fcra_status: ngo.fcra_status || '',
          contact_person: ngo.contact_person || '',
          designation: ngo.designation || 'Authorized Representative',
          email: ngo.email || '',
          phone: ngo.phone || '',
          official_website: ngo.official_website || '',
          official_email: ngo.official_email || '',
          official_phone: ngo.official_phone || '',
          year_established: ngo.year_established || '',
          description: ngo.description || '',
          address: ngo.address || '',
          city: ngo.city || '',
          state: ngo.state || '',
          pincode: ngo.pincode || '',
          latitude: (ngo.latitude !== null && ngo.latitude !== undefined) ? ngo.latitude.toString() : '',
          longitude: (ngo.longitude !== null && ngo.longitude !== undefined) ? ngo.longitude.toString() : '',
          food_capacity: (ngo.food_capacity !== null && ngo.food_capacity !== undefined) ? ngo.food_capacity.toString() : '0',
          max_distribution_capacity: (ngo.max_distribution_capacity !== null && ngo.max_distribution_capacity !== undefined) ? ngo.max_distribution_capacity.toString() : '0',
          meals_per_day: (ngo.meals_per_day !== null && ngo.meals_per_day !== undefined) ? ngo.meals_per_day.toString() : '0',
          service_areas: ngo.service_areas || '',
          beneficiary_types: ngo.beneficiary_types || '',
          donation_categories_required: ngo.donation_categories_required || '',
          operating_days: ngo.operating_days || '',
          operating_hours: ngo.operating_hours || '',
          emergency_support: Boolean(ngo.emergency_support),
          is_available: ngo.is_available === 1 || ngo.is_available === true
        });
      }
    } catch (err) {
      console.error('Error fetching NGO profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMapSelect = async ({ lat, lng }) => {
    setForm(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    try {
      const addr = await reverseGeocode(lat, lng);
      setForm(prev => ({
        ...prev,
        address: addr.fullAddress || prev.address,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
        pincode: addr.pincode || prev.pincode
      }));
    } catch (e) {
      console.log('Reverse geocoding notice:', e.message);
    }
  };

  const handleGetCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const loc = await detectCurrentLocation();
      setForm(prev => ({
        ...prev,
        latitude: loc.lat.toString(),
        longitude: loc.lng.toString()
      }));
      const addr = await reverseGeocode(loc.lat, loc.lng);
      setForm(prev => ({
        ...prev,
        address: addr.fullAddress || prev.address,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
        pincode: addr.pincode || prev.pincode
      }));
      setMsg(loc.message);
    } catch (err) {
      setError(err.message || 'Location permission denied. Please click on the map to set coordinates.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    try {
      const res = await updateNGOProfile({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        food_capacity: parseFloat(form.max_distribution_capacity || form.food_capacity || 0),
        max_distribution_capacity: parseFloat(form.max_distribution_capacity || 0),
        meals_per_day: parseInt(form.meals_per_day || form.max_distribution_capacity || 0, 10),
        emergency_support: form.emergency_support ? 1 : 0,
        is_available: form.is_available ? 1 : 0
      }, token);

      if (res.success) {
        setMsg('NGO profile details saved successfully.');
        setEditing(false);
        await fetchProfile();
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Network error while saving profile.');
    }
  };

  const handleDocumentUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newDocFile) {
      setError('Please select a file to upload.');
      return;
    }
    setUploadingDoc(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const docPayload = {
          document_type: newDocType,
          document_name: newDocFile.name,
          file_size: `${(newDocFile.size / 1024).toFixed(1)} KB`,
          file_url: reader.result
        };

        const res = await uploadNGODocument(docPayload, token);
        if (res.success) {
          setMsg(`${newDocType} uploaded successfully and submitted for Admin verification.`);
          setUploadModalOpen(false);
          setNewDocFile(null);
          await fetchProfile();
        } else {
          setError(res.message || 'Document upload failed.');
        }
      } catch (err) {
        setError('Error uploading document.');
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading document file.');
      setUploadingDoc(false);
    };
    reader.readAsDataURL(newDocFile);
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#6b7280', fontWeight: '600' }}>Loading official NGO credentials...</p>
      </div>
    );
  }

  const isVerified = rawProfile?.isVerified || rawProfile?.is_verified === 1 || rawProfile?.verification_status === 'VERIFIED';
  const verificationStatus = rawProfile?.verificationStatus || rawProfile?.verification_status || (isVerified ? 'VERIFIED' : 'PENDING');
  const documents = rawProfile?.documents || [];

  return (
    <div className="dashboard-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', color: 'white', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: '#ffffff' }}>
              {form.organization_name || 'NGO Organization Profile'}
            </h1>
            <VerifiedBadge 
              type="NGO"
              isVerified={isVerified}
              status={verificationStatus}
              isAvailable={form.is_available}
            />
          </div>
          <p style={{ color: '#bbf7d0', fontSize: '0.92rem', margin: 0 }}>
            {form.ngo_type} • Reg No: {form.legal_registration_number || 'Under Filing'} • Contact: {form.contact_person} ({form.designation})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="btn-secondary"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
          >
            <UploadCloud size={16} /> Upload Verification Doc
          </button>

          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="btn-primary"
            style={{ background: '#ffffff', color: '#15803d', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}
          >
            {editing ? <UserCheck size={16} /> : <Edit3 size={16} />}
            {editing ? 'View Dossier' : 'Edit Information'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.85rem 1.2rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.85rem 1.2rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Status Warning / Notice Card */}
      {!isVerified && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Clock size={24} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.3rem 0', color: '#92400e', fontSize: '1rem', fontWeight: '800' }}>
              Pending Admin Verification Review
            </h4>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.88rem', lineHeight: '1.4' }}>
              Your NGO registration details and uploaded certificates are under audit by the SmartSurplus Administrator. 
              Only verified NGOs with the <strong>✓ Verified NGO</strong> badge are eligible for automatic food donation matching.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Form / Dossier View */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: NGO Identity & Legal Registration */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <Building2 size={22} color="#15803d" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              NGO Organization & Legal Registration
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Organization Name</label>
              {editing ? (
                <input type="text" name="organization_name" value={form.organization_name} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.organization_name || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Organization Type</label>
              {editing ? (
                <select name="ngo_type" value={form.ngo_type} onChange={handleChange} className="form-input">
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Section 8 Company">Section 8 Company</option>
                  <option value="Child Care & Orphanages">Child Care & Orphanages</option>
                  <option value="Elderly Homes / Old Age Homes">Elderly Homes / Old Age Homes</option>
                  <option value="Food Relief & Rescue Foundation">Food Relief & Rescue Foundation</option>
                  <option value="Community Shelter & Kitchen">Community Shelter & Kitchen</option>
                  <option value="Other Non-Profit Organization">Other Non-Profit Organization</option>
                </select>
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.ngo_type || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Legal Registration Number</label>
              {editing ? (
                <input type="text" name="legal_registration_number" value={form.legal_registration_number} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.legal_registration_number || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Registration Authority</label>
              {editing ? (
                <input type="text" name="registration_authority" value={form.registration_authority} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.registration_authority || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Registration Date</label>
              {editing ? (
                <input type="date" name="registration_date" value={form.registration_date} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.registration_date || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Year Established</label>
              {editing ? (
                <input type="text" name="year_established" value={form.year_established} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.year_established || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Personal Identity */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <UserCheck size={22} color="#15803d" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Authorized Contact & Communication
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Contact Person Name</label>
              {editing ? (
                <input type="text" name="contact_person" value={form.contact_person} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.contact_person || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Designation / Role</label>
              {editing ? (
                <input type="text" name="designation" value={form.designation} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.designation || 'Authorized Representative'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Email Address</label>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.email || 'Not provided'}</div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Mobile / Phone</label>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.phone || 'Not provided'}</div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Official Website</label>
              {editing ? (
                <input type="url" name="official_website" value={form.official_website} onChange={handleChange} className="form-input" placeholder="https://..." />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: form.official_website ? '#2563eb' : '#111827' }}>
                  {form.official_website ? <a href={form.official_website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{form.official_website} ↗</a> : 'Not provided'}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Official Phone</label>
              {editing ? (
                <input type="tel" name="official_phone" value={form.official_phone} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.official_phone || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: NGO DARPAN & Tax Credentials */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <ShieldCheck size={22} color="#15803d" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              NGO DARPAN & Tax Compliance Credentials
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#166534', display: 'block', marginBottom: '0.3rem' }}>NGO DARPAN Unique ID (NITI Aayog)</label>
              {editing ? (
                <input type="text" name="ngo_darpan_id" value={form.ngo_darpan_id} onChange={handleChange} className="form-input" style={{ background: '#fff' }} />
              ) : (
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#14532d' }}>{form.ngo_darpan_id || 'Not provided'}</div>
              )}
              <span style={{ fontSize: '0.72rem', color: '#15803d', display: 'block', marginTop: '0.3rem' }}>
                Status: {form.ngo_darpan_id ? 'Submitted for Verification' : 'Unregistered / Optional'}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Organization PAN Number</label>
              {editing ? (
                <input type="text" name="pan" value={form.pan} onChange={handleChange} className="form-input" maxLength={10} required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.pan || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>12A / 12AB Registration Number</label>
              {editing ? (
                <input type="text" name="tax_12a_12ab" value={form.tax_12a_12ab} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.tax_12a_12ab || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>80G Tax Exemption Number</label>
              {editing ? (
                <input type="text" name="tax_80g" value={form.tax_80g} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.tax_80g || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>FCRA Registration Number</label>
              {editing ? (
                <input type="text" name="fcra_number" value={form.fcra_number} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.fcra_number || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Address & Physical Location Pinpoint */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <MapPin size={22} color="#15803d" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Physical Location & Interactive Map Hub
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Street Address</label>
              {editing ? (
                <input type="text" name="address" value={form.address} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.address || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>City / District</label>
              {editing ? (
                <input type="text" name="city" value={form.city} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.city || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>State</label>
              {editing ? (
                <input type="text" name="state" value={form.state} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.state || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>PIN Code</label>
              {editing ? (
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.pincode || 'Not provided'}</div>
              )}
            </div>
          </div>

          {/* Interactive Map */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            {editing && (
              <div style={{ padding: '0.6rem 1rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#4b5563' }}>
                  Click on map to re-position NGO facility coordinates
                </span>
                <button type="button" onClick={handleGetCurrentLocation} disabled={locating} className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Compass size={13} /> {locating ? 'Detecting...' : 'Detect GPS'}
                </button>
              </div>
            )}
            <div style={{ height: '300px', width: '100%' }}>
              <Map
                latitude={form.latitude ? parseFloat(form.latitude) : undefined}
                longitude={form.longitude ? parseFloat(form.longitude) : undefined}
                interactive={editing}
                onLocationSelect={editing ? handleMapSelect : undefined}
                zoom={form.latitude && form.longitude ? 14 : 5}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Food Rescue Capacities & Beneficiaries */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <Layers size={22} color="#15803d" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Distribution Capacities & Service Focus
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Max Daily Distribution (Meals / Day)</label>
              {editing ? (
                <input type="number" name="max_distribution_capacity" value={form.max_distribution_capacity} onChange={handleChange} className="form-input" min="0" />
              ) : (
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#15803d' }}>{form.max_distribution_capacity || '0'} meals/day</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Service Areas / Zones</label>
              {editing ? (
                <input type="text" name="service_areas" value={form.service_areas} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.service_areas || 'Not specified'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Beneficiary Categories Served</label>
              {editing ? (
                <input type="text" name="beneficiary_types" value={form.beneficiary_types} onChange={handleChange} className="form-input" placeholder="Children, Homeless, Elderly..." />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.beneficiary_types || 'Not specified'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Accepted Food Categories</label>
              {editing ? (
                <input type="text" name="donation_categories_required" value={form.donation_categories_required} onChange={handleChange} className="form-input" placeholder="Cooked Food, Packaged, Groceries..." />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.donation_categories_required || 'Not specified'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Operating Days & Hours</label>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" name="operating_days" value={form.operating_days} onChange={handleChange} className="form-input" placeholder="e.g. Mon-Sat" />
                  <input type="text" name="operating_hours" value={form.operating_hours} onChange={handleChange} className="form-input" placeholder="e.g. 8AM-9PM" />
                </div>
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                  {form.operating_days || 'All Days'} • {form.operating_hours || 'Standard Hours'}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Emergency 24/7 Response Readiness</label>
              {editing ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" name="emergency_support" checked={form.emergency_support} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#16a34a' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Active Emergency Rescue Team</span>
                </label>
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: form.emergency_support ? '#15803d' : '#6b7280' }}>
                  {form.emergency_support ? '✓ Available for Emergency Dispatch' : 'Not configured'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 6: Official Verification Documents Dossier */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={22} color="#15803d" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
                Audited Verification Documents ({documents.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <UploadCloud size={14} /> + Upload New Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
              <FileText size={36} color="#9ca3af" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, color: '#6b7280', fontWeight: '600', fontSize: '0.9rem' }}>
                No verification certificates have been attached yet.
              </p>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="btn-primary"
                style={{ marginTop: '0.8rem', fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
              >
                Upload Registration Certificate
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {documents.map((doc, idx) => (
                <div key={doc.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>{doc.document_type}</span>
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
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                    File: {doc.document_name} ({doc.file_size || 'PDF Document'})
                  </div>
                  {doc.rejection_reason && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', padding: '0.4rem', borderRadius: '6px', marginTop: '0.4rem' }}>
                      <strong>Rejection Note:</strong> {doc.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Changes Button (in edit mode) */}
        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', fontWeight: '700' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> Save NGO Dossier
            </button>
          </div>
        )}
      </form>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>Upload Supporting Document</h3>
              <button type="button" onClick={() => setUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            <form onSubmit={handleDocumentUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Select Document Type *</label>
                <select className="form-input" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} required>
                  <option value="Organization Registration Certificate">Organization Registration Certificate</option>
                  <option value="Organization PAN Card">Organization PAN Card</option>
                  <option value="NGO DARPAN Certificate">NGO DARPAN Certificate</option>
                  <option value="Address Proof of Premises">Address Proof of Premises</option>
                  <option value="Authorized Representative ID">Authorized Representative ID</option>
                  <option value="12A / 12AB Certificate">12A / 12AB Certificate</option>
                  <option value="80G Certificate">80G Certificate</option>
                  <option value="FCRA Registration Document">FCRA Registration Document</option>
                  <option value="Other Official Proof">Other Official Proof</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Select File (.pdf, .jpg, .png) *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setNewDocFile(e.target.files && e.target.files[0])}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setUploadModalOpen(false)} className="btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploadingDoc} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '800' }}>
                  {uploadingDoc ? 'Uploading...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

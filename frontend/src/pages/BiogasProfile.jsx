import React, { useState, useEffect } from 'react';
import { getBiogasProfile, updateBiogasProfile, uploadBiogasDocument } from '../services/biogasAPI';
import Map from '../components/Map';
import VerifiedBadge from '../components/VerifiedBadge';
import { 
  Factory, ShieldCheck, Save, ArrowLeft, MapPin, Compass, 
  CheckCircle2, AlertCircle, FileText, UploadCloud, Edit3, UserCheck,
  Zap, Clock, XCircle, ExternalLink, Leaf
} from 'lucide-react';
import { detectCurrentLocation, reverseGeocode, forwardGeocode } from '../services/locationService';
import '../styles/dashboard.css';

export default function BiogasProfile({ token }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [rawProfile, setRawProfile] = useState(null);
  const [locating, setLocating] = useState(false);

  // Document Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newDocType, setNewDocType] = useState('GOBARdhan Registration Certificate');
  const [newDocFile, setNewDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [form, setForm] = useState({
    plant_name: '',
    plant_type: 'Biogas',
    operator_name: '',
    plant_registration_number: '',
    gobardhan_registration_number: '',
    mnre_application_id: '',
    mnre_programme: '',
    state_implementing_agency: '',
    commissioning_certificate_number: '',
    commissioning_date: '',
    contact_person: '',
    designation: '',
    operating_status: 'Operational',
    feedstock_capacity_daily: '0',
    processing_capacity: '0',
    capacity_unit: 'kg/day',
    biogas_production_capacity: '',
    cbg_production_capacity: '',
    power_generation_capacity: '',
    waste_processing_capacity: '',
    feedstock_types: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    is_available: true
  });

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getBiogasProfile(token);
      if (res.success && res.plant) {
        const p = res.plant;
        setRawProfile(p);
        setForm({
          plant_name: p.plant_name || '',
          plant_type: p.plant_type || 'Biogas',
          operator_name: p.operator_name || '',
          plant_registration_number: p.plant_registration_number || '',
          gobardhan_registration_number: p.gobardhan_registration_number || '',
          mnre_application_id: p.mnre_application_id || '',
          mnre_programme: p.mnre_programme || '',
          state_implementing_agency: p.state_implementing_agency || '',
          commissioning_certificate_number: p.commissioning_certificate_number || '',
          commissioning_date: p.commissioning_date ? p.commissioning_date.split('T')[0] : '',
          contact_person: p.contact_person || '',
          designation: p.designation || 'Plant Manager',
          operating_status: p.operating_status || 'Operational',
          feedstock_capacity_daily: (p.feedstock_capacity_daily !== null && p.feedstock_capacity_daily !== undefined) ? p.feedstock_capacity_daily.toString() : (p.processing_capacity ? p.processing_capacity.toString() : '0'),
          processing_capacity: (p.processing_capacity !== null && p.processing_capacity !== undefined) ? p.processing_capacity.toString() : '0',
          capacity_unit: p.capacity_unit || 'kg/day',
          biogas_production_capacity: p.biogas_production_capacity || '',
          cbg_production_capacity: p.cbg_production_capacity || '',
          power_generation_capacity: p.power_generation_capacity || '',
          waste_processing_capacity: p.waste_processing_capacity || '',
          feedstock_types: p.feedstock_types || '',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          latitude: (p.latitude !== null && p.latitude !== undefined) ? p.latitude.toString() : '',
          longitude: (p.longitude !== null && p.longitude !== undefined) ? p.longitude.toString() : '',
          is_available: p.is_available === 1 || p.is_available === true
        });
      }
    } catch (err) {
      console.error('Error fetching Biogas profile:', err);
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
      setError(err.message || 'Location permission denied. Please select coordinates on the map.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    try {
      const res = await updateBiogasProfile({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        feedstock_capacity_daily: parseFloat(form.feedstock_capacity_daily || form.processing_capacity || 0),
        processing_capacity: parseFloat(form.feedstock_capacity_daily || form.processing_capacity || 0),
        is_available: form.is_available ? 1 : 0
      }, token);

      if (res.success) {
        setMsg('Biogas Facility details saved successfully.');
        setEditing(false);
        await fetchProfile();
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Network error while updating Biogas profile.');
    }
  };

  const handleDocumentUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newDocFile) {
      setError('Please choose a file to upload.');
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

        const res = await uploadBiogasDocument(docPayload, token);
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
      setError('Error reading file.');
      setUploadingDoc(false);
    };
    reader.readAsDataURL(newDocFile);
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#6b7280', fontWeight: '600' }}>Loading Biogas facility specifications...</p>
      </div>
    );
  }

  const isVerified = rawProfile?.isVerified || rawProfile?.is_verified === 1 || rawProfile?.verification_status === 'VERIFIED';
  const verificationStatus = rawProfile?.verificationStatus || rawProfile?.verification_status || (isVerified ? 'VERIFIED' : 'PENDING');
  const documents = rawProfile?.documents || [];

  return (
    <div className="dashboard-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', background: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)', color: 'white', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0, color: '#ffffff' }}>
              {form.plant_name || 'Biogas Facility Profile'}
            </h1>
            <VerifiedBadge 
              type="BIOGAS"
              isVerified={isVerified}
              status={verificationStatus}
              isAvailable={form.is_available}
            />
          </div>
          <p style={{ color: '#fed7aa', fontSize: '0.92rem', margin: 0 }}>
            {form.plant_type} • Operator: {form.operator_name || 'Direct Facility'} • Daily Feedstock: {form.feedstock_capacity_daily} {form.capacity_unit}
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
            style={{ background: '#ffffff', color: '#b45309', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}
          >
            {editing ? <UserCheck size={16} /> : <Edit3 size={16} />}
            {editing ? 'View Facility Specs' : 'Edit Specifications'}
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

      {/* Pending verification notice */}
      {!isVerified && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Clock size={24} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 0.3rem 0', color: '#92400e', fontSize: '1rem', fontWeight: '800' }}>
              Pending Biogas Facility Admin Audit
            </h4>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.88rem', lineHeight: '1.4' }}>
              Your facility registration credentials and supporting certificates are currently in the Admin verification queue. 
              The <strong>✓ Verified Biogas Plant</strong> badge and food waste redirection matches will be activated once audited.
            </p>
          </div>
        </div>
      )}

      {/* Main Form / Specifications */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Facility Identity & Tech Type */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <Factory size={22} color="#d97706" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Biogas Facility & Operator Information
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Plant Name</label>
              {editing ? (
                <input type="text" name="plant_name" value={form.plant_name} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.plant_name || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Technology Type</label>
              {editing ? (
                <select name="plant_type" value={form.plant_type} onChange={handleChange} className="form-input">
                  <option value="Biogas">Biogas (Standard Digester)</option>
                  <option value="CBG">CBG (Compressed Biogas)</option>
                  <option value="Bio-CNG">Bio-CNG</option>
                  <option value="Waste-to-Energy / Biomethanation">Waste-to-Energy / Biomethanation</option>
                  <option value="Other">Other Clean Energy Conversion</option>
                </select>
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.plant_type || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Operator / Enterprise Name</label>
              {editing ? (
                <input type="text" name="operator_name" value={form.operator_name} onChange={handleChange} className="form-input" required />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.operator_name || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Plant Registration Number</label>
              {editing ? (
                <input type="text" name="plant_registration_number" value={form.plant_registration_number} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.plant_registration_number || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Commissioning Date</label>
              {editing ? (
                <input type="date" name="commissioning_date" value={form.commissioning_date} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.commissioning_date || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Operating Status</label>
              {editing ? (
                <select name="operating_status" value={form.operating_status} onChange={handleChange} className="form-input">
                  <option value="Operational">Operational</option>
                  <option value="Under Commissioning">Under Commissioning</option>
                  <option value="Expansion / Upgrade">Expansion / Upgrade</option>
                  <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                </select>
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.operating_status || 'Operational'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: GOBARdhan & MNRE Details */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <ShieldCheck size={22} color="#d97706" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              GOBARdhan & MNRE Programme Credentials
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#9a3412', display: 'block', marginBottom: '0.3rem' }}>GOBARdhan Registration Number</label>
              {editing ? (
                <input type="text" name="gobardhan_registration_number" value={form.gobardhan_registration_number} onChange={handleChange} className="form-input" style={{ background: '#fff' }} />
              ) : (
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#7c2d12' }}>{form.gobardhan_registration_number || 'Not provided'}</div>
              )}
              <span style={{ fontSize: '0.72rem', color: '#c2410c', display: 'block', marginTop: '0.3rem' }}>
                Status: {form.gobardhan_registration_number ? 'Audited with supporting documents' : 'Unregistered / Optional'}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>MNRE Application / Project ID</label>
              {editing ? (
                <input type="text" name="mnre_application_id" value={form.mnre_application_id} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.mnre_application_id || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>MNRE Scheme / Programme</label>
              {editing ? (
                <input type="text" name="mnre_programme" value={form.mnre_programme} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.mnre_programme || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>State Implementing Agency</label>
              {editing ? (
                <input type="text" name="state_implementing_agency" value={form.state_implementing_agency} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.state_implementing_agency || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Commissioning Certificate No.</label>
              {editing ? (
                <input type="text" name="commissioning_certificate_number" value={form.commissioning_certificate_number} onChange={handleChange} className="form-input" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.commissioning_certificate_number || 'Not provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Technical Processing Capacities & Energy Outputs */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <Zap size={22} color="#d97706" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Processing Capacities & Clean Energy Outputs
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Daily Feedstock Processing Capacity</label>
              {editing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" name="feedstock_capacity_daily" value={form.feedstock_capacity_daily} onChange={handleChange} className="form-input" min="0" required />
                  <select name="capacity_unit" value={form.capacity_unit} onChange={handleChange} className="form-input" style={{ width: '120px' }}>
                    <option value="kg/day">kg/day</option>
                    <option value="tonnes/day">tonnes/day</option>
                    <option value="m³/day">m³/day</option>
                  </select>
                </div>
              ) : (
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#d97706' }}>
                  {form.feedstock_capacity_daily || '0'} {form.capacity_unit}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Biogas Production Output</label>
              {editing ? (
                <input type="text" name="biogas_production_capacity" value={form.biogas_production_capacity} onChange={handleChange} className="form-input" placeholder="e.g. 150 m³/day" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.biogas_production_capacity || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>CBG Generation Output</label>
              {editing ? (
                <input type="text" name="cbg_production_capacity" value={form.cbg_production_capacity} onChange={handleChange} className="form-input" placeholder="e.g. 75 kg/day" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.cbg_production_capacity || 'Not provided'}</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Power Generation (kW)</label>
              {editing ? (
                <input type="text" name="power_generation_capacity" value={form.power_generation_capacity} onChange={handleChange} className="form-input" placeholder="e.g. 25 kW" />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.power_generation_capacity || 'Not provided'}</div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Accepted Feedstock Waste Types</label>
              {editing ? (
                <input type="text" name="feedstock_types" value={form.feedstock_types} onChange={handleChange} className="form-input" placeholder="Cooked Food Waste, Agricultural Waste, Animal Dung..." />
              ) : (
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>{form.feedstock_types || 'Organic Food Waste'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Address & Physical Location Pinpoint */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <MapPin size={22} color="#d97706" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#111827' }}>
              Physical Plant Location & OpenStreetMap Hub
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>Facility Address</label>
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
                  Click on map to re-position Biogas Plant coordinates
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

        {/* Section 5: Audited Verification Documents Dossier */}
        <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '14px', background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={22} color="#d97706" />
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
                No plant verification certificates have been attached yet.
              </p>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="btn-primary"
                style={{ marginTop: '0.8rem', fontSize: '0.82rem', padding: '0.45rem 0.9rem', background: '#d97706' }}
              >
                Upload GOBARdhan / Pollution Clearance Certificate
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
            <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d97706' }}>
              <Save size={18} /> Save Plant Specifications
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
                  <option value="GOBARdhan Registration Certificate">GOBARdhan Registration Certificate</option>
                  <option value="Plant Pollution Control / Reg Documents">Plant Pollution Control / Reg Documents</option>
                  <option value="MNRE Project Sanction / Approval Document">MNRE Project Sanction / Approval Document</option>
                  <option value="Plant Commissioning Certificate">Plant Commissioning Certificate</option>
                  <option value="Land Ownership / Lease Agreement">Land Ownership / Lease Agreement</option>
                  <option value="Authorized Representative ID Proof">Authorized Representative ID Proof</option>
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
                <button type="submit" disabled={uploadingDoc} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontWeight: '800', background: '#d97706' }}>
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

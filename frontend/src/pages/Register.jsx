import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Factory, Utensils, UserPlus, AlertCircle, MapPin, 
  Compass, CheckCircle2, FileText, UploadCloud, Shield, HelpCircle,
  Clock, Check, Layers, Sparkles, ChevronRight, X, Search, Crosshair
} from 'lucide-react';
import Map from '../components/Map';
import { registerUser } from '../services/authAPI';
import { detectCurrentLocation, reverseGeocode, forwardGeocode } from '../services/locationService';
import '../styles/login.css';

export default function Register({ onLoginSuccess }) {
  const [role, setRole] = useState('DONOR'); // 'DONOR' | 'NGO' | 'BIOGAS'
  
  // Section 1: Contact Information (Shared across roles)
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Section 2: Address & Location (Shared)
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [locating, setLocating] = useState(false);

  // ================= NGO SPECIFIC FIELDS =================
  const [organizationName, setOrganizationName] = useState('');
  const [ngoType, setNgoType] = useState('Trust');
  const [legalRegistrationNumber, setLegalRegistrationNumber] = useState('');
  const [registrationAuthority, setRegistrationAuthority] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [ngoDarpanId, setNgoDarpanId] = useState('');
  const [pan, setPan] = useState('');
  const [tax12A12AB, setTax12A12AB] = useState('');
  const [tax80G, setTax80G] = useState('');
  const [fcraNumber, setFcraNumber] = useState('');
  const [fcraStatus, setFcraStatus] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [description, setDescription] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [maxDistributionCapacity, setMaxDistributionCapacity] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('');
  const [operatingDays, setOperatingDays] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [emergencySupport, setEmergencySupport] = useState(false);

  // NGO Multi-select Tags
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [selectedDonationCategories, setSelectedDonationCategories] = useState([]);

  // ================= BIOGAS SPECIFIC FIELDS =================
  const [plantName, setPlantName] = useState('');
  const [plantType, setPlantType] = useState('Biogas');
  const [operatorName, setOperatorName] = useState('');
  const [plantRegistrationNumber, setPlantRegistrationNumber] = useState('');
  const [gobardhanRegistrationNumber, setGobardhanRegistrationNumber] = useState('');
  const [mnreApplicationId, setMnreApplicationId] = useState('');
  const [mnreProgramme, setMnreProgramme] = useState('');
  const [stateImplementingAgency, setStateImplementingAgency] = useState('');
  const [commissioningCertificateNumber, setCommissioningCertificateNumber] = useState('');
  const [commissioningDate, setCommissioningDate] = useState('');
  const [operatingStatus, setOperatingStatus] = useState('Operational');
  const [feedstockCapacityDaily, setFeedstockCapacityDaily] = useState('');
  const [capacityUnit, setCapacityUnit] = useState('kg/day');
  const [biogasProductionCapacity, setBiogasProductionCapacity] = useState('');
  const [cbgProductionCapacity, setCbgProductionCapacity] = useState('');
  const [powerGenerationCapacity, setPowerGenerationCapacity] = useState('');
  const [wasteProcessingCapacity, setWasteProcessingCapacity] = useState('');
  
  // Biogas Multi-select Feedstock Types
  const [selectedFeedstocks, setSelectedFeedstocks] = useState([]);

  // ================= DONOR SPECIFIC FIELDS =================
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Restaurant');
  const [fssaiNumber, setFssaiNumber] = useState('');

  // ================= UPLOADED DOCUMENTS =================
  const [documents, setDocuments] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper for multi-select checkboxes
  const toggleArrayItem = (setter, currentList, item) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  // Map click pin handler
  const handleMapLocationSelect = async ({ lat, lng }) => {
    const latStr = lat.toString();
    const lngStr = lng.toString();
    setLatitude(latStr);
    setLongitude(lngStr);
    setError('');
    setGeoMsg(`⏳ Resolving address for Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}...`);
    try {
      const addr = await reverseGeocode(lat, lng);
      if (addr.fullAddress) setAddress(addr.fullAddress);
      if (addr.city) setCity(addr.city);
      if (addr.state) setState(addr.state);
      if (addr.pincode) setPincode(addr.pincode);
      setGeoMsg(`📍 Pinned Location: ${addr.fullAddress || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`}`);
    } catch (e) {
      setGeoMsg(`📍 Coordinates Selected: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`);
    }
  };

  // High-accuracy GPS with automatic Network IP Fallback
  const handleGetCurrentLocation = async () => {
    setLocating(true);
    setGeoMsg('⏳ Detecting your location (GPS / Network)...');
    setError('');
    try {
      const loc = await detectCurrentLocation();
      setLatitude(loc.lat.toString());
      setLongitude(loc.lng.toString());

      setGeoMsg('⏳ Resolving complete street address...');
      const addr = await reverseGeocode(loc.lat, loc.lng);
      if (addr.fullAddress) setAddress(addr.fullAddress);
      if (addr.city) setCity(addr.city);
      if (addr.state) setState(addr.state);
      if (addr.pincode) setPincode(addr.pincode);

      setGeoMsg(`${loc.message} ➔ 📍 ${addr.fullAddress || `Lat: ${loc.lat}, Lng: ${loc.lng}`}`);
    } catch (err) {
      setError(err.message || 'Could not detect location. Please click directly on the map or search by address/PIN code.');
      setGeoMsg('💡 Click anywhere on the map below or use the Search button to set coordinates.');
    } finally {
      setLocating(false);
    }
  };

  // Forward Geocode / Search Address or PIN code on map
  const handleLocateByAddress = async () => {
    const query = [address, city, state, pincode].filter(Boolean).join(', ') || pincode || city;
    if (!query || query.trim().length < 2) {
      setError('Please enter a Street Address, City, or 6-digit PIN code to search.');
      return;
    }
    setLocating(true);
    setError('');
    setGeoMsg(`⏳ Searching map coordinates for "${query}"...`);
    try {
      const result = await forwardGeocode(query);
      setLatitude(result.lat.toString());
      setLongitude(result.lng.toString());
      if (result.city && !city) setCity(result.city);
      if (result.state && !state) setState(result.state);
      if (result.pincode && !pincode) setPincode(result.pincode);
      if (!address || address.length < 5) setAddress(result.fullAddress);
      setGeoMsg(`🎯 Found & Pinned on Map: ${result.displayName || result.fullAddress}`);
    } catch (err) {
      setError(err.message || 'Location not found. Please click directly on the interactive map.');
      setGeoMsg('💡 You can click anywhere on the interactive map below to pinpoint exact premises.');
    } finally {
      setLocating(false);
    }
  };

  // Document file picker with Data URL reader
  const handleDocumentPick = (docType, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc = {
        document_type: docType,
        document_name: file.name,
        file_size: `${(file.size / 1024).toFixed(1)} KB`,
        file_url: reader.result
      };

      setDocuments(prev => {
        const filtered = prev.filter(d => d.document_type !== docType);
        return [...filtered, newDoc];
      });
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (docType) => {
    setDocuments(prev => prev.filter(d => d.document_type !== docType));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Shared Validations
    if (!contactName.trim()) return setError('Full Name of Contact Person is required.');
    if (!email.trim()) return setError('Email Address is required.');
    if (!phone.trim()) return setError('Mobile Number is required.');
    if (!password) return setError('Password is required.');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    // Role-specific Validations
    if (role === 'NGO') {
      if (!organizationName.trim()) return setError('NGO / Organization Name is required.');
      if (!legalRegistrationNumber.trim()) return setError('Legal Registration Number is required.');
      if (!registrationAuthority.trim()) return setError('Registration Authority is required.');
      if (!pan.trim()) return setError('Organization PAN is required.');
    } else if (role === 'BIOGAS') {
      if (!plantName.trim()) return setError('Plant Facility Name is required.');
      if (!operatorName.trim()) return setError('Operator / Organization Name is required.');
      if (!feedstockCapacityDaily || isNaN(parseFloat(feedstockCapacityDaily))) {
        return setError('Valid Daily Feedstock Capacity is required.');
      }
    } else if (role === 'DONOR') {
      if (!businessName.trim()) return setError('Business Establishment Name is required.');
    }

    setLoading(true);

    try {
      const payload = {
        name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        designation: designation.trim() || (role === 'NGO' ? 'Authorized Representative' : role === 'BIOGAS' ? 'Plant Manager' : 'Owner'),
        contactPerson: contactName.trim(),
        address: address.trim(),
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        documents,

        // NGO Fields
        organizationName: organizationName.trim(),
        ngoType,
        legalRegistrationNumber: legalRegistrationNumber.trim(),
        registrationNumber: legalRegistrationNumber.trim(),
        registrationAuthority: registrationAuthority.trim(),
        registrationDate: registrationDate || null,
        ngoDarpanId: ngoDarpanId.trim() || null,
        pan: pan.trim().toUpperCase(),
        tax12A12AB: tax12A12AB.trim() || null,
        tax80G: tax80G.trim() || null,
        fcraNumber: fcraNumber.trim() || null,
        fcraStatus: fcraStatus || null,
        officialWebsite: officialWebsite.trim() || null,
        officialEmail: officialEmail.trim() || null,
        officialPhone: officialPhone.trim() || null,
        yearEstablished: yearEstablished.trim() || null,
        description: description.trim() || null,
        serviceAreas: serviceAreas.trim() || null,
        beneficiaryTypes: selectedBeneficiaries.join(', '),
        donationCategoriesRequired: selectedDonationCategories.join(', '),
        maxDistributionCapacity: maxDistributionCapacity ? parseFloat(maxDistributionCapacity) : 0,
        foodCapacity: maxDistributionCapacity ? parseFloat(maxDistributionCapacity) : 0,
        mealsPerDay: mealsPerDay ? parseInt(mealsPerDay, 10) : 0,
        operatingDays: operatingDays.trim() || null,
        operatingHours: operatingHours.trim() || null,
        emergencySupport,

        // Biogas Fields
        plantName: plantName.trim(),
        plantType,
        operatorName: operatorName.trim(),
        plantRegistrationNumber: plantRegistrationNumber.trim() || null,
        gobardhanRegistrationNumber: gobardhanRegistrationNumber.trim() || null,
        mnreApplicationId: mnreApplicationId.trim() || null,
        mnreProgramme: mnreProgramme.trim() || null,
        stateImplementingAgency: stateImplementingAgency.trim() || null,
        commissioningCertificateNumber: commissioningCertificateNumber.trim() || null,
        commissioningDate: commissioningDate || null,
        operatingStatus,
        feedstockCapacityDaily: feedstockCapacityDaily ? parseFloat(feedstockCapacityDaily) : 0,
        processingCapacity: feedstockCapacityDaily ? parseFloat(feedstockCapacityDaily) : 0,
        capacityUnit,
        biogasProductionCapacity: biogasProductionCapacity.trim() || null,
        cbgProductionCapacity: cbgProductionCapacity.trim() || null,
        powerGenerationCapacity: powerGenerationCapacity.trim() || null,
        wasteProcessingCapacity: wasteProcessingCapacity.trim() || null,
        feedstockTypes: selectedFeedstocks.join(', '),

        // Donor Fields
        businessName: businessName.trim(),
        businessType,
        fssaiNumber: fssaiNumber.trim() || null
      };

      const res = await registerUser(payload);

      if (res.success) {
        if (onLoginSuccess && res.token && res.user) {
          onLoginSuccess(res.user, res.token);
        }
        
        // Direct users to their portal
        if (role === 'NGO') navigate('/ngo-dashboard');
        else if (role === 'BIOGAS') navigate('/biogas-dashboard');
        else navigate('/donor-dashboard');
      } else {
        setError(res.message || 'Registration could not be completed.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '940px', margin: '2rem auto', padding: '1rem' }}>
      <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '16px', background: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', marginBottom: '0.8rem' }}>
            <UserPlus size={28} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#111827', margin: '0 0 0.4rem 0' }}>
            Platform Organization Registration
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', maxWidth: '620px', margin: '0 auto' }}>
            Join the SmartSurplus ecosystem. Provide legal compliance credentials, technical capacities, and authentic documentation for Admin review and verification.
          </p>
        </div>

        {/* Organization Role Switcher Tabs (Order: 1st Food Donor, 2nd NGO, 3rd Biogas) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          {/* 1st: Food Donor */}
          <button
            type="button"
            onClick={() => { setRole('DONOR'); setError(''); }}
            style={{
              padding: '1rem 0.8rem',
              borderRadius: '12px',
              border: role === 'DONOR' ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: role === 'DONOR' ? '#eff6ff' : '#ffffff',
              color: role === 'DONOR' ? '#1d4ed8' : '#4b5563',
              fontWeight: '800',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Utensils size={24} color={role === 'DONOR' ? '#2563eb' : '#6b7280'} />
            <span>Food Donor</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '500', color: role === 'DONOR' ? '#2563eb' : '#9ca3af' }}>Hotel, Restaurant, Caterer</span>
          </button>

          {/* 2nd: NGO / Charity */}
          <button
            type="button"
            onClick={() => { setRole('NGO'); setError(''); }}
            style={{
              padding: '1rem 0.8rem',
              borderRadius: '12px',
              border: role === 'NGO' ? '2px solid #16a34a' : '1px solid #e5e7eb',
              background: role === 'NGO' ? '#f0fdf4' : '#ffffff',
              color: role === 'NGO' ? '#15803d' : '#4b5563',
              fontWeight: '800',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Building2 size={24} color={role === 'NGO' ? '#16a34a' : '#6b7280'} />
            <span>NGO / Charity</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '500', color: role === 'NGO' ? '#16a34a' : '#9ca3af' }}>Food Rescue & Distribution</span>
          </button>

          {/* 3rd: Biogas Facility */}
          <button
            type="button"
            onClick={() => { setRole('BIOGAS'); setError(''); }}
            style={{
              padding: '1rem 0.8rem',
              borderRadius: '12px',
              border: role === 'BIOGAS' ? '2px solid #d97706' : '1px solid #e5e7eb',
              background: role === 'BIOGAS' ? '#fffbeb' : '#ffffff',
              color: role === 'BIOGAS' ? '#b45309' : '#4b5563',
              fontWeight: '800',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Factory size={24} color={role === 'BIOGAS' ? '#d97706' : '#6b7280'} />
            <span>Biogas Facility</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '500', color: role === 'BIOGAS' ? '#d97706' : '#9ca3af' }}>CBG / Waste Biomethanation</span>
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.85rem 1.2rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem', fontWeight: '600' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ======================================================================= */}
          {/* SECTION 1: PERSONAL / CONTACT INFORMATION (ALL ROLES) */}
          {/* ======================================================================= */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
              <span style={{ background: '#111827', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>1</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Personal & Contact Information</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Full Name of Contact Person *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Sundar Ramanathan"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Designation / Role *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={role === 'NGO' ? 'e.g., Founder / Trustee / Secretary' : role === 'BIOGAS' ? 'e.g., Plant Manager / Engineer' : 'e.g., General Manager / Owner'}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Email Address (Login Username) *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@organization.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Mobile / Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Account Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Confirm Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* NGO REGISTRATION SPECIFIC SECTIONS (SECTIONS 2 - 4) */}
          {/* ======================================================================= */}
          {role === 'NGO' && (
            <>
              {/* SECTION 2: NGO ORGANIZATION INFORMATION */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                  <span style={{ background: '#15803d', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>NGO Organization Details</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>NGO / Organization Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Annam Foundation"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Organization Legal Type *</label>
                    <select
                      className="form-input"
                      value={ngoType}
                      onChange={(e) => setNgoType(e.target.value)}
                      required
                    >
                      <option value="Trust">Trust</option>
                      <option value="Society">Society</option>
                      <option value="Section 8 Company">Section 8 Company</option>
                      <option value="Child Care & Orphanages">Child Care & Orphanages</option>
                      <option value="Elderly Homes / Old Age Homes">Elderly Homes / Old Age Homes</option>
                      <option value="Food Relief & Rescue Foundation">Food Relief & Rescue Foundation</option>
                      <option value="Community Shelter & Kitchen">Community Shelter & Kitchen</option>
                      <option value="Other Non-Profit Organization">Other Non-Profit Organization</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Legal Registration Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., BK-IV-1234/2019"
                      value={legalRegistrationNumber}
                      onChange={(e) => setLegalRegistrationNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Registration Authority *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Sub-Registrar / Registrar of Societies"
                      value={registrationAuthority}
                      onChange={(e) => setRegistrationAuthority(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Registration Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={registrationDate}
                      onChange={(e) => setRegistrationDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Year Established</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 2018"
                      value={yearEstablished}
                      onChange={(e) => setYearEstablished(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Official Website (Optional)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.yourngo.org"
                      value={officialWebsite}
                      onChange={(e) => setOfficialWebsite(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Official NGO Email (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="info@yourngo.org"
                      value={officialEmail}
                      onChange={(e) => setOfficialEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: NGO DARPAN INFORMATION */}
              <div style={{ border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', background: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ background: '#15803d', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>3</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#14532d' }}>NGO DARPAN Unique ID (NITI Aayog)</h3>
                </div>
                <p style={{ color: '#166534', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  💡 Enter the organization's actual NGO DARPAN Unique ID issued through NITI Aayog portal, if registered. SmartSurplus does not generate this identifier.
                </p>

                <div style={{ maxWidth: '400px' }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#14532d' }}>NGO DARPAN Unique ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., TN/2021/0284912"
                    value={ngoDarpanId}
                    onChange={(e) => setNgoDarpanId(e.target.value.toUpperCase())}
                    style={{ background: '#ffffff', borderColor: '#86efac' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#15803d', display: 'block', marginTop: '0.3rem' }}>
                    Optional / If Applicable. Admin will verify against supporting document before granting Darpan badge.
                  </span>
                </div>
              </div>

              {/* SECTION 4: LEGAL & TAX COMPLIANCE */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                  <span style={{ background: '#15803d', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>4</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Legal & Tax Compliance Information</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Organization PAN Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., AAATF1234K"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      maxLength={10}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Mandatory 10-character Permanent Account Number</span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>12A / 12AB Registration Number (Optional / If Applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., AABCN1234EE20214"
                      value={tax12A12AB}
                      onChange={(e) => setTax12A12AB(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>80G Registration Number (Optional / If Applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., CIT/80G/2020-21/104"
                      value={tax80G}
                      onChange={(e) => setTax80G(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>FCRA Registration Number (Optional / If Applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 075901234"
                      value={fcraNumber}
                      onChange={(e) => setFcraNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================================= */}
          {/* BIOGAS REGISTRATION SPECIFIC SECTIONS (SECTIONS 2 - 4) */}
          {/* ======================================================================= */}
          {role === 'BIOGAS' && (
            <>
              {/* SECTION 2: BIOGAS PLANT INFORMATION */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                  <span style={{ background: '#d97706', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Biogas Plant Facility Details</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Biogas Plant Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., GreenPower Bio-CNG Unit"
                      value={plantName}
                      onChange={(e) => setPlantName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Plant Technology Type *</label>
                    <select
                      className="form-input"
                      value={plantType}
                      onChange={(e) => setPlantType(e.target.value)}
                      required
                    >
                      <option value="Biogas">Biogas (Standard Digester)</option>
                      <option value="CBG">CBG (Compressed Biogas)</option>
                      <option value="Bio-CNG">Bio-CNG</option>
                      <option value="Waste-to-Energy / Biomethanation">Waste-to-Energy / Biomethanation</option>
                      <option value="Other">Other Clean Energy Conversion</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Operator / Enterprise Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., CleanEnergy Renewables Pvt Ltd"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Plant Registration Number (If applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., TNPCB/BIO/2022/89"
                      value={plantRegistrationNumber}
                      onChange={(e) => setPlantRegistrationNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Commissioning Date (If applicable)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={commissioningDate}
                      onChange={(e) => setCommissioningDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Current Operating Status *</label>
                    <select
                      className="form-input"
                      value={operatingStatus}
                      onChange={(e) => setOperatingStatus(e.target.value)}
                      required
                    >
                      <option value="Operational">Operational (Active)</option>
                      <option value="Under Commissioning">Under Commissioning</option>
                      <option value="Expansion / Upgrade">Expansion / Upgrade</option>
                      <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: GOBARDHAN REGISTRATION */}
              <div style={{ border: '1px solid #fed7aa', borderRadius: '12px', padding: '1.5rem', background: '#fff7ed' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ background: '#d97706', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>3</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#9a3412' }}>Government GOBARdhan Registration</h3>
                </div>
                <p style={{ color: '#c2410c', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  💡 Enter the official registration number issued through the Government's Unified GOBARdhan registration portal, if applicable. SmartSurplus will not invent or automatically verify this number.
                </p>

                <div style={{ maxWidth: '420px' }}>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#9a3412' }}>GOBARdhan Registration Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., GOBARDHAN-TN-2023-09412"
                    value={gobardhanRegistrationNumber}
                    onChange={(e) => setGobardhanRegistrationNumber(e.target.value.toUpperCase())}
                    style={{ background: '#ffffff', borderColor: '#fdba74' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#c2410c', display: 'block', marginTop: '0.3rem' }}>
                    Optional / If Applicable. Submitted for Admin audit along with supporting certificate.
                  </span>
                </div>
              </div>

              {/* SECTION 4: MNRE INFORMATION */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                  <span style={{ background: '#d97706', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>4</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>MNRE / Government Programme Details</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>MNRE Application / Project ID (If Applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., MNRE-BIO-2023-741"
                      value={mnreApplicationId}
                      onChange={(e) => setMnreApplicationId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>MNRE Programme / Scheme (If Applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., National Bioenergy Programme / SATAT"
                      value={mnreProgramme}
                      onChange={(e) => setMnreProgramme(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>State Implementing Agency (SIA)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., TEDA (Tamil Nadu Energy Dev Agency)"
                      value={stateImplementingAgency}
                      onChange={(e) => setStateImplementingAgency(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Commissioning Certificate Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., COMM-CERT-2023-882"
                      value={commissioningCertificateNumber}
                      onChange={(e) => setCommissioningCertificateNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================================================================= */}
          {/* DONOR SPECIFIC SECTION */}
          {/* ======================================================================= */}
          {role === 'DONOR' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                <span style={{ background: '#2563eb', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>2</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Donor Business Establishment</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Business / Establishment Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Grand Palace Hotel & Convention"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Business Type *</label>
                  <select
                    className="form-input"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Catering">Catering Service</option>
                    <option value="Event Organizer">Event Organizer</option>
                    <option value="Corporate Cafeteria">Corporate Cafeteria</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Other">Other Food Business</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>14-Digit FSSAI License Number (Optional / If Applicable)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 12423008000123"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                    maxLength={14}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Enables verified donor trust badge upon Admin audit.</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 5: ADDRESS & MAP LOCATION (USER-SPECIFIC, NO DEFAULT CHENNAI) */}
          {/* ======================================================================= */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
              <span style={{ background: '#111827', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>5</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Physical Address & Interactive Map Pinpoint</h3>
            </div>

            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
              📍 Select your exact organization premises on the OpenStreetMap interactive map below. You can click anywhere on the map, use Auto-Detect GPS, or search by address / 6-digit PIN code.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Street Address *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter door no, building name, street name"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLocateByAddress(); } }}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleLocateByAddress}
                    disabled={locating}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff' }}
                    title="Find address on map"
                  >
                    <Search size={14} /> Locate Address
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>City / District</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter city or district"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>State / Region</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>PIN Code (6 Digits)</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit PIN code"
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setPincode(val);
                      if (val.length === 6 && (!latitude || !longitude)) {
                        forwardGeocode(`${val}, India`).then(res => {
                          setLatitude(res.lat.toString());
                          setLongitude(res.lng.toString());
                          if (res.city && !city) setCity(res.city);
                          if (res.state && !state) setState(res.state);
                          setGeoMsg(`🎯 Centered on PIN Code ${val}${res.city ? ` (${res.city})` : ''}`);
                        }).catch(() => {});
                      }
                    }}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleLocateByAddress}
                    disabled={locating}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff' }}
                  >
                    <Crosshair size={13} /> Pin
                  </button>
                </div>
              </div>
            </div>

            {/* Map Component with click selector */}
            <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  <MapPin size={16} color="#16a34a" />
                  <span>Interactive OpenStreetMap — Click anywhere to set location pin</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locating}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', color: '#15803d', fontWeight: '700' }}
                  >
                    <Compass size={14} className={locating ? 'spin' : ''} /> {locating ? 'Detecting Location...' : '🎯 Auto-Detect My GPS'}
                  </button>
                </div>
              </div>

              <div style={{ height: '340px', width: '100%', position: 'relative' }}>
                <Map
                  latitude={latitude ? parseFloat(latitude) : undefined}
                  longitude={longitude ? parseFloat(longitude) : undefined}
                  interactive={true}
                  onLocationSelect={handleMapLocationSelect}
                  height="340px"
                  zoom={latitude && longitude ? 15 : 5}
                />
              </div>

              {/* Coordinates status badge */}
              <div style={{ padding: '0.65rem 1rem', background: latitude && longitude ? '#f0fdf4' : '#fffbeb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                {latitude && longitude ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.82rem', fontWeight: '700' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span>Locked Coordinates: Lat <strong>{latitude}</strong>, Lng <strong>{longitude}</strong></span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.82rem', fontWeight: '600' }}>
                    <AlertCircle size={15} color="#d97706" />
                    <span>No coordinates selected yet. Click on the map or click "Auto-Detect My GPS".</span>
                  </div>
                )}
                {geoMsg && (
                  <div style={{ fontSize: '0.78rem', color: '#4b5563', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {geoMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* SECTION 6 & 7: SERVICE / TECHNICAL CAPACITY */}
          {/* ======================================================================= */}
          {role === 'NGO' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                <span style={{ background: '#15803d', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>6</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Service Capacity & Beneficiary Focus</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Max Daily Distribution Capacity (Meals / Day) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 250"
                    value={maxDistributionCapacity}
                    onChange={(e) => {
                      setMaxDistributionCapacity(e.target.value);
                      setMealsPerDay(e.target.value);
                    }}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Areas / Zones of Service</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., North Zone, Slum Clusters, Central Station"
                    value={serviceAreas}
                    onChange={(e) => setServiceAreas(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Operating Days</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., All 7 Days / Monday - Saturday"
                    value={operatingDays}
                    onChange={(e) => setOperatingDays(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Operating Hours</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 08:00 AM - 10:00 PM"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                  />
                </div>
              </div>

              {/* Beneficiary Focus Checkboxes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Beneficiary Categories Served</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Child Care & Orphanages', 'Elderly Homes & Senior Citizens', 'Homeless & Night Shelters', 'Low-income Families', 'Disaster & Emergency Relief', 'Daily Wage Laborers', 'Special Needs & Disabled Centers', 'Other'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedBeneficiaries, selectedBeneficiaries, b)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: selectedBeneficiaries.includes(b) ? '1px solid #15803d' : '1px solid #d1d5db',
                        background: selectedBeneficiaries.includes(b) ? '#dcfce7' : '#ffffff',
                        color: selectedBeneficiaries.includes(b) ? '#15803d' : '#374151',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedBeneficiaries.includes(b) ? '✓ ' : '+ '} {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accepted Donation Categories */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Donation Categories Accepted</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Cooked Food (Gravy & Dry)', 'Packaged / Sealed Food', 'Fresh Produce & Fruits', 'Bakery Items', 'Raw Grains & Groceries', 'Dairy Products'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedDonationCategories, selectedDonationCategories, cat)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: selectedDonationCategories.includes(cat) ? '1px solid #15803d' : '1px solid #d1d5db',
                        background: selectedDonationCategories.includes(cat) ? '#dcfce7' : '#ffffff',
                        color: selectedDonationCategories.includes(cat) ? '#15803d' : '#374151',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedDonationCategories.includes(cat) ? '✓ ' : '+ '} {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700', color: '#111827' }}>
                  <input
                    type="checkbox"
                    checked={emergencySupport}
                    onChange={(e) => setEmergencySupport(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                  />
                  <span>Equipped for 24/7 Emergency Food Rescue & Disaster Response</span>
                </label>
              </div>
            </div>
          )}

          {role === 'BIOGAS' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
                <span style={{ background: '#d97706', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>6</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Plant Processing Capacity & Feedstock Types</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Daily Feedstock Processing Capacity *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g., 500"
                      value={feedstockCapacityDaily}
                      onChange={(e) => setFeedstockCapacityDaily(e.target.value)}
                      min="1"
                      required
                    />
                    <select
                      className="form-input"
                      value={capacityUnit}
                      onChange={(e) => setCapacityUnit(e.target.value)}
                      style={{ width: '130px' }}
                    >
                      <option value="kg/day">kg/day</option>
                      <option value="tonnes/day">tonnes/day</option>
                      <option value="m³/day">m³/day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Biogas Production Capacity (m³/day)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 150 m³/day"
                    value={biogasProductionCapacity}
                    onChange={(e) => setBiogasProductionCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>CBG Generation Output (kg/day)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 75 kg/day"
                    value={cbgProductionCapacity}
                    onChange={(e) => setCbgProductionCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>Power Generation Capacity (kW)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 25 kW"
                    value={powerGenerationCapacity}
                    onChange={(e) => setPowerGenerationCapacity(e.target.value)}
                  />
                </div>
              </div>

              {/* Feedstock types */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Accepted Feedstock / Organic Waste Types</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Cooked & Expired Food Waste', 'Agricultural & Crop Residue', 'Animal Dung / Manure', 'Organic Municipal Solid Waste', 'Market & Vegetable Waste', 'Canteen & Commercial Kitchen Waste', 'Fruit Processing Residue'].map((feed) => (
                    <button
                      key={feed}
                      type="button"
                      onClick={() => toggleArrayItem(setSelectedFeedstocks, selectedFeedstocks, feed)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        border: selectedFeedstocks.includes(feed) ? '1px solid #d97706' : '1px solid #d1d5db',
                        background: selectedFeedstocks.includes(feed) ? '#ffedd5' : '#ffffff',
                        color: selectedFeedstocks.includes(feed) ? '#c2410c' : '#374151',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedFeedstocks.includes(feed) ? '✓ ' : '+ '} {feed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* SECTION 8: SUPPORTING DOCUMENT VERIFICATION */}
          {/* ======================================================================= */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.6rem' }}>
              <span style={{ background: '#111827', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>{role === 'DONOR' ? '6' : '8'}</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#111827' }}>Official Legal & Verification Documents</h3>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              📄 Upload authentic government/legal certificates. Only core legal proof is required (<span style={{ color: '#dc2626', fontWeight: '700' }}>*</span>); all other documents are optional.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {role === 'NGO' && (
                <>
                  {[
                    { type: 'Organization Registration Certificate', required: true, label: 'Organization Registration Certificate * (Compulsory)' },
                    { type: 'Organization PAN Card', required: true, label: 'Organization PAN Card * (Compulsory)' },
                    { type: 'NGO DARPAN Certificate', required: false, label: 'NGO DARPAN Certificate (Optional / If Available)' },
                    { type: 'Address Proof of Premises', required: false, label: 'Address Proof of Premises (Optional)' },
                    { type: 'Authorized Representative ID', required: false, label: 'Authorized Representative ID (Optional)' },
                    { type: '12A / 12AB Certificate', required: false, label: '12A / 12AB Certificate (Optional)' },
                    { type: '80G Certificate', required: false, label: '80G Certificate (Optional)' },
                    { type: 'FCRA Registration Document', required: false, label: 'FCRA Registration Document (Optional)' }
                  ].map((docItem) => {
                    const uploaded = documents.find(d => d.document_type === docItem.type);
                    return (
                      <div key={docItem.type} style={{ border: uploaded ? '1px solid #86efac' : (docItem.required ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'), borderRadius: '10px', padding: '0.9rem', background: uploaded ? '#f0fdf4' : (docItem.required ? '#ffffff' : '#fcfcfc') }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: docItem.required ? '#111827' : '#4b5563' }}>
                            {docItem.label}
                          </span>
                          {uploaded && (
                            <button type="button" onClick={() => removeDocument(docItem.type)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#15803d', fontWeight: '600' }}>
                            <CheckCircle2 size={14} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{uploaded.document_name} ({uploaded.file_size})</span>
                          </div>
                        ) : (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginTop: '0.3rem' }}>
                            <UploadCloud size={14} />
                            <span>Select PDF / Image</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentPick(docItem.type, e)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {role === 'BIOGAS' && (
                <>
                  {[
                    { type: 'Plant Pollution Control / Reg Documents', required: true, label: 'Plant Registration / Clearance Document * (Compulsory)' },
                    { type: 'GOBARdhan Registration Certificate', required: false, label: 'GOBARdhan Registration Certificate (Optional)' },
                    { type: 'MNRE Project Sanction / Approval Document', required: false, label: 'MNRE Sanction Document (Optional)' },
                    { type: 'Plant Commissioning Certificate', required: false, label: 'Commissioning Certificate (Optional)' },
                    { type: 'Land Ownership / Lease Agreement', required: false, label: 'Land Ownership / Lease Agreement (Optional)' },
                    { type: 'Authorized Representative ID Proof', required: false, label: 'Authorized Representative ID (Optional)' }
                  ].map((docItem) => {
                    const uploaded = documents.find(d => d.document_type === docItem.type);
                    return (
                      <div key={docItem.type} style={{ border: uploaded ? '1px solid #fde047' : (docItem.required ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'), borderRadius: '10px', padding: '0.9rem', background: uploaded ? '#fefce8' : (docItem.required ? '#ffffff' : '#fcfcfc') }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: docItem.required ? '#111827' : '#4b5563' }}>
                            {docItem.label}
                          </span>
                          {uploaded && (
                            <button type="button" onClick={() => removeDocument(docItem.type)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#854d0e', fontWeight: '600' }}>
                            <CheckCircle2 size={14} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{uploaded.document_name} ({uploaded.file_size})</span>
                          </div>
                        ) : (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#d97706', fontWeight: '600', cursor: 'pointer', marginTop: '0.3rem' }}>
                            <UploadCloud size={14} />
                            <span>Select PDF / Image</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentPick(docItem.type, e)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {role === 'DONOR' && (
                <>
                  {[
                    { type: 'FSSAI License Certificate', required: Boolean(fssaiNumber), label: fssaiNumber ? 'FSSAI License Certificate * (Required)' : 'FSSAI License Certificate (Optional)' },
                    { type: 'GSTIN / Business Registration Document', required: false, label: 'GSTIN / Business Registration Document (Optional)' },
                    { type: 'Authorized Manager ID Proof', required: false, label: 'Authorized Manager ID Proof (Optional)' }
                  ].map((docItem) => {
                    const uploaded = documents.find(d => d.document_type === docItem.type);
                    return (
                      <div key={docItem.type} style={{ border: uploaded ? '1px solid #93c5fd' : (docItem.required ? '1px solid #cbd5e1' : '1px dashed #e2e8f0'), borderRadius: '10px', padding: '0.9rem', background: uploaded ? '#eff6ff' : (docItem.required ? '#ffffff' : '#fcfcfc') }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: docItem.required ? '#111827' : '#4b5563' }}>
                            {docItem.label}
                          </span>
                          {uploaded && (
                            <button type="button" onClick={() => removeDocument(docItem.type)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#1e40af', fontWeight: '600' }}>
                            <CheckCircle2 size={14} />
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{uploaded.document_name} ({uploaded.file_size})</span>
                          </div>
                        ) : (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#2563eb', fontWeight: '600', cursor: 'pointer', marginTop: '0.3rem' }}>
                            <UploadCloud size={14} />
                            <span>Select PDF / Image</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              onChange={(e) => handleDocumentPick(docItem.type, e)}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Submission Notice Banner */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Shield size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.4' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Platform Verification Architecture Guarantee:</strong>
              Accounts are onboarded under <strong>PENDING VERIFICATION</strong> status. The Verified ✓ badge and donation dispatch allocations become active only after Administrator verification of legal records.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '1rem',
              fontSize: '1.05rem',
              fontWeight: '800',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: role === 'NGO' ? '#16a34a' : role === 'BIOGAS' ? '#d97706' : '#2563eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {loading ? 'Submitting Registration...' : `Register & Submit for ${role === 'NGO' ? 'NGO' : role === 'BIOGAS' ? 'Biogas' : 'Donor'} Verification`}
            <ChevronRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#6b7280' }}>
          Already have a verified account?{' '}
          <Link to="/login" style={{ color: '#16a34a', fontWeight: '800', textDecoration: 'none' }}>
            Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}

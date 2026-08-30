import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, ArrowLeft, ArrowRight, MapPin, Utensils, Factory, 
  Clock, Truck, CheckCircle2, Navigation, Search, Filter, AlertTriangle,
  User, Phone, ShieldCheck, KeyRound, Copy, Check, Radio, Smartphone, AlertCircle, X
} from 'lucide-react';
import { getBiogasRequests, acceptBiogasRequest } from '../services/biogasAPI';
import { getVehicles, getDrivers, createTrip, startPickup } from '../services/fleetAPI';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function BiogasRequests({ token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') || 'PENDING').toUpperCase();
  const [activeTab, setActiveTab] = useState(['PENDING', 'ACTIVE', 'COMPLETED', 'ALL'].includes(initialTab) ? initialTab : 'PENDING');
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Dispatch & Pairing Modals State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDonationForDispatch, setSelectedDonationForDispatch] = useState(null);
  const [dispatchData, setDispatchData] = useState({
    vehicleId: '',
    driverId: '',
    trackingMethod: 'DRIVER_MOBILE_GPS'
  });
  const [isDispatchSuccessModalOpen, setIsDispatchSuccessModalOpen] = useState(false);
  const [dispatchedTripInfo, setDispatchedTripInfo] = useState(null);
  const [copiedPIN, setCopiedPIN] = useState(false);

  const navigate = useNavigate();

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rRes, vRes, dRes] = await Promise.all([
        getBiogasRequests(token).catch(() => ({ success: false })),
        getVehicles(token).catch(() => ({ success: false })),
        getDrivers(token).catch(() => ({ success: false }))
      ]);

      if (rRes.success) setRequests(rRes.wasteRequests || []);
      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  useEffect(() => {
    const tabParam = (searchParams.get('tab') || 'PENDING').toUpperCase();
    if (['PENDING', 'ACTIVE', 'COMPLETED', 'ALL'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleQuickAccept = async (id) => {
    setActionLoading(true);
    setActionMsg('');
    setActionError('');
    try {
      const res = await acceptBiogasRequest(id, token);
      if (res.success) {
        setActionMsg(`Biogas Request #${id} accepted successfully! Moving to Active Pipeline.`);
        await loadAllData();
        switchTab('ACTIVE');
      } else {
        setActionError(res.message || 'Could not accept request.');
      }
    } catch (err) {
      setActionError('Error accepting request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Dispatch Modal
  const handleOpenDispatchModal = (req) => {
    setSelectedDonationForDispatch(req);
    setDispatchData({
      vehicleId: vehicles[0]?.id || '',
      driverId: drivers[0]?.id || '',
      trackingMethod: vehicles[0]?.gps_tracking_method || 'DRIVER_MOBILE_GPS'
    });
    setActionError('');
    setIsDispatchModalOpen(true);
  };

  // Submit Vehicle & Driver Allocation
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonationForDispatch) return;

    if (!dispatchData.vehicleId || !dispatchData.driverId) {
      setActionError('Please select both a vehicle and an authorized driver from your fleet.');
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const donId = selectedDonationForDispatch.id || selectedDonationForDispatch.donation_id;
      // 1. Create Trip & Generate Pairing Key
      const tripRes = await createTrip({
        donationId: donId,
        vehicleId: dispatchData.vehicleId,
        driverId: dispatchData.driverId,
        handlerType: 'BIOGAS',
        trackingMethod: dispatchData.trackingMethod
      }, token);

      if (!tripRes.success) {
        setActionError(tripRes.message || 'Could not create dispatch trip.');
        setActionLoading(false);
        return;
      }

      // 2. Start Pickup
      const startRes = await startPickup({
        tripId: tripRes.tripId,
        donationId: donId
      }, token);

      if (startRes.success) {
        setIsDispatchModalOpen(false);
        setDispatchedTripInfo({
          tripId: tripRes.tripId,
          tripCode: tripRes.tripCode,
          pairingCode: tripRes.pairingCode,
          driverName: tripRes.driverName || drivers.find(d => Number(d.id) === Number(dispatchData.driverId))?.driver_name || 'Driver',
          vehicleNumber: tripRes.vehicleNumber || vehicles.find(v => Number(v.id) === Number(dispatchData.vehicleId))?.vehicle_number || 'Vehicle',
          donationId: donId,
          foodName: selectedDonationForDispatch.food_name
        });
        setIsDispatchSuccessModalOpen(true);
        loadAllData();
      } else {
        setActionError(startRes.message || 'Could not start pickup.');
      }
    } catch (err) {
      setActionError('Server error initiating vehicle dispatch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPIN = (pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPIN(true);
    setTimeout(() => setCopiedPIN(false), 2500);
  };

  // Status Categorization
  const isPendingStatus = (st) => ['OFFERED', 'PENDING', 'REDIRECTED_TO_BIOGAS', 'EXPIRED', 'POSTED'].includes(st);
  const isActiveStatus = (st) => ['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'PROCESSING'].includes(st);
  const isCompletedStatus = (st) => ['COMPLETED', 'DELIVERED', 'PROCESSED'].includes(st);

  const pendingList = requests.filter(r => isPendingStatus(r.match_status || r.status));
  const activeList = requests.filter(r => isActiveStatus(r.match_status || r.status));
  const completedList = requests.filter(r => isCompletedStatus(r.match_status || r.status));

  // Current tab items filtered by search
  let currentItems = [];
  if (activeTab === 'PENDING') currentItems = pendingList;
  else if (activeTab === 'ACTIVE') currentItems = activeList;
  else if (activeTab === 'COMPLETED') currentItems = completedList;
  else currentItems = requests;

  const filteredItems = currentItems.filter(req => {
    const q = searchTerm.toLowerCase();
    return (
      (req.food_name || '').toLowerCase().includes(q) ||
      (req.food_category || '').toLowerCase().includes(q) ||
      (req.donor_name || '').toLowerCase().includes(q) ||
      String(req.id || req.donation_id || '').includes(q)
    );
  });

  // Dynamic View Titles based on activeTab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'PENDING':
        return {
          title: 'Pending Waste Requests',
          icon: '⏳',
          color: '#d97706',
          desc: 'Surplus food listings routed for biogas recovery awaiting plant acceptance and transport scheduling.'
        };
      case 'ACTIVE':
        return {
          title: 'Active Waste Pipeline',
          icon: '🚚',
          color: '#2563eb',
          desc: 'Accepted requests currently in pickup dispatch, transit, or plant digester intake.'
        };
      case 'COMPLETED':
        return {
          title: 'Completed Biogas Conversions',
          icon: '🌱',
          color: '#16a34a',
          desc: 'Successfully collected and processed organic waste converted into clean renewable fuel.'
        };
      default:
        return {
          title: 'Redirected Food Waste Records',
          icon: '⚡',
          color: '#d97706',
          desc: 'Complete history of all expired surplus food listings assigned to your facility.'
        };
    }
  };

  const tabConfig = getTabConfig();

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{tabConfig.title}</span>
            <span>{tabConfig.icon}</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.3rem 0 0' }}>
            {tabConfig.desc}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <Link to="/biogas/fleet" className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Truck size={16} /> Manage Fleet ({vehicles.length} Vans, {drivers.length} Drivers)
          </Link>
          <Link to="/biogas-dashboard" className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', border: '1px solid #bbf7d0', fontWeight: '700', fontSize: '0.9rem' }}>
          ✓ {actionMsg}
        </div>
      )}

      {actionError && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '12px', border: '1px solid #fecaca', fontWeight: '700', fontSize: '0.9rem' }}>
          ⚠️ {actionError}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="glass-card" style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="#9ca3af" />
        <input 
          type="text"
          placeholder={`Search ${activeTab.toLowerCase()} requests by food name, donor, or category...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ border: 'none', padding: '0.2rem 0', width: '100%', fontSize: '0.92rem', outline: 'none' }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontWeight: '700' }}>
            Clear
          </button>
        )}
      </div>

      {/* MAIN TAB CONTENT CONTAINER */}
      <div className="glass-card" style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        
        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>Loading waste requests...</p>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {activeTab === 'PENDING' ? '⏳' : activeTab === 'ACTIVE' ? '🚚' : activeTab === 'COMPLETED' ? '🌱' : '📋'}
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#374151', margin: '0 0 0.4rem', fontWeight: '800' }}>
              {activeTab === 'PENDING' ? 'No Pending Waste Offers' : activeTab === 'ACTIVE' ? 'No Active In-Transit Pickups' : activeTab === 'COMPLETED' ? 'No Completed Conversions Yet' : 'No Requests Found'}
            </h3>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              {activeTab === 'PENDING' 
                ? 'When food surplus safety limits expire across donors, requests will be routed here for acceptance.'
                : activeTab === 'ACTIVE'
                ? 'Accepted requests scheduled for vehicle pickup and transport will appear in this tab.'
                : 'Processed and converted food waste listings will be archived here with environmental metrics.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredItems.map((req) => {
              const currentStatus = String(req.match_status || req.status || 'OFFERED').toUpperCase();
              const isPending = isPendingStatus(currentStatus);
              const isActive = isActiveStatus(currentStatus);
              const isCompleted = isCompletedStatus(currentStatus);
              const qtyNum = parseFloat(req.quantity || 0);
              const estimatedBiogas = (qtyNum * 0.45).toFixed(2);
              const donationId = req.id || req.donation_id;

              return (
                <div 
                  key={req.id || req.match_id || req.donation_id} 
                  style={{ 
                    background: isCompleted ? '#f0fdf4' : isActive ? '#f8fafc' : '#fffbeb', 
                    padding: '1.4rem', 
                    borderRadius: '14px', 
                    border: isCompleted ? '1.5px solid #bbf7d0' : isActive ? '1.5px solid #bfdbfe' : '1.5px solid #fde68a', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    
                    {/* Badge header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '900', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '6px',
                        background: isCompleted ? '#dcfce7' : isActive ? '#dbeafe' : '#fef3c7',
                        color: isCompleted ? '#15803d' : isActive ? '#1d4ed8' : '#b45309'
                      }}>
                        {currentStatus.replace(/_/g, ' ')}
                      </span>

                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#15803d', background: 'white', padding: '0.18rem 0.55rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                        {req.food_category || 'Surplus Waste'}
                      </span>

                      {/* Driver PIN Display Pill */}
                      {req.pairing_code && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#eff6ff',
                          border: '1.5px dashed #3b82f6',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          color: '#1e40af',
                          fontWeight: '800'
                        }}>
                          <span>🔑 Driver PIN:</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '1.5px', color: '#1d4ed8' }}>{req.pairing_code}</span>
                        </div>
                      )}

                      {isCompleted && (
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#d97706', background: '#fffbeb', padding: '0.18rem 0.55rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                          ⚡ ~{estimatedBiogas} m³ Clean Biogas
                        </span>
                      )}
                    </div>

                    {/* Food Name */}
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '0.4rem', marginBottom: '0.2rem', color: '#111827' }}>
                      {req.food_name}
                    </h3>

                    {/* Quantity and Donor */}
                    <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span>Quantity: <strong style={{ color: '#0f172a' }}>{req.quantity} {req.quantity_unit || 'Meals'}</strong></span>
                      &bull;
                      <span>Donor: <strong>{req.donor_name || 'Food Donor'}</strong></span>
                      <VerifiedDonorBadge isVerified={req.is_donor_verified || req.is_verified} compact={true} />
                    </p>

                    {/* Vehicle & Driver assigned display */}
                    {(req.vehicle_number || req.driver_name) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: '#1e40af', background: '#f0f9ff', padding: '0.35rem 0.65rem', borderRadius: '8px', margin: '0.3rem 0', width: 'fit-content' }}>
                        <Truck size={14} />
                        <span><strong>Vehicle:</strong> {req.vehicle_number || 'Van'}</span>
                        &bull;
                        <User size={14} />
                        <span><strong>Driver:</strong> {req.driver_name || 'Assigned Driver'}</span>
                      </div>
                    )}

                    {/* Address & Distance */}
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '0.2rem 0 0' }}>
                      <MapPin size={14} color="#0ea5e9" /> {req.donor_address || req.pickup_address || 'Location Specified'} ({req.distance || '5.8'} km away)
                    </p>

                  </div>

                  {/* Actions Right Side */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    {/* If in Pending status, allow immediate Accept button */}
                    {isPending && (
                      <button 
                        onClick={() => handleQuickAccept(donationId)} 
                        disabled={actionLoading}
                        className="btn-primary" 
                        style={{ background: '#d97706', borderColor: '#d97706', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '800' }}
                      >
                        ⚡ Accept Request
                      </button>
                    )}

                    {/* If ACCEPTED, allow Assign Vehicle & Start Pickup */}
                    {currentStatus === 'ACCEPTED' && (
                      <button 
                        onClick={() => handleOpenDispatchModal(req)} 
                        disabled={actionLoading}
                        className="btn-primary" 
                        style={{ background: '#2563eb', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
                      >
                        <Truck size={16} /> Assign Vehicle & Start Pickup
                      </button>
                    )}

                    {/* Live Tracking for Active & Completed */}
                    {(isActive || isCompleted) && (
                      <Link 
                        to={`/tracking/${donationId}`} 
                        className="btn-secondary" 
                        style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Navigation size={15} color="#0284c7" /> Live Route
                      </Link>
                    )}

                    <button 
                      onClick={() => navigate(`/biogas/requests/${donationId}`)} 
                      className="btn-secondary" 
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      Workflow <ArrowRight size={14} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* DISPATCH ALLOCATION MODAL (Matching NGO Portal) */}
      {isDispatchModalOpen && selectedDonationForDispatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsDispatchModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Assign Vehicle & Dispatch Pickup
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Select collection van and driver for {selectedDonationForDispatch.food_name}
                </span>
              </div>
            </div>

            {actionError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {actionError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* Vehicle Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Select Collection Van / Vehicle:
                </label>
                {vehicles.length === 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                    ⚠️ No vehicles registered in Biogas fleet.{' '}
                    <Link to="/biogas/fleet" style={{ color: '#2563eb', fontWeight: '700' }}>Register a Vehicle Now</Link>
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={dispatchData.vehicleId}
                    onChange={(e) => setDispatchData({ ...dispatchData, vehicleId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="">-- Choose Fleet Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.vehicle_type || 'Waste Van'} - {v.capacity || '500kg'} - {v.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Driver Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  Select Authorized Driver:
                </label>
                {drivers.length === 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                    ⚠️ No drivers registered in fleet.{' '}
                    <Link to="/biogas/fleet" style={{ color: '#2563eb', fontWeight: '700' }}>Add a Driver Now</Link>
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={dispatchData.driverId}
                    onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <option value="">-- Choose Assigned Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driver_name} ({d.driver_phone} - {d.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tracking Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.4rem' }}>
                  GPS Tracking Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS' ? '#2563eb' : '#e2e8f0',
                    background: dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS' ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS' ? '#1d4ed8' : '#475569'
                  }}>
                    <input
                      type="radio"
                      name="trackingMethod"
                      value="DRIVER_MOBILE_GPS"
                      checked={dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS'}
                      onChange={(e) => setDispatchData({ ...dispatchData, trackingMethod: e.target.value })}
                    />
                    <Smartphone size={16} /> Driver Mobile GPS
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: dispatchData.trackingMethod === 'VEHICLE_IOT_GPS' ? '#2563eb' : '#e2e8f0',
                    background: dispatchData.trackingMethod === 'VEHICLE_IOT_GPS' ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: dispatchData.trackingMethod === 'VEHICLE_IOT_GPS' ? '#1d4ed8' : '#475569'
                  }}>
                    <input
                      type="radio"
                      name="trackingMethod"
                      value="VEHICLE_IOT_GPS"
                      checked={dispatchData.trackingMethod === 'VEHICLE_IOT_GPS'}
                      onChange={(e) => setDispatchData({ ...dispatchData, trackingMethod: e.target.value })}
                    />
                    <Radio size={16} /> Vehicle IoT GPS
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || vehicles.length === 0 || drivers.length === 0}
                  className="btn-primary"
                  style={{ flex: 1.5, justifyContent: 'center', background: '#2563eb' }}
                >
                  {actionLoading ? 'Dispatching...' : 'Confirm & Start Pickup'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DISPATCH SUCCESS & DRIVER PAIRING PIN MODAL (Matching NGO Portal) */}
      {isDispatchSuccessModalOpen && dispatchedTripInfo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1060,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            background: 'white',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            padding: '2.2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#111827', margin: '0 0 0.4rem' }}>
              Collection Vehicle Dispatched!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Trip <strong>{dispatchedTripInfo.tripCode}</strong> has started for <strong>{dispatchedTripInfo.foodName}</strong>.
            </p>

            {/* Random Pairing PIN Display Box */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #3b82f6',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#1e40af', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                <KeyRound size={16} /> DRIVER LOGIN RANDOM PAIRING CODE
              </div>

              <div style={{
                fontFamily: 'monospace',
                fontSize: '2.5rem',
                fontWeight: '900',
                letterSpacing: '8px',
                color: '#1d4ed8',
                margin: '0.5rem 0'
              }}>
                {dispatchedTripInfo.pairingCode || '------'}
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
                Single-use PIN valid for 2 hours. Hand this code to driver <strong>{dispatchedTripInfo.driverName}</strong> ({dispatchedTripInfo.vehicleNumber}).
              </p>

              <button
                onClick={() => handleCopyPIN(dispatchedTripInfo.pairingCode)}
                className="btn-primary"
                style={{
                  background: copiedPIN ? '#16a34a' : '#2563eb',
                  borderColor: copiedPIN ? '#16a34a' : '#2563eb',
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {copiedPIN ? <Check size={16} /> : <Copy size={16} />}
                {copiedPIN ? 'PIN Copied to Clipboard!' : 'Copy 6-Digit PIN'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setIsDispatchSuccessModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Done
              </button>

              <Link
                to={`/tracking/${dispatchedTripInfo.donationId}`}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Navigation size={16} /> Track Live Route
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

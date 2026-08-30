import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatchedDonations } from '../services/ngoAPI';
import { updateDonationStatus } from '../services/donationAPI';
import { getVehicles, getDrivers, createTrip, startPickup } from '../services/fleetAPI';
import { Handshake, MapPin, Navigation, Calendar, CheckCircle2, Truck, Check, Eye, User, ShieldCheck, Smartphone, Radio, X, AlertCircle } from 'lucide-react';
import DonorProfileModal from '../components/DonorProfileModal';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function NGOMatchedDonations({ token }) {
  const [matches, setMatches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDonationForDispatch, setSelectedDonationForDispatch] = useState(null);
  const [dispatchedTripInfo, setDispatchedTripInfo] = useState(null);
  const [isDispatchSuccessModalOpen, setIsDispatchSuccessModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    vehicleId: '',
    driverId: '',
    trackingMethod: 'DRIVER_MOBILE_GPS'
  });

  const fetchMatches = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mRes, vRes, dRes] = await Promise.all([
        getMatchedDonations(token),
        getVehicles(token).catch(() => ({ success: false })),
        getDrivers(token).catch(() => ({ success: false }))
      ]);

      if (mRes.success) setMatches(mRes.matches || []);
      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
    } catch (err) {
      console.error('Error fetching matched donations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [token]);

  const handleOpenDonorProfile = (donorInfo) => {
    setSelectedDonor(donorInfo);
    setIsModalOpen(true);
  };

  const handleOpenDispatchModal = (donation) => {
    setSelectedDonationForDispatch(donation);
    setDispatchData({
      vehicleId: vehicles[0]?.id || '',
      driverId: drivers[0]?.id || '',
      trackingMethod: vehicles[0]?.gps_tracking_method || 'DRIVER_MOBILE_GPS'
    });
    setActionError('');
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonationForDispatch) return;

    if (!dispatchData.vehicleId || !dispatchData.driverId) {
      setActionError('Please select both a vehicle and an authorized driver.');
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const donationId = selectedDonationForDispatch.donation_id || selectedDonationForDispatch.id;

      // 1. Create Trip & Generate Pairing Key
      const tripRes = await createTrip({
        donationId: donationId,
        vehicleId: dispatchData.vehicleId,
        driverId: dispatchData.driverId,
        handlerType: 'NGO',
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
        donationId: donationId
      }, token);

      if (startRes.success) {
        setIsDispatchModalOpen(false);
        setDispatchedTripInfo({
          tripId: tripRes.tripId,
          tripCode: tripRes.tripCode,
          pairingCode: tripRes.pairingCode || startRes.pairingCode,
          driverName: tripRes.driverName || drivers.find(d => Number(d.id) === Number(dispatchData.driverId))?.driver_name || 'Driver',
          vehicleNumber: tripRes.vehicleNumber || vehicles.find(v => Number(v.id) === Number(dispatchData.vehicleId))?.vehicle_number || 'Vehicle',
          donationId: donationId,
          foodName: selectedDonationForDispatch.food_name
        });
        setIsDispatchSuccessModalOpen(true);
        fetchMatches();
      } else {
        setActionError(startRes.message || 'Could not start pickup.');
      }
    } catch (err) {
      setActionError('Server error initiating vehicle dispatch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setActionMsg('');
    setActionLoading(true);
    try {
      const res = await updateDonationStatus(id, newStatus, token);
      if (res.success) {
        setActionMsg(`Donation #${id} status updated to: ${newStatus.replace(/_/g, ' ')}!`);
        fetchMatches();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>🤝 Confirmed Matched Donations</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Active matched pairings between verified surplus donors and your organization confirmed by the smart matching engine.
        </p>
      </div>

      {actionMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
          ✓ {actionMsg}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading confirmed matches...</p>
      ) : matches.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'white', border: '1px solid #e5e7eb' }}>
          <Handshake size={52} color="#9ca3af" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#374151', margin: '0 0 0.4rem' }}>No Active Matched Donations</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>When a donor's food offer is matched or accepted by your shelter, it will appear here.</p>
          <Link to="/ngo/incoming-requests" className="btn-primary" style={{ display: 'inline-flex' }}>
            View Incoming Requests
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {matches.map((item) => {
            const donStatus = item.donation_status || item.status || 'ACCEPTED';
            const isVerifiedDonor = Boolean(item.is_donor_verified);
            const isFssaiVerified = Boolean(item.is_fssai_verified);

            return (
              <div key={item.match_id || item.donation_id} className="glass-card" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                border: isVerifiedDonor ? '1.5px solid #86efac' : '1px solid #bae6fd',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)'
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        MATCH #{item.match_id || 'M101'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#faf5ff', color: '#7e22ce', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        SCORE: {item.match_score || 95}%
                      </span>
                      <span className={`badge badge-${donStatus.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {donStatus.replace(/_/g, ' ')}
                      </span>
                      {isVerifiedDonor && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: '800'
                        }}>
                          <Check size={12} strokeWidth={3} /> Verified Donor
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>
                      {item.food_name} ({item.quantity} {item.quantity_unit || 'Meals'})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.pairing_code && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: '#eff6ff',
                        border: '1.5px dashed #3b82f6',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        color: '#1e40af',
                        fontWeight: '800'
                      }}>
                        <span>🔑 Driver PIN:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '2px', color: '#1d4ed8' }}>{item.pairing_code}</span>
                      </div>
                    )}

                    {(donStatus === 'ACCEPTED' || donStatus === 'MATCHED' || donStatus === 'OFFERED' || donStatus === 'POSTED') && (
                      <button
                        onClick={() => handleOpenDispatchModal(item)}
                        disabled={actionLoading}
                        className="btn-primary"
                        style={{ background: '#2563eb', padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
                      >
                        <Truck size={16} /> Assign Vehicle & Start Pickup
                      </button>
                    )}

                    {donStatus === 'PICKUP_STARTED' && (
                      <span style={{ fontSize: '0.82rem', color: '#a16207', background: '#fefce8', border: '1px solid #fef08a', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        🚚 Vehicle Dispatched (En Route)
                      </span>
                    )}

                    {(donStatus === 'COLLECTED' || donStatus === 'IN_TRANSIT') && (
                      <button
                        onClick={() => handleStatusUpdate(item.donation_id || item.id, 'DELIVERED')}
                        disabled={actionLoading}
                        className="btn-primary"
                        style={{ background: '#16a34a', padding: '0.55rem 1.2rem', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <CheckCircle2 size={16} /> Confirm Food Received & Delivered
                      </button>
                    )}

                    <Link to={`/tracking/${item.donation_id}`} className="btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Navigation size={16} /> Live Route
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>Donor Pickup</div>
                    <div style={{ fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{item.donor_name}</span>
                      <VerifiedDonorBadge isVerified={isVerifiedDonor} />
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '0.8rem' }}>{item.pickup_address || item.donor_address}</div>
                    <button
                      onClick={() => handleOpenDonorProfile({
                        businessName: item.donor_name,
                        contactPerson: item.donor_contact_person,
                        phone: item.donor_phone,
                        email: item.donor_email,
                        address: item.pickup_address || item.donor_address || '',
                        city: item.donor_city || '',
                        state: item.donor_state || '',
                        businessType: item.donor_business_type || 'Food Donor',
                        fssaiNumber: item.donor_fssai_number || '',
                        isVerified: isVerifiedDonor,
                        isFssaiVerified: isFssaiVerified,
                        isBusinessVerified: Boolean(item.is_business_verified || isVerifiedDonor),
                        isLocationVerified: Boolean(item.is_location_verified || isVerifiedDonor),
                        isPhoneVerified: Boolean(item.is_phone_verified || isVerifiedDonor)
                      })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#15803d',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0',
                        marginTop: '0.3rem'
                      }}
                    >
                      <Eye size={12} /> View Donor Dossier
                    </button>
                  </div>

                  <div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>Shelter Destination</div>
                    <div style={{ fontWeight: '800', color: '#111827' }}>{item.organization_name}</div>
                    <div style={{ color: '#4b5563', fontSize: '0.8rem' }}>{item.ngo_address}</div>
                  </div>

                  <div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>Delivery Status</div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: donStatus === 'DELIVERED' ? '#15803d' : '#0369a1', background: donStatus === 'DELIVERED' ? '#dcfce7' : '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'inline-block', marginTop: '0.2rem' }}>
                      {donStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ==================== MODAL: ASSIGN VEHICLE & DRIVER ==================== */}
      {isDispatchModalOpen && selectedDonationForDispatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '10px' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>Assign Vehicle & Driver</h3>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Donation #{selectedDonationForDispatch.donation_id} &bull; {selectedDonationForDispatch.food_name}</span>
                </div>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '600', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleDispatchSubmit}>
              {/* Select Vehicle */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  Select Vehicle *
                </label>
                {vehicles.length === 0 ? (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                    No vehicles registered yet. <Link to="/ngo/vehicles" style={{ color: '#dc2626', fontWeight: '800', textDecoration: 'underline' }}>Register a vehicle first →</Link>
                  </div>
                ) : (
                  <select
                    value={dispatchData.vehicleId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      const matchedVeh = vehicles.find(v => Number(v.id) === Number(vId));
                      setDispatchData(prev => ({
                        ...prev,
                        vehicleId: vId,
                        trackingMethod: matchedVeh?.gps_tracking_method || prev.trackingMethod
                      }));
                    }}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem', fontWeight: '700' }}
                  >
                    <option value="">-- Choose Transport Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({v.vehicle_type}) &bull; {v.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Driver */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  Select Assigned Driver *
                </label>
                {drivers.length === 0 ? (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                    No drivers registered yet. <Link to="/ngo/drivers" style={{ color: '#dc2626', fontWeight: '800', textDecoration: 'underline' }}>Register a driver first →</Link>
                  </div>
                ) : (
                  <select
                    value={dispatchData.driverId}
                    onChange={(e) => setDispatchData({ ...dispatchData, driverId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem', fontWeight: '700' }}
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.driver_name} ({d.driver_phone}) &bull; {d.status}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* GPS Tracking Method Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
                  Tracking Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setDispatchData(prev => ({ ...prev, trackingMethod: 'DRIVER_MOBILE_GPS' }))}
                    style={{
                      padding: '0.75rem',
                      border: dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS' ? '2px solid #2563eb' : '1px solid #d1d5db',
                      background: dispatchData.trackingMethod === 'DRIVER_MOBILE_GPS' ? '#eff6ff' : '#ffffff',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Smartphone size={16} color="#2563eb" />
                      <strong style={{ fontSize: '0.85rem', color: '#1e40af' }}>Driver Mobile GPS</strong>
                    </div>
                  </div>

                  <div
                    onClick={() => setDispatchData(prev => ({ ...prev, trackingMethod: 'VEHICLE_IOT_GPS' }))}
                    style={{
                      padding: '0.75rem',
                      border: dispatchData.trackingMethod === 'VEHICLE_IOT_GPS' ? '2px solid #d97706' : '1px solid #d1d5db',
                      background: dispatchData.trackingMethod === 'VEHICLE_IOT_GPS' ? '#fffbeb' : '#ffffff',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Radio size={16} color="#d97706" />
                      <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>Vehicle IoT Device</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || vehicles.length === 0 || drivers.length === 0}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#2563eb', color: '#ffffff', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Truck size={18} />
                  <span>{actionLoading ? 'Dispatching...' : 'Dispatch Vehicle & Driver'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donor Dossier Modal */}
      {selectedDonor && (
        <DonorProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          donor={selectedDonor}
        />
      )}

      {/* ==================== MODAL: DRIVER PAIRING PIN & DISPATCH SUCCESS ==================== */}
      {isDispatchSuccessModalOpen && dispatchedTripInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#111827', margin: '0 0 0.4rem' }}>
              Vehicle Dispatched Successfully! 🚚
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
              Trip <strong>{dispatchedTripInfo.tripCode}</strong> has started for <em>{dispatchedTripInfo.foodName}</em>.
            </p>

            {/* PAIRING PIN BOX */}
            <div style={{ background: '#f8fafc', border: '2px dashed #93c5fd', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
                🔑 Driver 6-Digit Login Pairing Code
              </span>
              
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1e40af', letterSpacing: '8px', fontFamily: 'monospace', background: '#eff6ff', padding: '0.6rem 1rem', borderRadius: '12px', display: 'inline-block', border: '1px solid #bfdbfe' }}>
                {dispatchedTripInfo.pairingCode || '582914'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dispatchedTripInfo.pairingCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  style={{ background: copiedCode ? '#15803d' : '#2563eb', color: '#ffffff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedCode ? '✓ Copied PIN' : '📋 Copy PIN'}
                </button>
              </div>

              <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '0.85rem 0 0', lineHeight: '1.4' }}>
                Give this 6-digit random code to driver <strong>{dispatchedTripInfo.driverName}</strong> (Vehicle: <strong>{dispatchedTripInfo.vehicleNumber}</strong>). The driver visits <strong>/driver-login</strong> to start live GPS location streaming.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsDispatchSuccessModalOpen(false)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem', fontWeight: '800', background: '#15803d', borderColor: '#15803d' }}
              >
                Done & View Live Tracking
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

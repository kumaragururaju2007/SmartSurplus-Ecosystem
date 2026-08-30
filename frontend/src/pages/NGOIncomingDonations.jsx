import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncomingDonations } from '../services/ngoAPI';
import { updateDonationStatus } from '../services/donationAPI';
import { getVehicles, getDrivers, createTrip, startPickup } from '../services/fleetAPI';
import { Package, Truck, CheckCircle2, Navigation, MapPin, Building2, UserCheck, ShieldCheck, Check, Eye, X, Smartphone, Radio, Copy } from 'lucide-react';
import DonorProfileModal from '../components/DonorProfileModal';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import '../styles/dashboard.css';

export default function NGOIncomingDonations({ token }) {
  const [incoming, setIncoming] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dispatch Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDonationForDispatch, setSelectedDonationForDispatch] = useState(null);
  const [dispatchedTripInfo, setDispatchedTripInfo] = useState(null);
  const [isDispatchSuccessModalOpen, setIsDispatchSuccessModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    vehicleId: '',
    driverId: '',
    trackingMethod: 'DRIVER_MOBILE_GPS'
  });

  const fetchPipeline = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [res, vRes, dRes] = await Promise.all([
        getIncomingDonations(token),
        getVehicles(token).catch(() => ({ success: false })),
        getDrivers(token).catch(() => ({ success: false }))
      ]);

      if (res.success) setIncoming(res.incoming || []);
      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [token]);

  const handleOpenDonorProfile = (donorInfo) => {
    setSelectedDonor(donorInfo);
    setIsModalOpen(true);
  };

  const handleOpenDispatchModal = (item) => {
    setSelectedDonationForDispatch(item);
    setDispatchData({
      vehicleId: vehicles[0]?.id || '',
      driverId: drivers[0]?.id || '',
      trackingMethod: vehicles[0]?.gps_tracking_method || 'DRIVER_MOBILE_GPS'
    });
    setError('');
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonationForDispatch) return;

    if (!dispatchData.vehicleId || !dispatchData.driverId) {
      setError('Please select both a vehicle and an authorized driver.');
      return;
    }

    setActionLoading(true);
    setError('');

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
        setError(tripRes.message || 'Could not create dispatch trip.');
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
        fetchPipeline();
      } else {
        setError(startRes.message || 'Could not start pickup.');
      }
    } catch (err) {
      setError('Server error initiating vehicle dispatch.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    setMsg('');
    setError('');
    try {
      const res = await updateDonationStatus(donationId, newStatus, token);
      if (res.success) {
        setMsg(`Donation #${donationId} status updated to: ${newStatus.replace(/_/g, ' ')}!`);
        fetchPipeline();
      } else {
        setError(res.message || 'Status transition failed.');
      }
    } catch (err) {
      setError('Connection failure.');
    }
  };

  const STEPS = ['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'DELIVERED'];

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827' }}>📦 Incoming Donations Pipeline</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Track and manage food surplus pickup, transit, and shelter receipt status from verified donors.
        </p>
      </div>

      {msg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', color: '#15803d', borderRadius: '12px', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
          ✓ {msg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading incoming pipeline...</p>
      ) : incoming.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'white', border: '1px solid #e5e7eb' }}>
          <Package size={52} color="#9ca3af" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#374151', margin: '0 0 0.4rem' }}>No Active Donations In Pipeline</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Accepted matched donations ready for vehicle pickup will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {incoming.map((item) => {
            const isVerifiedDonor = Boolean(item.is_donor_verified);
            const isFssaiVerified = Boolean(item.is_fssai_verified);
            const currentStatus = item.status === 'IN_TRANSIT' ? 'COLLECTED' : item.status === 'COMPLETED' ? 'DELIVERED' : item.status;

            return (
              <div key={item.id} className="glass-card" style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                border: isVerifiedDonor ? '1.5px solid #86efac' : '1px solid #e5e7eb'
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        DONATION #{item.id}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                    <span className={`badge badge-${item.status ? item.status.toLowerCase() : 'accepted'}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <Link to={`/tracking/${item.id}`} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Eye size={14} /> Live Route
                    </Link>
                  </div>
                </div>

                {/* PROGRESS STEPPER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem', position: 'relative' }}>
                  {STEPS.map((step, idx) => {
                    const stepIdx = STEPS.indexOf(currentStatus);
                    const isPassed = stepIdx >= idx && stepIdx !== -1;
                    const isCurrent = currentStatus === step;

                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isPassed ? '#16a34a' : '#e5e7eb',
                          color: isPassed ? 'white' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.82rem',
                          boxShadow: isCurrent ? '0 0 0 4px #bbf7d0' : 'none'
                        }}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? '#16a34a' : '#6b7280', marginTop: '0.3rem', textAlign: 'center' }}>
                          {step.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* DETAILS & ACTION ROW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>
                      <MapPin size={15} color="#16a34a" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                      Pickup Location: <strong>{item.pickup_address || item.donor_address}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <span>Donor: <strong>{item.donor_name}</strong></span>
                      <VerifiedDonorBadge isVerified={isVerifiedDonor} />
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
                          gap: '0.2rem'
                        }}
                      >
                        <Eye size={12} /> View Trust Dossier
                      </button>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(item.status === 'ACCEPTED' || item.status === 'MATCHED' || item.status === 'OFFERED' || item.status === 'POSTED') && (
                      <button
                        onClick={() => handleOpenDispatchModal(item)}
                        disabled={actionLoading}
                        className="btn-primary"
                        style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}
                      >
                        <Truck size={16} /> Assign Vehicle & Start Pickup
                      </button>
                    )}

                    {item.status === 'PICKUP_STARTED' && (
                      <span style={{ fontSize: '0.85rem', color: '#a16207', background: '#fefce8', border: '1px solid #fef08a', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800' }}>
                        🚚 Vehicle En Route (Waiting for Donor Handover)
                      </span>
                    )}

                    {(item.status === 'COLLECTED' || item.status === 'IN_TRANSIT') && (
                      <button
                        onClick={() => handleStatusUpdate(item.id, 'DELIVERED')}
                        className="btn-primary"
                        style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem', background: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}
                      >
                        <CheckCircle2 size={16} /> Confirm Food Received & Delivered
                      </button>
                    )}

                    {(item.status === 'DELIVERED' || item.status === 'COMPLETED') && (
                      <span style={{ fontSize: '0.85rem', color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800' }}>
                        ✓ Completed & Distributed
                      </span>
                    )}

                    <Link to={`/tracking/${item.id}`} className="btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Navigation size={15} /> Live Route
                    </Link>
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
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Donation #{selectedDonationForDispatch.id} &bull; {selectedDonationForDispatch.food_name}</span>
                </div>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '600', marginBottom: '1rem' }}>
                {error}
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

      {/* ==================== MODAL: DISPATCH SUCCESS & PAIRING PIN ==================== */}
      {isDispatchSuccessModalOpen && dispatchedTripInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '2.25rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#111827', marginBottom: '0.4rem' }}>
              Vehicle Dispatched & Pickup Started! 🚀
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
              Trip <strong>{dispatchedTripInfo.tripCode}</strong> has been created for Donation #{dispatchedTripInfo.donationId}.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Assigned Vehicle:</span>
                <strong style={{ color: '#0f172a' }}>{dispatchedTripInfo.vehicleNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Assigned Driver:</span>
                <strong style={{ color: '#0f172a' }}>{dispatchedTripInfo.driverName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Donation:</span>
                <strong style={{ color: '#0f172a' }}>{dispatchedTripInfo.foodName}</strong>
              </div>
            </div>

            {/* DRIVER PAIRING CODE CARD */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px dashed #3b82f6', borderRadius: '18px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                Driver 6-Digit Mobile App Pairing PIN
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1d4ed8', letterSpacing: '6px', fontFamily: 'monospace', margin: '0.2rem 0' }}>
                {dispatchedTripInfo.pairingCode}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#3b82f6', margin: '0.2rem 0 0.8rem' }}>
                Give this 6-digit code to the driver to log in to the Driver Mobile App.
              </p>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(dispatchedTripInfo.pairingCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 3000);
                }}
                style={{ background: '#ffffff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copiedCode ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Pairing PIN'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setIsDispatchSuccessModalOpen(false)}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', background: '#15803d', border: 'none', borderRadius: '12px', fontWeight: '800', color: '#ffffff', cursor: 'pointer' }}
              >
                Done
              </button>
              <Link
                to={`/tracking/${dispatchedTripInfo.donationId}`}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Navigation size={16} /> Open Live Map
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DONOR PROFILE TRUST MODAL */}
      <DonorProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDonor(null);
        }}
        initialData={selectedDonor}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Factory, MapPin, ArrowLeft, Check, X, Truck, Zap, AlertTriangle, 
  ShieldCheck, Navigation, KeyRound, Copy, User, Smartphone, Radio, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { 
  getBiogasRequestDetails, 
  acceptBiogasRequest, 
  rejectBiogasRequest, 
  startPickup, 
  completeCollection, 
  completeProcessing 
} from '../services/biogasAPI';
import { getVehicles, getDrivers, createTrip } from '../services/fleetAPI';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';

export default function BiogasRequestDetails({ token }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Dispatch & PIN modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    vehicleId: '',
    driverId: '',
    trackingMethod: 'DRIVER_MOBILE_GPS'
  });
  const [isDispatchSuccessModalOpen, setIsDispatchSuccessModalOpen] = useState(false);
  const [dispatchedTripInfo, setDispatchedTripInfo] = useState(null);
  const [copiedPIN, setCopiedPIN] = useState(false);

  const navigate = useNavigate();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [res, vRes, dRes] = await Promise.all([
        getBiogasRequestDetails(id, token),
        getVehicles(token).catch(() => ({ success: false })),
        getDrivers(token).catch(() => ({ success: false }))
      ]);

      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Request not found.');
      }
      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, token]);

  const handleAction = async (actionFn, successText) => {
    setActionMsg('');
    setError('');
    setActionLoading(true);
    try {
      const res = await actionFn(id, token);
      if (res.success) {
        setActionMsg(successText);
        fetchDetails();
      } else {
        setError(res.message || 'Action failed.');
      }
    } catch (err) {
      setError('Error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Dispatch Modal
  const handleOpenDispatchModal = () => {
    setDispatchData({
      vehicleId: vehicles[0]?.id || '',
      driverId: drivers[0]?.id || '',
      trackingMethod: vehicles[0]?.gps_tracking_method || 'DRIVER_MOBILE_GPS'
    });
    setError('');
    setIsDispatchModalOpen(true);
  };

  // Submit Vehicle & Driver Allocation
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchData.vehicleId || !dispatchData.driverId) {
      setError('Please select both a vehicle and an authorized driver from your fleet.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      // 1. Create Trip & Generate Pairing Key
      const tripRes = await createTrip({
        donationId: id,
        vehicleId: dispatchData.vehicleId,
        driverId: dispatchData.driverId,
        handlerType: 'BIOGAS',
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
        donationId: id
      }, token);

      if (startRes.success) {
        setIsDispatchModalOpen(false);
        setDispatchedTripInfo({
          tripId: tripRes.tripId,
          tripCode: tripRes.tripCode,
          pairingCode: tripRes.pairingCode,
          driverName: tripRes.driverName || drivers.find(d => Number(d.id) === Number(dispatchData.driverId))?.driver_name || 'Driver',
          vehicleNumber: tripRes.vehicleNumber || vehicles.find(v => Number(v.id) === Number(dispatchData.vehicleId))?.vehicle_number || 'Vehicle',
          donationId: id,
          foodName: data?.donation?.food_name
        });
        setIsDispatchSuccessModalOpen(true);
        fetchDetails();
      } else {
        setError(startRes.message || 'Could not start pickup.');
      }
    } catch (err) {
      setError('Server error initiating vehicle dispatch.');
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

  if (loading) return <div style={{ maxWidth: '780px', margin: '4rem auto', textAlign: 'center' }}>Loading request details...</div>;
  if (error || !data || !data.donation) return <div style={{ maxWidth: '780px', margin: '4rem auto', color: '#dc2626' }}>{error || 'Request not found.'}</div>;

  const { donation, match, trip, pairingCode, redirectionReason } = data;
  const status = match ? match.match_status : donation.status;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/biogas/requests" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Requests
        </Link>

        {['PICKUP_STARTED', 'GPS_LIVE', 'COLLECTED', 'COMPLETED'].includes(status) && (
          <Link to={`/tracking/${donation.id}`} className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Navigation size={16} /> Live Route Tracking
          </Link>
        )}
      </div>

      <div className="glass-card" style={{ borderTop: '4px solid #d97706', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#d97706', background: '#fffbe6', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              BIOGAS REDIRECTION REQUEST #{donation.id}
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.4rem', color: '#111827' }}>
              {donation.food_name}
            </h1>
          </div>
          <span className={`badge badge-${status ? status.toLowerCase() : 'offered'}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem' }}>
            {status}
          </span>
        </div>

        {actionMsg && (
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginTop: '1rem', border: '1px solid #bbf7d0' }}>
            ✓ {actionMsg}
          </div>
        )}

        {/* Reason for Redirection Banner */}
        <div style={{ background: '#fffbe6', border: '1px solid #fde68a', padding: '1rem', borderRadius: '10px', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={16} /> REDIRECTION RATIONALE
          </span>
          <p style={{ fontSize: '0.92rem', color: '#92400e', fontWeight: '600', marginTop: '0.2rem' }}>
            "{redirectionReason}"
          </p>
        </div>

        {/* Active Driver Pairing PIN Card */}
        {pairingCode && ['PICKUP_STARTED', 'GPS_LIVE'].includes(status) && (
          <div style={{ background: '#eff6ff', border: '2px dashed #3b82f6', borderRadius: '14px', padding: '1.25rem', marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#1e40af', fontWeight: '800', fontSize: '0.85rem' }}>
                <KeyRound size={16} /> ACTIVE DRIVER LOGIN PAIRING PIN
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: '900', letterSpacing: '6px', color: '#1d4ed8', margin: '0.2rem 0' }}>
                {pairingCode}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Provide this 6-digit code to the driver to log in at <code>/driver-login</code>
              </span>
            </div>
            <button
              onClick={() => handleCopyPIN(pairingCode)}
              className="btn-primary"
              style={{ background: copiedPIN ? '#16a34a' : '#2563eb', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              {copiedPIN ? <Check size={16} /> : <Copy size={16} />}
              {copiedPIN ? 'Copied!' : 'Copy PIN'}
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', margin: '1.25rem 0' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Food Category</span>
            <strong style={{ fontSize: '1rem', color: '#111827' }}>{donation.food_category}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Waste Quantity</span>
            <strong style={{ fontSize: '1.1rem', color: '#111827' }}>{donation.quantity} {donation.quantity_unit || 'Meals'}</strong>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Original Donor</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', color: '#111827' }}>{donation.donor_name || 'Food Donor'}</strong>
              <VerifiedDonorBadge isVerified={donation.is_donor_verified || donation.is_verified} compact={true} />
            </div>
          </div>
        </div>

        {/* Assigned Vehicle & Driver */}
        {trip && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={16} /> ASSIGNED FLEET DISPATCH
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.88rem' }}>
              <div><strong>Vehicle:</strong> {trip.vehicle_number || 'Collection Van'} ({trip.vehicle_type || 'Van'})</div>
              <div><strong>Driver:</strong> {trip.driver_name || 'Assigned Driver'}</div>
              <div><strong>Trip Code:</strong> {trip.trip_code}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={16} color="#0ea5e9" /> Pickup Location & Distance
          </span>
          <p style={{ fontSize: '0.92rem', color: '#111827', marginTop: '0.2rem' }}>
            {donation.pickup_address || donation.donor_address} ({match ? match.distance : '5.8'} km away)
          </p>
        </div>

        {/* Lifecycle Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {status === 'OFFERED' && (
            <>
              <button 
                onClick={() => handleAction(acceptBiogasRequest, 'Biogas waste request accepted!')} 
                disabled={actionLoading}
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Check size={16} /> Accept Request
              </button>
              <button 
                onClick={() => handleAction(rejectBiogasRequest, 'Biogas request rejected.')} 
                disabled={actionLoading}
                className="btn-secondary" 
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                <X size={16} /> Reject
              </button>
            </>
          )}

          {status === 'ACCEPTED' && (
            <button 
              onClick={handleOpenDispatchModal} 
              disabled={actionLoading}
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center', background: '#2563eb' }}
            >
              <Truck size={16} /> Assign Vehicle & Start Pickup
            </button>
          )}

          {status === 'PICKUP_STARTED' && (
            <button 
              onClick={() => handleAction(completeCollection, 'Food waste collected and transported.')} 
              disabled={actionLoading}
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Check size={16} /> Confirm Waste Collected
            </button>
          )}

          {status === 'COLLECTED' && (
            <button 
              onClick={() => handleAction(completeProcessing, 'Biogas anaerobic digestion processing complete!')} 
              disabled={actionLoading}
              className="btn-primary" 
              style={{ flex: 1, justifyContent: 'center', background: '#d97706', borderColor: '#b45309' }}
            >
              <Zap size={16} /> Convert to Biogas & Complete
            </button>
          )}

          {status === 'COMPLETED' && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '1rem', borderRadius: '10px', width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '800', display: 'block' }}>
                BIOGAS CONVERSION COMPLETED 🌱⚡
              </span>
              <p style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d', marginTop: '0.2rem' }}>
                Estimated Clean Biogas Produced: ~{(parseFloat(donation.quantity) * 0.45).toFixed(2)} m³
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DISPATCH ALLOCATION MODAL */}
      {isDispatchModalOpen && (
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
                  Select collection van and driver for {donation.food_name}
                </span>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {error}
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
                    ⚠️ No vehicles registered in fleet.{' '}
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

      {/* DISPATCH SUCCESS & DRIVER PAIRING PIN MODAL */}
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

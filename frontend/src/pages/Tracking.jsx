import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Navigation, Compass, CheckCircle2, Clock, ShieldCheck, 
  AlertTriangle, Truck, Handshake, Building2, ArrowLeft, Phone, Radio, Smartphone 
} from 'lucide-react';
import { io } from 'socket.io-client';
import Map from '../components/Map';
import Timer from '../components/Timer';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import { getDonationById, updateDonationStatus } from '../services/donationAPI';
import { getTripLive } from '../services/fleetAPI';
import '../styles/tracking.css';

export default function Tracking({ token, user }) {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [match, setMatch] = useState(null);
  const [liveTrip, setLiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [copiedPIN, setCopiedPIN] = useState(false);

  const storedUser = localStorage.getItem('smartsurplus_user') ? JSON.parse(localStorage.getItem('smartsurplus_user')) : null;
  const effectiveRole = String(user?.role || storedUser?.role || '').toUpperCase();
  const isNGO = effectiveRole === 'NGO' || effectiveRole === 'ADMIN';
  const isDonor = effectiveRole === 'DONOR' || effectiveRole === 'ADMIN';
  const isBiogas = effectiveRole === 'BIOGAS' || effectiveRole === 'ADMIN';
  const isAdmin = effectiveRole === 'ADMIN';

  const fetchTracking = async () => {
    try {
      const targetId = (id && id !== 'undefined' && id !== 'null') ? id : 'latest';
      const [resDonation, resTrip] = await Promise.all([
        getDonationById(targetId, token),
        getTripLive(targetId, token).catch(() => ({ success: false }))
      ]);

      if (resDonation.success && resDonation.donation) {
        setDonation(resDonation.donation);
        setMatch(resDonation.match || null);
      } else {
        setDonation(null);
        setMatch(null);
      }

      if (resTrip.success && resTrip.trip) {
        setLiveTrip(resTrip.trip);
      }
    } catch (err) {
      console.error('Error in fetchTracking:', err);
      setDonation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    // Socket.IO Real-Time Stream Listener
    const socket = io();
    const donationId = id || 'latest';

    socket.emit('join_donation_room', donationId);

    socket.on('donationAccepted', () => fetchTracking());
    socket.on('pickupStarted', () => fetchTracking());
    socket.on('donationCollected', () => fetchTracking());
    socket.on('donationDelivered', () => fetchTracking());
    socket.on('donationExpired', () => fetchTracking());
    socket.on('biogasRedirected', () => fetchTracking());
    socket.on('trip_stage_updated', () => fetchTracking());
    socket.on('driver_arrival_signal', () => fetchTracking());
    socket.on('driver_location_update', () => fetchTracking());

    // Live GPS stream directly from driver mobile or IoT device
    socket.on('gps_location_stream', (data) => {
      const activeDonId = donation?.id || id;
      const activeTripId = liveTrip?.id;
      if (
        (data.donationId && (Number(data.donationId) === Number(activeDonId) || String(data.donationId) === String(activeDonId))) ||
        (data.tripId && activeTripId && (Number(data.tripId) === Number(activeTripId) || String(data.tripId) === String(activeTripId))) ||
        (!activeTripId && data.latitude && data.longitude)
      ) {
        setLiveTrip(prev => {
          const prevTrip = prev || {};
          return {
            ...prevTrip,
            id: prevTrip.id || data.tripId,
            status: data.status || prevTrip.status || 'GPS_LIVE',
            is_gps_offline: false,
            current_location: {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              accuracy: data.accuracy,
              speed: data.speed || 0,
              heading: data.heading || 0,
              last_gps_update: new Date().toISOString()
            }
          };
        });
      }
    });

    return () => socket.disconnect();
  }, [id, token, liveTrip?.id]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError('');
        },
        (err) => {
          setLocationError('Location permission denied. Using pickup coordinates.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const handleStatusTransition = async (newStatus) => {
    setActionError('');
    setActionMsg('');
    setActionLoading(true);

    try {
      const res = await updateDonationStatus(donation.id, newStatus, token);
      if (res.success) {
        setActionMsg(`Status successfully updated to ${newStatus.replace(/_/g, ' ')}!`);
        await fetchTracking();
      } else {
        setActionError(res.message || 'Could not update status.');
      }
    } catch (err) {
      setActionError('Network error updating status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>Loading Live Pickup & Route Tracking...</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="tracking-container" style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center', padding: '1rem' }}>
        <div className="glass-card" style={{ background: 'white', padding: '3.5rem 2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Navigation size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
            No Active Donations to Track
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 1.75rem' }}>
            Once a food donation is posted and matched, you can monitor live vehicle pickup, handover, and delivery in real-time here.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to={isNGO ? '/ngo/incoming-requests' : isBiogas ? '/biogas/requests' : '/donor/create-donation'} className="btn-primary" style={{ padding: '0.65rem 1.4rem', fontWeight: '800' }}>
              {isNGO ? 'View Incoming Requests' : isBiogas ? 'View Biogas Requests' : '+ Create Food Donation'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBiogasRoute = ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(donation.status) || Boolean(match && (match.plant_name || match.biogas_plant_id));
  
  const NGO_STEPS = ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'GPS_LIVE', 'COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'DELIVERED'];
  const BIOGAS_STEPS = ['POSTED', 'EXPIRED', 'REDIRECTED_TO_BIOGAS', 'ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'COMPLETED'];
  
  const steps = isBiogasRoute ? BIOGAS_STEPS : NGO_STEPS;
  const currentStepIdx = steps.indexOf(donation.status === 'IN_TRANSIT' ? 'COLLECTED' : donation.status);

  // Determine Live Vehicle Coordinates
  const vehicleLat = liveTrip?.current_location?.latitude;
  const vehicleLng = liveTrip?.current_location?.longitude;

  return (
    <div className="tracking-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ background: 'white', borderRadius: '20px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        
        {/* BIOGAS REDIRECTION SPECIAL ALERT BANNER */}
        {isBiogasRoute && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.8rem' }}>⚡</span>
            <div>
              <strong style={{ color: '#b45309', fontSize: '0.98rem', display: 'block' }}>
                Collection Window Expired — Automatically Redirected to Clean Energy Biogas Plant
              </strong>
              <span style={{ color: '#92400e', fontSize: '0.84rem' }}>
                This surplus food has exceeded safe human consumption time and is now allocated for anaerobic digestion into clean biomethane fuel.
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isBiogasRoute ? '#b45309' : '#15803d', background: isBiogasRoute ? '#fef3c7' : '#f0fdf4', padding: '0.3rem 0.75rem', borderRadius: '999px', letterSpacing: '0.04em' }}>
              {isBiogasRoute ? '⚡ BIOGAS RECOVERY & TRANSPORT' : 'LIVE PICKUP & ROUTE TRACKING'}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', marginTop: '0.4rem', marginBottom: '0.2rem', color: '#0f172a' }}>
              {donation.food_name || donation.title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
              Quantity: <strong>{donation.quantity} {donation.quantity_unit || 'Meals'}</strong> &bull; Category: {donation.food_category}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className={`badge badge-${donation.status ? donation.status.toLowerCase() : 'posted'}`} style={{ fontSize: '0.95rem', padding: '0.45rem 0.9rem', fontWeight: '800' }}>
              {donation.status.replace(/_/g, ' ')}
            </span>
            <div style={{ marginTop: '0.5rem' }}>
              <Timer safeUntil={donation.safe_until} status={donation.status} />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* REAL VEHICLE & DRIVER INFORMATION RIBBON                  */}
        {/* ========================================================= */}
        {liveTrip && (
          <div style={{ marginTop: '1.25rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.86rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Vehicle</span>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>🚚 {liveTrip.vehicle?.vehicle_number}</strong>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{liveTrip.vehicle?.vehicle_type}</div>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Driver</span>
              <strong style={{ fontSize: '1rem', color: '#0f172a' }}>👤 {liveTrip.driver?.driver_name}</strong>
              <div style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={12} /> {liveTrip.driver?.driver_phone}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Tracking Method</span>
              <div style={{ fontWeight: '800', color: liveTrip.tracking_method === 'VEHICLE_IOT_GPS' ? '#b45309' : '#1e40af', marginTop: '0.2rem' }}>
                {liveTrip.tracking_method === 'VEHICLE_IOT_GPS' ? '⚡ Vehicle IoT Device' : '📱 Driver Mobile GPS'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>GPS Telemetry</span>
              {vehicleLat && vehicleLng ? (
                liveTrip.is_gps_offline ? (
                  <span style={{ color: '#dc2626', fontWeight: '800', display: 'inline-block', marginTop: '0.2rem' }}>
                    ⚠️ GPS Signal Lost ({liveTrip.minutes_since_update}m ago)
                  </span>
                ) : (
                  <span style={{ color: '#15803d', fontWeight: '800', display: 'inline-block', marginTop: '0.2rem' }}>
                    🟢 Live GPS Active
                  </span>
                )
              ) : (
                <span style={{ color: '#6b7280', fontStyle: 'italic', display: 'inline-block', marginTop: '0.2rem' }}>
                  Waiting for GPS location...
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6-DIGIT RANDOM DRIVER LOGIN PAIRING PIN                   */}
        {/* ========================================================= */}
        {liveTrip && (liveTrip.pairing_code || liveTrip.pairingCode) && (
          <div style={{
            marginTop: '1rem',
            background: '#eff6ff',
            border: '2px dashed #3b82f6',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1d4ed8', fontWeight: '800', fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔑 Driver 6-Digit Login Pairing Code (Random Number)
              </div>
              <p style={{ margin: '0.25rem 0 0', color: '#1e40af', fontSize: '0.86rem' }}>
                Give this PIN to driver <strong>{liveTrip.driver?.driver_name || 'Driver'}</strong>. Driver visits <Link to="/driver-login" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'underline' }}>/driver-login</Link> to start mobile GPS live location streaming.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                fontFamily: 'monospace',
                color: '#1e40af',
                background: '#ffffff',
                border: '2px solid #93c5fd',
                padding: '0.35rem 0.85rem',
                borderRadius: '10px',
                letterSpacing: '5px'
              }}>
                {liveTrip.pairing_code || liveTrip.pairingCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(liveTrip.pairing_code || liveTrip.pairingCode);
                  setCopiedPIN(true);
                  setTimeout(() => setCopiedPIN(false), 2000);
                }}
                style={{
                  background: copiedPIN ? '#15803d' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {copiedPIN ? '✓ Copied PIN' : '📋 Copy PIN'}
              </button>
            </div>
          </div>
        )}

        {/* Notices */}
        {actionMsg && (
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '0.85rem 1.25rem', borderRadius: '12px', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', border: '1px solid #bbf7d0' }}>
            <CheckCircle2 size={18} />
            <span>{actionMsg}</span>
          </div>
        )}

        {actionError && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.85rem 1.25rem', borderRadius: '12px', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', border: '1px solid #fecaca' }}>
            <AlertTriangle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE ACTION STAGES (BIOGAS & NGO SPECIFIC WORKFLOW CONTROLS)       */}
        {/* ========================================================================= */}

        {/* STAGE 0: BIOGAS REDIRECTION AWAITING ACCEPTANCE (REDIRECTED_TO_BIOGAS / EXPIRED -> ACCEPTED) */}
        {(donation.status === 'REDIRECTED_TO_BIOGAS' || donation.status === 'EXPIRED') && (
          <div style={{ marginTop: '1.5rem', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: '800', fontSize: '1rem' }}>
                ⚡ Step 1: Biogas Waste Pickup Required
              </div>
              <p style={{ margin: '0.25rem 0 0', color: '#92400e', fontSize: '0.88rem' }}>
                {isBiogas ? 'Surplus has expired for human use. Accept this listing to schedule organic waste collection for clean energy conversion.' : 'Food safety limit expired. Routed to registered biogas plant for clean energy conversion.'}
              </p>
            </div>

            {(isBiogas || isNGO || isAdmin) && (
              <button
                onClick={() => handleStatusTransition('ACCEPTED')}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: '#d97706', borderColor: '#d97706', padding: '0.75rem 1.4rem', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)' }}
              >
                ⚡ {actionLoading ? 'Updating...' : 'Accept Biogas Waste Pickup'}
              </button>
            )}
          </div>
        )}

        {/* STAGE 1: VEHICLE DISPATCH (ACCEPTED -> PICKUP_STARTED) */}
        {donation.status === 'ACCEPTED' && (
          <div style={{ marginTop: '1.5rem', background: isBiogasRoute ? '#fffbeb' : '#eff6ff', border: isBiogasRoute ? '1.5px solid #fde68a' : '1.5px solid #bfdbfe', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isBiogasRoute ? '#b45309' : '#1d4ed8', fontWeight: '800', fontSize: '1rem' }}>
                <Truck size={20} /> {isBiogasRoute ? 'Step 2: Biogas Transport Ready for Pickup' : 'Step 1: Vehicle Ready for Pickup'}
              </div>
              <p style={{ margin: '0.25rem 0 0', color: isBiogasRoute ? '#92400e' : '#3b82f6', fontSize: '0.88rem' }}>
                {isBiogasRoute 
                  ? 'Request accepted. Click below to start the trip and dispatch the transport vehicle to the donor address.'
                  : (isNGO ? 'Vehicle is ready. Click below to start the trip to the donor pickup location.' : 'NGO shelter has accepted the donation and is preparing vehicle dispatch.')
                }
              </p>
            </div>

            {(isNGO || isBiogas || isAdmin) && (
              <button
                onClick={() => handleStatusTransition('PICKUP_STARTED')}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: isBiogasRoute ? '#d97706' : '#2563eb', padding: '0.75rem 1.4rem', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: isBiogasRoute ? '0 4px 14px rgba(217, 119, 6, 0.3)' : '0 4px 14px rgba(37, 99, 235, 0.3)' }}
              >
                <Truck size={18} /> {actionLoading ? 'Updating...' : 'Start Pickup (Vehicle Dispatched)'}
              </button>
            )}
          </div>
        )}

        {/* STAGE 2: FOOD / WASTE HANDOVER CONFIRMATION (PICKUP_STARTED -> COLLECTED) */}
        {donation.status === 'PICKUP_STARTED' && (
          <div style={{ marginTop: '1.5rem', background: '#fefce8', border: '1.5px solid #fef08a', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a16207', fontWeight: '800', fontSize: '1rem' }}>
                <Handshake size={20} /> {isBiogasRoute ? 'Step 3: Food Waste Handover & Collection' : 'Step 2: Food Handover & Collection'}
              </div>
              <p style={{ margin: '0.25rem 0 0', color: '#854d0e', fontSize: '0.88rem' }}>
                {isDonor 
                  ? 'The driver has arrived at your location. Please confirm you have handed over the food packages to the driver.' 
                  : 'Transport vehicle is dispatched to the donor pickup location. Waiting for the donor to confirm handover.'
                }
              </p>
            </div>

            <div>
              {(isDonor || isAdmin) ? (
                <button
                  onClick={() => handleStatusTransition('COLLECTED')}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ background: '#ca8a04', padding: '0.75rem 1.4rem', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(202, 138, 4, 0.3)' }}
                >
                  <Handshake size={18} /> {actionLoading ? 'Updating...' : (isBiogasRoute ? 'Confirm Waste Collected' : 'Confirm Food Handed Over')}
                </button>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#a16207', background: 'rgba(202, 138, 4, 0.15)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⏳ Awaiting Donor Handover Confirmation
                </span>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: DESTINATION RECEIPT CONFIRMATION (COLLECTED / IN_TRANSIT -> DELIVERED / COMPLETED) */}
        {(donation.status === 'COLLECTED' || donation.status === 'IN_TRANSIT') && (
          <div style={{ marginTop: '1.5rem', background: isBiogasRoute ? '#fffbeb' : '#f0fdf4', border: isBiogasRoute ? '2px solid #fde68a' : '2px solid #86efac', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isBiogasRoute ? '#b45309' : '#15803d', fontWeight: '900', fontSize: '1.05rem' }}>
                <Building2 size={22} color={isBiogasRoute ? '#d97706' : '#16a34a'} /> {isBiogasRoute ? 'Step 4: Waste Reached Biogas Digester Facility' : 'Step 3: Food Reached Shelter? Enable Delivered'}
              </div>
              <p style={{ margin: '0.3rem 0 0', color: isBiogasRoute ? '#92400e' : '#166534', fontSize: '0.88rem' }}>
                {isBiogasRoute
                  ? 'Vehicle is transporting organic waste to anaerobic digestion unit. When received at plant, confirm conversion completion.'
                  : (isNGO ? 'Vehicle is transporting food to your shelter. When meals arrive, click Enable Delivered below.' : 'Food packages collected! Driver is transporting meals to shelter for distribution.')
                }
              </p>
            </div>

            {(isNGO || isBiogas || isAdmin) && (
              <button
                onClick={() => handleStatusTransition(isBiogasRoute ? 'COMPLETED' : 'DELIVERED')}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: isBiogasRoute ? '#d97706' : '#16a34a', borderColor: isBiogasRoute ? '#d97706' : '#16a34a', padding: '0.85rem 1.6rem', fontSize: '0.95rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 6px 18px rgba(0,0,0,0.15)', cursor: 'pointer' }}
              >
                <CheckCircle2 size={20} /> {actionLoading ? 'Updating...' : (isBiogasRoute ? '✅ Complete Biogas Conversion' : '✅ Enable Delivered (Food Received)')}
              </button>
            )}
          </div>
        )}

        {/* STAGE 4: COMPLETED / DELIVERED CELEBRATION */}
        {(donation.status === 'DELIVERED' || donation.status === 'COMPLETED') && (
          <div style={{ marginTop: '1.5rem', background: isBiogasRoute ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle2 size={32} color={isBiogasRoute ? '#fde68a' : '#86efac'} />
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>
                {isBiogasRoute ? 'Food Waste Converted to Clean Biogas Energy! ⚡🌱' : 'Food Successfully Delivered & Distributed! 🎉'}
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '0.2rem' }}>
                {isBiogasRoute
                  ? `Successfully converted ${donation.quantity} ${donation.quantity_unit || 'kg'} of organic waste into ~${(parseFloat(donation.quantity || 10) * 0.45).toFixed(2)} m³ clean biogas energy!`
                  : 'All pickup and delivery milestones are complete. This surplus food has been safely delivered to feed those in need.'
                }
              </div>
            </div>
          </div>
        )}

        {/* Live OpenStreetMap Leaflet Map with Real Vehicle GPS Position */}
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <Navigation size={18} color="#16a34a" /> Live Map Route Visualization
            </h3>
            <button 
              onClick={handleGetCurrentLocation} 
              className="btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white' }}
            >
              <Compass size={14} /> Use Current Location
            </button>
          </div>

          {locationError && (
            <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
              {locationError}
            </div>
          )}

          <Map 
            donorLat={userLocation ? userLocation.lat : (liveTrip?.pickup?.latitude || donation.donor_lat || donation.latitude)} 
            donorLng={userLocation ? userLocation.lng : (liveTrip?.pickup?.longitude || donation.donor_lng || donation.longitude)} 
            donorName={donation.donor_name || liveTrip?.pickup?.donor_name || 'Food Donor'}
            donorAddress={donation.pickup_address || donation.donor_address || liveTrip?.pickup?.address || ''}
            destLat={liveTrip?.destination?.latitude || (match ? (match.ngo_lat || match.latitude) : undefined)} 
            destLng={liveTrip?.destination?.longitude || (match ? (match.ngo_lng || match.longitude) : undefined)} 
            destName={liveTrip?.destination?.name || (match ? (match.organization_name || match.plant_name) : 'Destination Hub')}
            destAddress={liveTrip?.destination?.address || (match ? (match.ngo_address || match.address) : '')}
            destType={isBiogasRoute ? 'BIOGAS' : 'NGO'} 
            vehicleLat={vehicleLat}
            vehicleLng={vehicleLng}
            vehicleNumber={liveTrip?.vehicle?.vehicle_number}
            driverName={liveTrip?.driver?.driver_name}
            vehicleSpeed={liveTrip?.current_location?.speed || 0}
            vehicleHeading={liveTrip?.current_location?.heading || 0}
            height="440px" 
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.84rem', color: '#64748b', background: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '8px', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              📍 <strong>Donor:</strong> {donation.donor_name || 'Food Donor'}
              <VerifiedDonorBadge isVerified={donation.is_donor_verified || donation.is_verified} compact={true} />
              &bull; <span>Pickup: {donation.pickup_address}</span>
            </span>
            {match && (
              <span>🏢 <strong>Destination:</strong> {match.organization_name || match.plant_name || 'Shelter Destination'}</span>
            )}
          </div>
        </div>

        {/* Real-time Tracking Timeline */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', color: '#0f172a' }}>
            Collection & Delivery Tracking Timeline
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '0.5rem', textAlign: 'center', position: 'relative' }}>
            {steps.map((st, idx) => {
              const isCurrent = donation.status === st || (donation.status === 'IN_TRANSIT' && st === 'COLLECTED');
              const isPassed = currentStepIdx >= idx && currentStepIdx !== -1;
              return (
                <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: isCurrent ? '#16a34a' : isPassed ? '#bbf7d0' : '#f1f5f9',
                    color: isCurrent ? 'white' : isPassed ? '#15803d' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '0.9rem',
                    marginBottom: '0.4rem',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.25)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? '900' : isPassed ? '700' : '600', color: isCurrent ? '#16a34a' : isPassed ? '#15803d' : '#64748b', textTransform: 'capitalize' }}>
                    {st.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

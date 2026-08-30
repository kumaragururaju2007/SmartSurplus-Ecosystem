import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Navigation, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, 
  Smartphone, Truck, Building2, Utensils, RefreshCw, Power, Radio, Compass, AlertCircle,
  LogOut, Check, ArrowRight, Gauge, Bell, Handshake, CheckCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getTripLive, sendLocationUpdate, getDriverTrip, signalDriverArrival, completeTrip } from '../services/fleetAPI';
import DriverNavigationMap from '../components/DriverNavigationMap';
import '../styles/tracking.css';

export default function DriverTracking({ token }) {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [signalLoading, setSignalLoading] = useState(false);
  const [arrivalSignaled, setArrivalSignaled] = useState(null); // 'PICKUP' | 'DESTINATION' | null

  // Geolocation Streaming States
  const [isTrackingLive, setIsTrackingLive] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsPermissionState, setGpsPermissionState] = useState('PROMPT'); // 'PROMPT', 'GRANTED', 'DENIED'
  const [gpsError, setGpsError] = useState('');
  const [lastPingTime, setLastPingTime] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);
  const socketRef = useRef(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const authToken = token || localStorage.getItem('smartsurplus_token');

      if (tripId) {
        const res = await getTripLive(tripId, authToken);
        if (res.success && res.trip) {
          setTrip(res.trip);
        } else {
          setError(res.message || 'No active trip assigned.');
        }
      } else {
        const res = await getDriverTrip(authToken);
        if (res.success && res.active && res.trip) {
          setTrip(res.trip);
        } else {
          const fallbackRes = await getTripLive('latest', authToken);
          if (fallbackRes.success && fallbackRes.trip) {
            setTrip(fallbackRes.trip);
          } else {
            setError(res.message || 'No active collection trip assigned.');
          }
        }
      }
    } catch (err) {
      setError('Could not connect to trip dispatch server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();

    // Initialize Socket.IO connection to react to Donor / NGO confirmations in real time
    const socket = io();
    socketRef.current = socket;

    socket.on('tracking_updated', (data) => {
      if (trip && Number(data.donationId) === Number(trip.donation_id)) {
        fetchTripDetails();
      }
    });

    socket.on('trip_stage_updated', (data) => {
      if (trip && (Number(data.tripId) === Number(trip.id) || Number(data.donationId) === Number(trip.donation_id))) {
        fetchTripDetails();
      }
    });

    return () => {
      stopGpsTracking();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tripId, token]);

  const startGpsTracking = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      setGpsPermissionState('DENIED');
      return;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          setGpsPermissionState('GRANTED');
          setIsTrackingLive(true);
          setGpsError('');

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const speed = pos.coords.speed || 0;
          const heading = pos.coords.heading || 0;
          const timestamp = pos.timestamp || Date.now();

          // Raw GPS values stored directly
          setCurrentCoords({ lat, lng, accuracy, speed, heading, timestamp });
          setLastPingTime(new Date().toLocaleTimeString());

          // Send authentic GPS telemetry to backend & socket every 4 seconds
          const now = Date.now();
          if (now - lastSentRef.current >= 4000 && trip) {
            lastSentRef.current = now;
            try {
              const authToken = token || localStorage.getItem('smartsurplus_token');
              await sendLocationUpdate({
                tripId: trip.id,
                vehicleId: trip.vehicle?.id || trip.vehicle_id,
                driverId: trip.driver?.id || trip.driver_id,
                latitude: lat,
                longitude: lng,
                accuracy,
                speed,
                heading,
                timestamp,
                source: 'MOBILE_GPS'
              }, authToken);
            } catch (netErr) {
              console.warn('Background telemetry sync notice:', netErr);
            }
          }
        },
        (err) => {
          setIsTrackingLive(false);
          if (err.code === err.PERMISSION_DENIED) {
            setGpsPermissionState('DENIED');
            setGpsError('Location permission denied. Real device GPS is required for live vehicle tracking.');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setGpsError('GPS signal unavailable. Please ensure Location Services (GPS) are turned ON.');
          } else if (err.code === err.TIMEOUT) {
            setGpsError('GPS acquisition timed out. Seeking satellite lock...');
          } else {
            setGpsError('GPS signal error. Please check device location permissions.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 2000
        }
      );

      watchIdRef.current = id;
    } catch (e) {
      setGpsError('Could not initialize browser geolocation.');
    }
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingLive(false);
  };

  // Signal Arrival to Donor (Pickup) or NGO/Biogas (Destination)
  const handleSignalArrival = async (signalStage) => {
    if (!trip) return;
    try {
      setSignalLoading(true);
      setActionMsg('');
      const authToken = token || localStorage.getItem('smartsurplus_token');
      const res = await signalDriverArrival({ tripId: trip.id, stage: signalStage }, authToken);
      if (res.success) {
        setArrivalSignaled(signalStage === 'ARRIVED_AT_PICKUP' ? 'PICKUP' : 'DESTINATION');
        setActionMsg(res.message || 'Notification dispatched successfully.');
      } else {
        setError(res.message || 'Could not dispatch arrival notification.');
      }
    } catch (err) {
      setError('Network error sending arrival notification.');
    } finally {
      setSignalLoading(false);
    }
  };

  const handleEndTripAndLogout = async () => {
    if (trip && trip.status !== 'COMPLETED') {
      if (!window.confirm('Are you sure you want to complete this session and disconnect?')) return;
      try {
        const authToken = token || localStorage.getItem('smartsurplus_token');
        await completeTrip({ tripId: trip.id }, authToken);
      } catch (e) {
        // silent
      }
    }
    stopGpsTracking();
    localStorage.removeItem('smartsurplus_token');
    localStorage.removeItem('smartsurplus_user');
    navigate('/login');
  };

  const isBiogasTrip = trip?.handler_type === 'BIOGAS';

  // Format destination and pickup objects for the navigation map
  const destinationData = {
    lat: trip?.destination?.latitude || trip?.destination_lat || trip?.destination_hub_lat || 13.0827,
    lng: trip?.destination?.longitude || trip?.destination_lng || trip?.destination_hub_lng || 80.2707,
    name: trip?.destination?.name || trip?.destination_name || trip?.destination?.ngo_name || (isBiogasTrip ? 'Biogas Recovery Facility' : 'NGO Shelter Hub'),
    address: trip?.destination?.address || trip?.destination_address || trip?.destination_hub_address || 'Assigned destination hub',
    type: trip?.handler_type || (isBiogasTrip ? 'BIOGAS' : 'NGO')
  };

  const pickupData = (trip?.pickup?.latitude || trip?.pickup_lat || trip?.donor_lat) ? {
    lat: trip.pickup?.latitude || trip.pickup_lat || trip.donor_lat,
    lng: trip.pickup?.longitude || trip.pickup_lng || trip.donor_lng,
    name: trip.pickup?.donor_name || trip.donor_name || 'Food Donor',
    address: trip.pickup?.address || trip.pickup_address || trip.donor_address || 'Donor Pickup Point'
  } : null;

  // Determine stage flags
  const isEnRouteToPickup = ['ASSIGNED', 'PICKUP_STARTED', 'GPS_LIVE'].includes(trip?.status);
  const isEnRouteToDestination = ['COLLECTED', 'IN_TRANSIT'].includes(trip?.status);
  const isCompleted = ['DELIVERED', 'RECEIVED', 'COMPLETED'].includes(trip?.status);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', minHeight: '90vh' }}>
      
      {/* Top Header Card */}
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '1.25rem 1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isBiogasTrip ? '#d97706' : '#2563eb', background: isBiogasTrip ? '#fef3c7' : '#eff6ff', padding: '0.3rem 0.85rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📱 SMART NAVIGATION & DRIVER HUD
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isTrackingLive ? '#22c55e' : '#9ca3af',
              boxShadow: isTrackingLive ? '0 0 10px #22c55e' : 'none',
              display: 'inline-block'
            }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: isTrackingLive ? '#15803d' : '#6b7280' }}>
              {isTrackingLive ? '🟢 GPS BROADCASTING' : 'GPS STANDBY'}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <RefreshCw className="spin" size={32} color="#d97706" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Connecting to trip telemetry...</p>
          </div>
        ) : error && !trip ? (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1.5rem', borderRadius: '14px', textAlign: 'center' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>{error}</strong>
            <Link to="/driver-login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem', textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem' }}>
              Re-enter 6-Digit Pairing PIN
            </Link>
          </div>
        ) : trip ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  {trip.trip_code || `TRIP #${trip.id}`}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {trip.donation_title || trip.title || (isBiogasTrip ? 'Organic Food Waste Collection' : 'Surplus Food Rescue')}
                  {trip.quantity ? ` &bull; ${trip.quantity} ${trip.quantity_unit || 'kg'}` : ''}
                </span>
              </div>

              <span style={{ background: isCompleted ? '#dcfce7' : (isEnRouteToDestination ? '#e0e7ff' : '#fef3c7'), color: isCompleted ? '#15803d' : (isEnRouteToDestination ? '#3730a3' : '#b45309'), fontWeight: '900', fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid currentColor' }}>
                {trip.status}
              </span>
            </div>

            {/* GPS Error or Permission Alert */}
            {gpsError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.86rem', border: '1.5px solid #fca5a5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '900', marginBottom: '0.3rem' }}>
                  <AlertCircle size={18} /> Location Access Required
                </div>
                <p style={{ margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>{gpsError}</p>
                <button
                  onClick={startGpsTracking}
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Enable High-Accuracy GPS
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* GOOGLE-MAPS-LIKE NAVIGATION ENGINE & ROAD MAP CONTAINER  */}
            {/* ========================================================= */}
            <div style={{ width: '100%', minHeight: '520px', marginBottom: '1.25rem' }}>
              <DriverNavigationMap
                currentCoords={currentCoords}
                destination={destinationData}
                pickupLocation={pickupData}
                vehicleNumber={trip.vehicle?.vehicle_number || trip.vehicle_number || 'KA01AB1234'}
                driverName={trip.driver?.driver_name || trip.driver_name || 'Driver'}
                tripStatus={trip.status}
                isOnline={isOnline}
                lastPingTime={lastPingTime}
              />
            </div>

            {/* Start / Pause GPS Tracking Trigger */}
            <div style={{ marginBottom: '1rem' }}>
              {!isTrackingLive ? (
                <button
                  onClick={startGpsTracking}
                  className="btn-primary"
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', borderColor: '#15803d', fontSize: '1.05rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)', cursor: 'pointer' }}
                >
                  <Navigation size={22} />
                  <span>Start Live GPS Navigation (High Accuracy)</span>
                </button>
              ) : (
                <button
                  onClick={stopGpsTracking}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '14px', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <Power size={20} />
                  <span>Pause GPS Tracking</span>
                </button>
              )}
            </div>

            {/* ========================================================= */}
            {/* DRIVER ARRIVAL SIGNALING & VERIFICATION NOTIFICATION HUB */}
            {/* ========================================================= */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>
                <Bell size={18} color="#2563eb" />
                <span>Driver Milestone Notifications & Handover Protocol</span>
              </div>

              {/* STAGE 1: EN ROUTE TO PICKUP (SIGNAL ARRIVAL TO DONOR) */}
              {isEnRouteToPickup && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 0.85rem 0', lineHeight: '1.45' }}>
                    When you arrive at the donor's pickup point, press the button below. A live alert will be sent to the donor to inspect the vehicle and confirm food handover in their portal.
                  </p>

                  <button
                    onClick={() => handleSignalArrival('ARRIVED_AT_PICKUP')}
                    disabled={signalLoading || arrivalSignaled === 'PICKUP'}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1.25rem',
                      borderRadius: '12px',
                      background: arrivalSignaled === 'PICKUP' ? '#f0fdf4' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      color: arrivalSignaled === 'PICKUP' ? '#166534' : '#ffffff',
                      border: arrivalSignaled === 'PICKUP' ? '1.5px solid #86efac' : 'none',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      cursor: arrivalSignaled === 'PICKUP' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: arrivalSignaled === 'PICKUP' ? 'none' : '0 4px 15px rgba(234, 88, 12, 0.3)'
                    }}
                  >
                    {signalLoading ? (
                      <>
                        <RefreshCw className="spin" size={18} /> Disagreeing/Sending Notification...
                      </>
                    ) : arrivalSignaled === 'PICKUP' ? (
                      <>
                        <CheckCircle size={18} color="#16a34a" /> ⏳ Arrival Alert Sent to Donor — Awaiting Handover Confirmation
                      </>
                    ) : (
                      <>
                        <Handshake size={18} /> 📢 Signal Arrival at Pickup & Notify Donor
                      </>
                    )}
                  </button>

                  {arrivalSignaled === 'PICKUP' && (
                    <div style={{ marginTop: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#065f46', lineHeight: '1.4' }}>
                      <strong>ℹ️ Waiting for Donor:</strong> The donor has been notified via In-App Alert and SMS. Once they click <em>"Confirm Food Handed Over"</em> in their portal, navigation will automatically switch to the destination shelter.
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 2: FOOD COLLECTED & EN ROUTE TO DESTINATION (SIGNAL ARRIVAL TO NGO/FACILITY) */}
              {isEnRouteToDestination && (
                <div>
                  <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#065f46' }}>
                      Food Surplus Handover Confirmed by Donor ✓ — En route to Destination Hub
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 0.85rem 0', lineHeight: '1.45' }}>
                    When you arrive at the recipient hub ({destinationData.name}), press the button below. The staff will be notified to inspect food condition, verify IoT telemetry, and confirm delivery receipt.
                  </p>

                  <button
                    onClick={() => handleSignalArrival('ARRIVED_AT_DESTINATION')}
                    disabled={signalLoading || arrivalSignaled === 'DESTINATION'}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1.25rem',
                      borderRadius: '12px',
                      background: arrivalSignaled === 'DESTINATION' ? '#f0fdf4' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: arrivalSignaled === 'DESTINATION' ? '#166534' : '#ffffff',
                      border: arrivalSignaled === 'DESTINATION' ? '1.5px solid #86efac' : 'none',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      cursor: arrivalSignaled === 'DESTINATION' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: arrivalSignaled === 'DESTINATION' ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    {signalLoading ? (
                      <>
                        <RefreshCw className="spin" size={18} /> Sending Hub Notification...
                      </>
                    ) : arrivalSignaled === 'DESTINATION' ? (
                      <>
                        <CheckCircle size={18} color="#16a34a" /> ⏳ Arrival Alert Sent to Hub — Awaiting Staff IoT Delivery Verification
                      </>
                    ) : (
                      <>
                        <Building2 size={18} /> 📢 Signal Arrival at Hub & Notify NGO/Facility
                      </>
                    )}
                  </button>

                  {arrivalSignaled === 'DESTINATION' && (
                    <div style={{ marginTop: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1e40af', lineHeight: '1.4' }}>
                      <strong>ℹ️ Waiting for Facility Staff:</strong> Recipient has been notified to verify IoT food temperature and quality. Once they enable <em>"Food Received"</em>, the trip will be officially closed.
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 3: COMPLETED & DELIVERED */}
              {isCompleted && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>🎉</div>
                  <h3 style={{ color: '#15803d', fontWeight: '900', fontSize: '1.15rem', margin: '0 0 0.4rem 0' }}>
                    Delivery Verified & Completed!
                  </h3>
                  <p style={{ color: '#166534', fontSize: '0.86rem', margin: '0 0 1rem 0' }}>
                    The surplus food has been officially inspected, verified with IoT telemetry, and received by <strong>{destinationData.name}</strong>. Thank you for rescuing surplus food!
                  </p>
                  <button
                    onClick={handleEndTripAndLogout}
                    style={{ background: '#15803d', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <LogOut size={16} /> Complete Session & Log Out
                  </button>
                </div>
              )}
            </div>

            {actionMsg && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', textAlign: 'center', marginBottom: '1rem', border: '1px solid #a7f3d0' }}>
                {actionMsg}
              </div>
            )}

            {/* Complete & Disconnect */}
            {!isCompleted && (
              <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handleEndTripAndLogout}
                  style={{ background: 'none', border: '1.5px solid #e2e8f0', color: '#dc2626', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <LogOut size={16} /> Complete Trip & Disconnect
                </button>

                <button
                  onClick={fetchTripDetails}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <RefreshCw size={15} /> Refresh Trip
                </button>
              </div>
            )}

          </div>
        ) : null}
      </div>

    </div>
  );
}

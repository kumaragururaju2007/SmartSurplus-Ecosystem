import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, MapPin, Compass, AlertTriangle, ShieldCheck, 
  RotateCcw, Gauge, Clock, Radio, ArrowUp, CornerUpRight, CornerUpLeft, 
  ArrowUpRight, ArrowUpLeft, RefreshCw, CheckCircle2, AlertCircle, Maximize2
} from 'lucide-react';
import { 
  fetchShortestRoadRoute, 
  checkRouteDeviation, 
  calculateDistanceMeters, 
  calculateBearing,
  formatDistance,
  formatDuration,
  formatEta 
} from '../services/routingService';

// Custom Vehicle Driver Marker SVG with smooth rotational heading
const createDriverVehicleSvg = (heading = 0, speed = 0, isOnline = true) => {
  const glowColor = isOnline ? '#22c55e' : '#ef4444';
  return `
    <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.35));">
      <!-- Pulsing radar halo for live GPS -->
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${glowColor}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      
      <!-- Directional pointer circle -->
      <div style="width: 38px; height: 38px; border-radius: 50%; background: #ffffff; border: 3px solid #2563eb; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.3s ease-out; box-shadow: 0 2px 8px rgba(37,99,235,0.4);">
        <!-- Navigation Arrow -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L19 21L12 17L5 21L12 2Z" />
        </svg>
      </div>

      <!-- Small Delivery Van Badge at center -->
      <span style="position: absolute; bottom: -2px; right: -2px; background: #1e293b; color: #ffffff; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">
        🚚
      </span>
    </div>
  `;
};

// Destination Location Pin Marker
const createDestinationSvg = (type = 'NGO') => {
  const bg = type === 'BIOGAS' ? '#d97706' : '#16a34a';
  const emoji = type === 'BIOGAS' ? '⚡' : '🏠';
  return `
    <div style="position: relative; width: 38px; height: 46px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
      <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0C8.5 0 0 8.5 0 19C0 30.5 16.2 44.5 18.1 45.9C18.6 46.2 19.4 46.2 19.9 45.9C21.8 44.5 38 30.5 38 19C38 8.5 29.5 0 19 0Z" fill="${bg}"/>
        <circle cx="19" cy="18" r="10.5" fill="white"/>
      </svg>
      <span style="position: absolute; top: 7px; left: 0; right: 0; text-align: center; font-size: 13px; pointer-events: none;">
        ${emoji}
      </span>
    </div>
  `;
};

// Pickup Donor Location Pin Marker
const createPickupSvg = () => {
  return `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.6 0 17C0 27.5 14.5 40.5 16.2 41.9C16.6 42.2 17.4 42.2 17.8 41.9C19.5 40.5 34 27.5 34 17C34 7.6 26.4 0 17 0Z" fill="#ea580c"/>
        <circle cx="17" cy="16" r="9" fill="white"/>
      </svg>
      <span style="position: absolute; top: 6px; left: 0; right: 0; text-align: center; font-size: 11px; pointer-events: none;">
        🍲
      </span>
    </div>
  `;
};

// Leaflet custom Icon helper
const createCustomIcon = (html, size = [48, 48], anchor = [24, 24]) => {
  return L.divIcon({
    className: 'smartsurplus-driver-nav-icon',
    html,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1]]
  });
};

/**
 * Controller to handle smooth map centering and user drag detection
 */
function MapViewController({ targetCenter, zoom, isFollowing, onUserPan }) {
  const map = useMap();

  useMapEvents({
    dragstart() {
      if (onUserPan) onUserPan();
    },
    zoomstart(e) {
      if (e.originalEvent && onUserPan) onUserPan();
    }
  });

  useEffect(() => {
    if (isFollowing && targetCenter && targetCenter[0] && targetCenter[1]) {
      try {
        map.panTo(targetCenter, { animate: true, duration: 0.6 });
      } catch (e) {
        map.setView(targetCenter, zoom || 16);
      }
    }
  }, [targetCenter ? targetCenter[0] : null, targetCenter ? targetCenter[1] : null, isFollowing]);

  return null;
}

export default function DriverNavigationMap({
  currentCoords,        // { lat, lng, accuracy, speed, heading, timestamp }
  destination,          // { lat, lng, name, address, type: 'NGO' | 'BIOGAS' }
  pickupLocation,       // { lat, lng, name, address } (Optional)
  vehicleNumber = 'KA01AB1234',
  driverName = 'Driver',
  tripStatus = 'IN_TRANSIT',
  isOnline = true,
  lastPingTime = null,
  onRecalculateRoute = null
}) {
  // Navigation State
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [durationRemaining, setDurationRemaining] = useState(null);
  const [etaClock, setEtaClock] = useState('--:--');
  const [maneuverSteps, setManeuverSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [isFollowing, setIsFollowing] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Visual Position Smoothing (Lerp state)
  const [smoothedCoords, setSmoothedCoords] = useState(null);
  const [smoothedHeading, setSmoothedHeading] = useState(0);
  const lastRawCoordsRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastRouteFetchTimeRef = useRef(0);

  // Determine effective destination based on trip stage
  // If in PICKUP_STARTED stage and pickupLocation exists, navigate to Pickup first, otherwise navigate to Destination
  const isHeadingToPickup = tripStatus === 'PICKUP_STARTED' && pickupLocation?.lat && pickupLocation?.lng;
  const activeDestLat = isHeadingToPickup ? parseFloat(pickupLocation.lat) : parseFloat(destination?.lat || 0);
  const activeDestLng = isHeadingToPickup ? parseFloat(pickupLocation.lng) : parseFloat(destination?.lng || 0);
  const activeDestName = isHeadingToPickup ? (pickupLocation.name || 'Donor Pickup Location') : (destination?.name || 'Destination Hub');
  const activeDestAddress = isHeadingToPickup ? (pickupLocation.address || '') : (destination?.address || '');

  // 1. Fetch / Recalculate OSRM Road Route
  const calculateRoute = async (driverLat, driverLng, destLat, destLng, isForced = false) => {
    if (!driverLat || !driverLng || !destLat || !destLng) return;

    // Rate-limit automated recalculations (max once every 6 seconds unless forced)
    const now = Date.now();
    if (!isForced && now - lastRouteFetchTimeRef.current < 6000) return;
    lastRouteFetchTimeRef.current = now;

    try {
      setIsRoutingLoading(true);
      setRouteError('');

      const res = await fetchShortestRoadRoute(driverLat, driverLng, destLat, destLng);
      if (res.success && res.coordinates && res.coordinates.length > 0) {
        setRouteCoordinates(res.coordinates);
        setDistanceRemaining(res.distanceMeters);
        setDurationRemaining(res.durationSeconds);
        setEtaClock(res.etaText);
        setManeuverSteps(res.steps || []);
        setCurrentStepIdx(0);
      } else {
        setRouteError(res.message || 'Could not fetch road route.');
      }
    } catch (err) {
      setRouteError('Network error calculating road route.');
    } finally {
      setIsRoutingLoading(false);
      setIsRecalculating(false);
    }
  };

  // 2. Initial Route Calculation when destination or driver GPS is first available
  useEffect(() => {
    if (currentCoords?.lat && currentCoords?.lng && activeDestLat && activeDestLng) {
      calculateRoute(currentCoords.lat, currentCoords.lng, activeDestLat, activeDestLng, true);
    }
  }, [activeDestLat, activeDestLng, isHeadingToPickup]);

  // 3. Smooth Visual Marker Interpolation (Lerp) & Route Deviation Monitoring
  useEffect(() => {
    if (!currentCoords || !currentCoords.lat || !currentCoords.lng) return;

    const rawLat = parseFloat(currentCoords.lat);
    const rawLng = parseFloat(currentCoords.lng);

    // Compute heading from consecutive GPS updates if device hardware doesn't provide it
    if (lastRawCoordsRef.current) {
      const prevLat = lastRawCoordsRef.current.lat;
      const prevLng = lastRawCoordsRef.current.lng;
      const movedDist = calculateDistanceMeters(prevLat, prevLng, rawLat, rawLng);

      if (movedDist > 2) {
        const computedBearing = calculateBearing(prevLat, prevLng, rawLat, rawLng);
        const deviceHeading = (currentCoords.heading !== null && currentCoords.heading !== undefined && currentCoords.heading >= 0)
          ? currentCoords.heading
          : computedBearing;
        setSmoothedHeading(deviceHeading);
      }
    } else {
      if (currentCoords.heading) setSmoothedHeading(currentCoords.heading);
    }

    lastRawCoordsRef.current = { lat: rawLat, lng: rawLng };

    // Initialize smoothed coords if not set yet
    if (!smoothedCoords) {
      setSmoothedCoords([rawLat, rawLng]);
    } else {
      // Smooth visual marker position with subtle interpolation
      let startLat = smoothedCoords[0];
      let startLng = smoothedCoords[1];
      let startTime = performance.now();
      const duration = 600; // ms

      const animateMarker = (nowTime) => {
        const elapsed = nowTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic formula
        const ease = 1 - Math.pow(1 - progress, 3);

        const currentLat = startLat + (rawLat - startLat) * ease;
        const currentLng = startLng + (rawLng - startLng) * ease;
        setSmoothedCoords([currentLat, currentLng]);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateMarker);
        }
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animateMarker);
    }

    // 4. Check for Route Deviation (> 65 meters from road polyline)
    if (routeCoordinates && routeCoordinates.length >= 2 && activeDestLat && activeDestLng) {
      const dev = checkRouteDeviation(rawLat, rawLng, routeCoordinates, 65);
      if (dev.isDeviated && !isRecalculating) {
        setIsRecalculating(true);
        calculateRoute(rawLat, rawLng, activeDestLat, activeDestLng, false);
      } else {
        // Update distance remaining continuously based on driver progress
        const distToEnd = calculateDistanceMeters(rawLat, rawLng, activeDestLat, activeDestLng);
        setDistanceRemaining(distToEnd);
        const estSec = Math.round(distToEnd / 8.5); // Approx speed
        setDurationRemaining(estSec);
        setEtaClock(formatEta(estSec));
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentCoords?.lat, currentCoords?.lng, currentCoords?.accuracy, currentCoords?.heading]);

  // Recenter handler
  const handleRecenter = () => {
    setIsFollowing(true);
  };

  // Determine GPS Accuracy status
  const accuracy = currentCoords?.accuracy || null;
  const isGpsAvailable = Boolean(currentCoords?.lat && currentCoords?.lng);
  const accuracyTier = !isGpsAvailable ? 'NONE' : (accuracy <= 15 ? 'EXCELLENT' : (accuracy <= 50 ? 'MODERATE' : 'POOR'));

  const accuracyBadgeInfo = {
    EXCELLENT: { text: `GPS Accuracy: ±${Math.round(accuracy)} m`, color: '#15803d', bg: '#dcfce7', icon: '🟢' },
    MODERATE: { text: `GPS Accuracy: ±${Math.round(accuracy)} m`, color: '#b45309', bg: '#fef3c7', icon: '🟡' },
    POOR: { text: `Low GPS Accuracy: ±${Math.round(accuracy)} m`, color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
    NONE: { text: 'GPS Unavailable', color: '#991b1b', bg: '#fee2e2', icon: '⚠️' }
  }[accuracyTier];

  // Current Turn Maneuver Info
  const activeStep = maneuverSteps[currentStepIdx] || {
    instruction: isHeadingToPickup ? `Head towards Donor (${activeDestName})` : `Head towards ${activeDestName}`,
    modifier: 'straight',
    distanceText: formatDistance(distanceRemaining)
  };

  const getManeuverIcon = (modifier) => {
    switch (modifier) {
      case 'left':
      case 'sharp left':
        return <CornerUpLeft size={28} color="#ffffff" />;
      case 'right':
      case 'sharp right':
        return <CornerUpRight size={28} color="#ffffff" />;
      case 'slight left':
        return <ArrowUpLeft size={28} color="#ffffff" />;
      case 'slight right':
        return <ArrowUpRight size={28} color="#ffffff" />;
      default:
        return <ArrowUp size={28} color="#ffffff" />;
    }
  };

  // Active Map Center
  const mapCenter = smoothedCoords || [activeDestLat || 13.0827, activeDestLng || 80.2707];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '540px', borderRadius: '24px', overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}>
      
      {/* 1. TOP FLOATING NAVIGATION INSTRUCTION BANNER (GOOGLE MAPS STYLE) */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        right: '14px',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '0.85rem 1.15rem',
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.45rem', borderRadius: '12px', flexShrink: 0 }}>
            {getManeuverIcon(activeStep.modifier)}
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
              {isHeadingToPickup ? '📍 STAGE: PICKUP SURPLUS' : '🏁 STAGE: DELIVER TO DESTINATION'}
            </span>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activeStep.instruction}
            </div>
          </div>
        </div>

        {/* Recalculating indicator */}
        {isRecalculating && (
          <div style={{ background: '#f59e0b', color: '#78350f', padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <RefreshCw size={12} className="spin" /> Recalculating...
          </div>
        )}
      </div>

      {/* 2. LEAFLET INTERACTIVE MAP CONTAINER */}
      <MapContainer
        center={mapCenter}
        zoom={16}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '540px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController
          targetCenter={smoothedCoords}
          zoom={16}
          isFollowing={isFollowing}
          onUserPan={() => setIsFollowing(false)}
        />

        {/* OSRM Road Polyline Outer Shadow / Casing */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: '#1e3a8a', weight: 8, opacity: 0.4 }}
          />
        )}

        {/* OSRM Road Polyline Core (Bright Blue Road Line) */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95 }}
          />
        )}

        {/* GPS Accuracy Circle around Driver */}
        {smoothedCoords && accuracy && accuracy > 0 && (
          <Circle
            center={smoothedCoords}
            radius={accuracy}
            pathOptions={{
              color: accuracyTier === 'EXCELLENT' ? '#16a34a' : (accuracyTier === 'MODERATE' ? '#eab308' : '#ef4444'),
              fillColor: accuracyTier === 'EXCELLENT' ? '#22c55e' : (accuracyTier === 'MODERATE' ? '#facc15' : '#f87171'),
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '3, 4'
            }}
          />
        )}

        {/* Driver Vehicle Live Marker */}
        {smoothedCoords && (
          <Marker
            position={smoothedCoords}
            icon={createCustomIcon(createDriverVehicleSvg(smoothedHeading, currentCoords?.speed || 0, isOnline), [48, 48], [24, 24])}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e40af' }}>🚚 {vehicleNumber}</strong><br />
                <strong>Driver:</strong> {driverName}<br />
                <strong>Speed:</strong> {Math.round((currentCoords?.speed || 0) * 3.6)} km/h<br />
                <strong>GPS Accuracy:</strong> ±{Math.round(accuracy || 0)} m
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Facility Marker */}
        {destination?.lat && destination?.lng && (
          <Marker
            position={[parseFloat(destination.lat), parseFloat(destination.lng)]}
            icon={createCustomIcon(createDestinationSvg(destination.type), [38, 46], [19, 46])}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: '0.85rem' }}>
                <strong style={{ color: destination.type === 'BIOGAS' ? '#d97706' : '#16a34a' }}>
                  {destination.type === 'BIOGAS' ? '⚡ Biogas Facility' : '🏠 NGO Shelter'}
                </strong><br />
                <strong>Name:</strong> {destination.name}<br />
                <strong>Address:</strong> {destination.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Location Marker (if applicable) */}
        {pickupLocation?.lat && pickupLocation?.lng && (
          <Marker
            position={[parseFloat(pickupLocation.lat), parseFloat(pickupLocation.lng)]}
            icon={createCustomIcon(createPickupSvg(), [34, 42], [17, 42])}
          >
            <Popup>
              <div style={{ padding: '4px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#ea580c' }}>🍲 Donor Pickup Point</strong><br />
                <strong>Donor:</strong> {pickupLocation.name}<br />
                <strong>Address:</strong> {pickupLocation.address}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 3. FLOATING RECENTER BUTTON (APPEARS WHEN MAP IS UNCENTERED) */}
      {!isFollowing && isGpsAvailable && (
        <button
          onClick={handleRecenter}
          type="button"
          style={{
            position: 'absolute',
            bottom: '210px',
            right: '16px',
            zIndex: 1000,
            background: '#ffffff',
            color: '#1d4ed8',
            border: '2px solid #93c5fd',
            borderRadius: '999px',
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'transform 0.2s'
          }}
        >
          <Compass size={18} />
          <span>Recenter Vehicle</span>
        </button>
      )}

      {/* 4. OFFLINE / GPS ERROR NOTICE */}
      {!isOnline && (
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '14px',
          right: '14px',
          zIndex: 1000,
          background: '#fee2e2',
          border: '1.5px solid #fca5a5',
          color: '#991b1b',
          borderRadius: '12px',
          padding: '0.5rem 1rem',
          fontSize: '0.82rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          <span>Connection Lost • Displaying last known location {lastPingTime ? `(${lastPingTime})` : ''}</span>
        </div>
      )}

      {/* 5. BOTTOM DRIVER NAVIGATION HUD PANEL */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: '2px solid #e2e8f0',
        padding: '1.25rem 1.4rem',
        boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
      }}>
        
        {/* Row 1: Distance Remaining & ETA Big Display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.9rem', fontWeight: '900', color: '#1e40af' }}>
                {formatDistance(distanceRemaining)}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#15803d' }}>
                {formatDuration(durationRemaining)}
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
              Estimated Arrival: <strong>{etaClock}</strong> &bull; Recommended Shortest Road Route
            </span>
          </div>

          {/* Speedometer Badge */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.4rem 0.85rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>SPEED</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Gauge size={16} color="#2563eb" />
              <span>{Math.round((currentCoords?.speed || 0) * 3.6)}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>km/h</span>
            </div>
          </div>
        </div>

        {/* Row 2: Destination & Vehicle Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.83rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>
              {isHeadingToPickup ? 'PICKUP DONOR' : 'DESTINATION HUB'}
            </span>
            <strong style={{ color: '#0f172a' }}>📍 {activeDestName}</strong>
            <div style={{ color: '#475569', fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activeDestAddress || 'Assigned location coordinates'}
            </div>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: '700' }}>ASSIGNED VEHICLE & DRIVER</span>
            <strong style={{ color: '#0f172a' }}>🚚 {vehicleNumber}</strong> &bull; <span style={{ color: '#334155' }}>👤 {driverName}</span>
          </div>
        </div>

        {/* Row 3: Live GPS Accuracy Status Badge & OpenStreetMap Attribution */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{
            background: accuracyBadgeInfo.bg,
            color: accuracyBadgeInfo.color,
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontWeight: '800',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <span>{accuracyBadgeInfo.icon}</span>
            <span>{accuracyBadgeInfo.text}</span>
          </span>

          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            &copy; OpenStreetMap contributors &bull; OSRM Road Engine
          </span>
        </div>

      </div>

    </div>
  );
}

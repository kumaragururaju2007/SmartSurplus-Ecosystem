import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import { fetchShortestRoadRoute, formatDistance, formatDuration, formatEta } from '../services/routingService';

// SVG Location Pin Marker Symbol Helper (36px x 44px)
const createPinSvg = (bg = '#16a34a', emoji = '📍', label = '') => {
  return `
    <div class="custom-marker-pin" style="position: relative; width: 38px; height: 46px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); transition: transform 0.2s ease;">
      <svg width="38" height="46" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0C8.5 0 0 8.5 0 19C0 30.5 16.2 44.5 18.1 45.9C18.6 46.2 19.4 46.2 19.9 45.9C21.8 44.5 38 30.5 38 19C38 8.5 29.5 0 19 0Z" fill="${bg}"/>
        <circle cx="19" cy="18" r="10.5" fill="white"/>
      </svg>
      <span style="position: absolute; top: 7px; left: 0; right: 0; text-align: center; font-size: 13px; line-height: 1; pointer-events: none;">
        ${emoji}
      </span>
    </div>
  `;
};

// Live Vehicle Directional Marker SVG with rotational arrow & radar halo
const createVehicleSvg = (heading = 0, speed = 0, isLive = true) => {
  return `
    <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
      <!-- Pulsing radar halo for live GPS -->
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: #22c55e; opacity: 0.3; animation: mapPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      
      <!-- Directional pointer circle -->
      <div style="width: 38px; height: 38px; border-radius: 50%; background: #ffffff; border: 3.5px solid #2563eb; display: flex; align-items: center; justify-content: center; transform: rotate(${heading || 0}deg); transition: transform 0.4s ease-out; box-shadow: 0 2px 10px rgba(37,99,235,0.45);">
        <!-- Navigation Arrow -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L19 21L12 17L5 21L12 2Z" />
        </svg>
      </div>

      <!-- Small Delivery Van Badge at bottom right -->
      <span style="position: absolute; bottom: -2px; right: -2px; background: #0f172a; color: #ffffff; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">
        🚚
      </span>
    </div>
  `;
};

const createMarkerIcon = (type = 'DONOR', bg = '#16a34a', emoji = '📍') => {
  return L.divIcon({
    className: 'smartsurplus-map-pin',
    html: createPinSvg(bg, emoji),
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -42]
  });
};

const createVehicleIcon = (heading = 0, speed = 0) => {
  return L.divIcon({
    className: 'smartsurplus-vehicle-icon',
    html: createVehicleSvg(heading, speed),
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26]
  });
};

// Distinctive Location Pin Markers
const donorIcon = createMarkerIcon('DONOR', '#16a34a', '🍲');
const ngoIcon = createMarkerIcon('NGO', '#0284c7', '🏠');
const biogasIcon = createMarkerIcon('BIOGAS', '#d97706', '⚡');
const donationIcon = createMarkerIcon('DONATION', '#15803d', '📦');
const selectedIcon = createMarkerIcon('SELECTED', '#dc2626', '📍');

// Coordinate Validation Function
export function isValidCoord(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90 &&
         !isNaN(longitude) && longitude >= -180 && longitude <= 180;
}

// Map Click Handler Component for Interactive Mode
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        onLocationSelect({ lat, lng });
      }
    }
  });
  return null;
}

// Map Bounds Auto-Fit Controller (Ensures both Donor and Matched NGO/Biogas + Driver are fully visible)
function MapBoundsFitter({ points, isFollowingVehicle, vehiclePos }) {
  const map = useMap();
  useEffect(() => {
    if (isFollowingVehicle && vehiclePos && isValidCoord(vehiclePos[0], vehiclePos[1])) {
      try {
        map.panTo(vehiclePos, { animate: true, duration: 0.6 });
      } catch (e) {}
      return;
    }

    const validPoints = (points || []).filter(p => p && isValidCoord(p[0], p[1]));
    if (validPoints.length >= 2) {
      try {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      } catch (e) {}
    } else if (validPoints.length === 1) {
      try {
        map.setView(validPoints[0], 14);
      } catch (e) {}
    }
  }, [JSON.stringify(points), isFollowingVehicle, vehiclePos ? vehiclePos[0] : null, vehiclePos ? vehiclePos[1] : null]);
  return null;
}

export default function Map({
  latitude,
  longitude,
  center,
  donorLat,
  donorLng,
  donorName = 'Food Donor',
  donorAddress = '',
  destLat,
  destLng,
  destName = 'Destination Hub',
  destAddress = '',
  destType = 'NGO',
  vehicleLat,
  vehicleLng,
  vehicleNumber,
  driverName,
  vehicleSpeed = 0,
  vehicleHeading = 0,
  markers = [],
  zoom = 13,
  height = '420px',
  interactive = false,
  onLocationSelect
}) {
  const isInteractive = interactive || Boolean(onLocationSelect);

  // Default Neutral Map Viewport
  const defaultLat = 11.4925;
  const defaultLng = 77.2808;
  const defaultOverviewZoom = 13;

  // Determine explicit coordinates
  const hasExplicitSelectedCoords = isValidCoord(latitude, longitude);
  const hasExplicitCenterCoords = center && isValidCoord(center[0], center[1]);
  const hasExplicitDonorCoords = isValidCoord(donorLat, donorLng);
  const hasExplicitDestCoords = isValidCoord(destLat, destLng);
  const hasExplicitVehicleCoords = isValidCoord(vehicleLat, vehicleLng);
  const hasExplicitMarkerCoords = markers && markers.length > 0 && isValidCoord(markers[0]?.lat, markers[0]?.lng);

  const destPos = hasExplicitDestCoords ? [parseFloat(destLat), parseFloat(destLng)] : null;
  const donorPos = hasExplicitDonorCoords ? [parseFloat(donorLat), parseFloat(donorLng)] : null;
  const vehiclePos = hasExplicitVehicleCoords ? [parseFloat(vehicleLat), parseFloat(vehicleLng)] : null;

  // Compute map center position
  let centerLat = defaultLat;
  let centerLng = defaultLng;

  if (hasExplicitVehicleCoords) {
    centerLat = parseFloat(vehicleLat);
    centerLng = parseFloat(vehicleLng);
  } else if (hasExplicitDonorCoords && hasExplicitDestCoords) {
    centerLat = (parseFloat(donorLat) + parseFloat(destLat)) / 2;
    centerLng = (parseFloat(donorLng) + parseFloat(destLng)) / 2;
  } else if (hasExplicitDonorCoords) {
    centerLat = parseFloat(donorLat);
    centerLng = parseFloat(donorLng);
  } else if (hasExplicitDestCoords) {
    centerLat = parseFloat(destLat);
    centerLng = parseFloat(destLng);
  } else if (hasExplicitSelectedCoords) {
    centerLat = parseFloat(latitude);
    centerLng = parseFloat(longitude);
  }

  const centerPos = [centerLat, centerLng];

  // Route calculation for Tracking / Journey pages
  const [roadRouteCoords, setRoadRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distanceText: '', durationText: '', etaText: '' });
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRoadRoute() {
      // Shortest road route between Donor origin and Destination
      const startLat = donorPos ? donorPos[0] : (vehiclePos ? vehiclePos[0] : null);
      const startLng = donorPos ? donorPos[1] : (vehiclePos ? vehiclePos[1] : null);
      const endLat = destPos ? destPos[0] : null;
      const endLng = destPos ? destPos[1] : null;

      if (startLat && startLng && endLat && endLng) {
        try {
          setIsRoutingLoading(true);
          const res = await fetchShortestRoadRoute(startLat, startLng, endLat, endLng);
          if (res.success && res.coordinates && res.coordinates.length > 0 && isMounted) {
            setRoadRouteCoords(res.coordinates);
            setRouteInfo({
              distanceText: res.distanceText,
              durationText: res.durationText,
              etaText: res.etaText
            });
          }
        } catch (e) {
          if (isMounted) {
            setRoadRouteCoords([[startLat, startLng], [endLat, endLng]]);
          }
        } finally {
          if (isMounted) setIsRoutingLoading(false);
        }
      }
    }
    loadRoadRoute();
    return () => { isMounted = false; };
  }, [donorLat, donorLng, destLat, destLng]);

  // Points to fit in viewport bounds
  const fitPoints = [];
  if (donorPos) fitPoints.push(donorPos);
  if (destPos) fitPoints.push(destPos);
  if (vehiclePos) fitPoints.push(vehiclePos);

  const fallbackPolyline = [];
  if (donorPos) fallbackPolyline.push(donorPos);
  if (destPos) fallbackPolyline.push(destPos);

  const vehicleIconElement = hasExplicitVehicleCoords 
    ? createVehicleIcon(vehicleHeading, vehicleSpeed) 
    : null;

  return (
    <div className="map-container-wrapper" style={{ height, position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      
      {/* Real-time Shortest Distance Route HUD Ribbon */}
      {(hasExplicitDonorCoords && hasExplicitDestCoords) && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '1.5px solid #bfdbfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.84rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: hasExplicitVehicleCoords ? '#22c55e' : '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.2)' }} />
            <strong style={{ color: '#1e3a8a', fontSize: '0.88rem' }}>
              {hasExplicitVehicleCoords ? '📡 Live GPS Vehicle Tracking' : '🛣️ Shortest Pickup-to-Hub Route'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', color: '#1e293b' }}>
            {routeInfo.distanceText && (
              <span><strong>Shortest Distance:</strong> <span style={{ color: '#2563eb', fontWeight: '800' }}>{routeInfo.distanceText}</span></span>
            )}
            {routeInfo.etaText && routeInfo.etaText !== '--:--' && (
              <span><strong>ETA:</strong> <span style={{ color: '#16a34a', fontWeight: '800' }}>{routeInfo.etaText}</span></span>
            )}
            {hasExplicitVehicleCoords && vehicleNumber && (
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem' }}>
                🚚 {vehicleNumber} {driverName ? `(${driverName})` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      <MapContainer 
        center={centerPos} 
        zoom={zoom || defaultOverviewZoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-Fit Viewport to show both Donor and Destination (+ Driver) */}
        <MapBoundsFitter points={fitPoints} isFollowingVehicle={false} vehiclePos={vehiclePos} />

        {isInteractive && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* 1. Selected / Pinpointed Location Marker */}
        {hasExplicitSelectedCoords && (
          <Marker position={[parseFloat(latitude), parseFloat(longitude)]} icon={selectedIcon}>
            <Popup>
              <div style={{ padding: '2px' }}>
                <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                  📍 Pinpointed Facility Location
                </div>
                <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: '1.4' }}>
                  <strong>Latitude:</strong> {parseFloat(latitude)}<br />
                  <strong>Longitude:</strong> {parseFloat(longitude)}<br />
                  {isInteractive && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px', display: 'block', fontWeight: '700' }}>
                      💡 Click anywhere on map to move pin
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Specific Donor Origin Pin (Green with soup bowl icon) */}
        {hasExplicitDonorCoords && (
          <Marker position={donorPos} icon={donorIcon}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <div style={{ fontWeight: '900', color: '#15803d', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🟢 Donor Pickup Location
                </div>
                <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.45' }}>
                  <strong>Donor:</strong> {donorName}<br />
                  {donorAddress && <><strong>Address:</strong> {donorAddress}<br /></>}
                  <strong>Coordinates:</strong> {donorPos[0].toFixed(5)}, {donorPos[1].toFixed(5)}<br />
                  <span style={{ display: 'inline-block', marginTop: '4px', background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                    🍲 Surplus Food Origin
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. Specific Destination Hub Pin (Blue for NGO / Orange for Biogas) */}
        {hasExplicitDestCoords && (
          <Marker position={destPos} icon={destType === 'BIOGAS' ? biogasIcon : ngoIcon}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <div style={{ fontWeight: '900', color: destType === 'BIOGAS' ? '#d97706' : '#0284c7', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {destType === 'BIOGAS' ? '🟠 Biogas Clean Energy Facility' : '🔵 Matched NGO Shelter Hub'}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.45' }}>
                  <strong>Destination:</strong> {destName}<br />
                  {destAddress && <><strong>Address:</strong> {destAddress}<br /></>}
                  <strong>Coordinates:</strong> {destPos[0].toFixed(5)}, {destPos[1].toFixed(5)}<br />
                  <span style={{ display: 'inline-block', marginTop: '4px', background: destType === 'BIOGAS' ? '#fef3c7' : '#dbeafe', color: destType === 'BIOGAS' ? '#b45309' : '#1d4ed8', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>
                    {destType === 'BIOGAS' ? '⚡ Organic Digester Destination' : '🏢 Verified Distribution Hub'}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 4. Live Transport Vehicle Marker (Rotating direction pointer + pulsing halo) */}
        {hasExplicitVehicleCoords && (
          <Marker position={vehiclePos} icon={vehicleIconElement}>
            <Popup>
              <div style={{ padding: '4px' }}>
                <div style={{ fontWeight: '900', color: '#1d4ed8', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🚚 Live Fleet Vehicle
                </div>
                <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: '1.45' }}>
                  <strong>Vehicle Number:</strong> {vehicleNumber || 'Food Transport Van'}<br />
                  {driverName && <><strong>Driver:</strong> {driverName}<br /></>}
                  {vehicleSpeed > 0 && <><strong>Speed:</strong> {Math.round(vehicleSpeed)} km/h<br /></>}
                  <strong>Live GPS:</strong> {vehiclePos[0].toFixed(5)}, {vehiclePos[1].toFixed(5)}<br />
                  <span style={{ display: 'inline-block', marginTop: '4px', background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '900' }}>
                    📡 LIVE GPS STREAM CONNECTED
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 5. Additional Marker Array */}
        {markers && markers.map((m, idx) => {
          if (!isValidCoord(m.lat, m.lng)) return null;
          const isBiogas = m.type === 'BIOGAS';
          const isNGO = m.type === 'NGO';
          const isDonation = m.type === 'DONATION';
          const isVehicle = m.type === 'VEHICLE';
          const icon = isVehicle ? (vehicleIconElement || vehicleIcon) : (isBiogas ? biogasIcon : (isNGO ? ngoIcon : (isDonation ? donationIcon : donorIcon)));

          return (
            <Marker key={`${m.type}-${m.lat}-${m.lng}-${idx}`} position={[parseFloat(m.lat), parseFloat(m.lng)]} icon={icon}>
              <Popup>
                <div style={{ padding: '2px' }}>
                  <div style={{ fontWeight: '800', color: isVehicle ? '#1d4ed8' : (isBiogas ? '#d97706' : (isNGO ? '#0284c7' : '#16a34a')), fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                    {isVehicle ? '🚚 Active Fleet Vehicle' : (isBiogas ? '🟠 Biogas Plant' : (isNGO ? '🔵 NGO Shelter' : (isDonation ? '📦 Surplus Donation' : '🟢 Donor Organization')))}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: '1.4' }}>
                    <strong>Name:</strong> {m.name || m.title || (isVehicle ? 'Transport Vehicle' : (isBiogas ? 'Biogas Facility' : (isNGO ? 'NGO Shelter' : 'Food Donor')))}<br />
                    Lat: {m.lat}, Lng: {m.lng}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 6. Shortest Road Route Polyline FILLED WITH BLUE COLOR */}
        {roadRouteCoords && roadRouteCoords.length > 1 ? (
          <>
            {/* Outer Blue Glow */}
            <Polyline
              positions={roadRouteCoords}
              pathOptions={{ color: '#3b82f6', weight: 8, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }}
            />
            {/* Inner Solid Vibrant Blue Road Line */}
            <Polyline
              positions={roadRouteCoords}
              pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
            />
          </>
        ) : fallbackPolyline.length >= 2 ? (
          <>
            <Polyline 
              positions={fallbackPolyline} 
              pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.35 }} 
            />
            <Polyline 
              positions={fallbackPolyline} 
              pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.95 }} 
            />
          </>
        ) : null}

      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="map-legend-overlay">
        <span className="legend-item"><span className="legend-dot green"></span> Donor Origin</span>
        <span className="legend-item"><span className="legend-dot blue"></span> NGO / Biogas Hub</span>
        {hasExplicitVehicleCoords && (
          <span className="legend-item"><span className="legend-dot blue" style={{ background: '#2563eb' }}></span> Live Vehicle</span>
        )}
      </div>

    </div>
  );
}

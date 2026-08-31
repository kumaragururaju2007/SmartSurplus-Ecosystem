import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Navigation, Compass, RefreshCw, ArrowLeft, Search, 
  Building2, Utensils, Zap, Truck, ShieldCheck, Phone, Filter,
  Layers, ChevronRight, X, ExternalLink, Sparkles, LocateFixed, Eye
} from 'lucide-react';
import { io } from 'socket.io-client';
import Map from '../components/Map';
import VerifiedDonorBadge from '../components/VerifiedDonorBadge';
import { detectCurrentLocation } from '../services/locationService';
import '../styles/map.css';
import '../styles/tracking.css';

export default function FullscreenTrackingMap({ user }) {
  const navigate = useNavigate();
  const [markersData, setMarkersData] = useState({
    donors: [],
    ngos: [],
    biogasPlants: [],
    activeDonations: [],
    liveVehicles: []
  });
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Default Chennai Center
  const [mapZoom, setMapZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchMarkers = async () => {
    try {
      const res = await fetch('/api/donations/map/markers');
      const data = await res.json();
      if (data.success && data.markers) {
        setMarkersData({
          donors: data.markers.donors || [],
          ngos: data.markers.ngos || [],
          biogasPlants: data.markers.biogasPlants || [],
          activeDonations: data.markers.activeDonations || [],
          liveVehicles: data.markers.liveVehicles || []
        });
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Error fetching ecosystem map markers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
    const interval = setInterval(fetchMarkers, 20000);

    // Real-time socket stream
    const socket = io();
    socket.on('donationCreated', () => fetchMarkers());
    socket.on('donationAccepted', () => fetchMarkers());
    socket.on('pickupStarted', () => fetchMarkers());
    socket.on('donationCollected', () => fetchMarkers());
    socket.on('donationDelivered', () => fetchMarkers());
    socket.on('biogasRedirected', () => fetchMarkers());
    socket.on('gps_location_stream', () => fetchMarkers());

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Format flattened list of all map markers
  const allMarkersList = useMemo(() => {
    const list = [];

    // Donors
    markersData.donors.forEach(d => {
      if (d.hasValidLocation && d.lat && d.lng) {
        list.push({
          id: `donor-${d.id}`,
          originalId: d.id,
          lat: d.lat,
          lng: d.lng,
          type: 'DONOR',
          title: d.name || 'Food Donor',
          subtitle: d.business_type || 'Restaurant / Catering',
          address: d.address || 'Chennai',
          city: d.city || 'Chennai',
          isVerified: d.is_verified,
          details: {
            businessType: d.business_type,
            verified: d.is_verified
          }
        });
      }
    });

    // NGOs
    markersData.ngos.forEach(n => {
      if (n.hasValidLocation && n.lat && n.lng) {
        list.push({
          id: `ngo-${n.id}`,
          originalId: n.id,
          lat: n.lat,
          lng: n.lng,
          type: 'NGO',
          title: n.name || 'NGO Food Shelter',
          subtitle: n.ngo_type || 'Charitable Organization',
          address: n.address || 'Chennai',
          city: n.city || 'Chennai',
          isVerified: n.is_verified,
          details: {
            capacity: n.food_capacity ? `${n.food_capacity} Meals/day` : 'Standard Shelter Capacity',
            ngoType: n.ngo_type,
            verified: n.is_verified
          }
        });
      }
    });

    // Biogas Plants
    markersData.biogasPlants.forEach(b => {
      if (b.hasValidLocation && b.lat && b.lng) {
        list.push({
          id: `biogas-${b.id}`,
          originalId: b.id,
          lat: b.lat,
          lng: b.lng,
          type: 'BIOGAS',
          title: b.name || 'Clean Biogas Facility',
          subtitle: b.plant_type || 'Anaerobic Digester Plant',
          address: b.address || 'Chennai Area',
          city: b.city || 'Chennai',
          isVerified: b.is_verified,
          details: {
            capacity: b.processing_capacity ? `${b.processing_capacity} kg/day` : 'Industrial Energy Capacity',
            plantType: b.plant_type,
            verified: b.is_verified
          }
        });
      }
    });

    // Active Surplus
    markersData.activeDonations.forEach(don => {
      if (don.hasValidLocation && don.lat && don.lng) {
        list.push({
          id: `donation-${don.id}`,
          originalId: don.id,
          lat: don.lat,
          lng: don.lng,
          type: 'DONATION',
          title: `📦 ${don.food_name || 'Surplus Food'}`,
          subtitle: `${don.quantity} ${don.quantity_unit || 'Meals'} • ${don.food_category || 'Cooked Food'}`,
          address: don.pickup_address || 'Pickup Point',
          status: don.status,
          details: {
            quantity: `${don.quantity} ${don.quantity_unit || 'Meals'}`,
            category: don.food_category,
            status: don.status,
            donationId: don.id
          }
        });
      }
    });

    // Live Vehicles
    markersData.liveVehicles.forEach(v => {
      if (v.hasValidLocation && v.lat && v.lng) {
        list.push({
          id: `veh-${v.trip_id || v.id}`,
          originalId: v.trip_id || v.id,
          lat: v.lat,
          lng: v.lng,
          type: 'VEHICLE',
          title: `🚚 ${v.vehicle_number || 'Transport Van'}`,
          subtitle: `Driver: ${v.driver_name || 'On Duty'} (${v.trip_status || 'IN_TRANSIT'})`,
          address: `Active Trip #${v.trip_id || ''}`,
          details: {
            vehicleType: v.vehicle_type,
            driverPhone: v.driver_phone,
            tripStatus: v.trip_status,
            handlerType: v.handler_type
          }
        });
      }
    });

    return list;
  }, [markersData]);

  // Filter markers by active layer and search query
  const filteredMarkers = useMemo(() => {
    let result = allMarkersList;

    if (activeLayer !== 'ALL') {
      result = result.filter(m => m.type === activeLayer);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        (m.city && m.city.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allMarkersList, activeLayer, searchQuery]);

  const handleSelectNode = (marker) => {
    setSelectedNode(marker);
    if (marker && marker.lat && marker.lng) {
      setMapCenter([marker.lat, marker.lng]);
      setMapZoom(15);
    }
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const loc = await detectCurrentLocation();
      setUserLocation({ lat: loc.lat, lng: loc.lng });
      setMapCenter([loc.lat, loc.lng]);
      setMapZoom(15);
    } catch (err) {
      console.warn('Geolocation error:', err.message);
      alert(err.message || 'Could not obtain your current location.');
    } finally {
      setLocating(false);
    }
  };

  const counts = useMemo(() => {
    return {
      all: allMarkersList.length,
      donors: allMarkersList.filter(m => m.type === 'DONOR').length,
      ngos: allMarkersList.filter(m => m.type === 'NGO').length,
      biogas: allMarkersList.filter(m => m.type === 'BIOGAS').length,
      donations: allMarkersList.filter(m => m.type === 'DONATION').length,
      vehicles: allMarkersList.filter(m => m.type === 'VEHICLE').length
    };
  }, [allMarkersList]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ============================================================ */}
      {/* 1. TOP HEADER / CONTROL BAR                                 */}
      {/* ============================================================ */}
      <header style={{
        height: '68px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        flexShrink: 0,
        gap: '1rem'
      }}>
        {/* Left: Branding & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.86rem',
              fontWeight: '700',
              borderRadius: '10px',
              border: '1px solid #cbd5e1'
            }}
            title="Return to Homepage"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)' }}>
              <Compass size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  SmartSurplus Live OpenStreetMap
                </h1>
                <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.68rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span>
                  LIVE ECOSYSTEM
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>
                Interactive GIS spatial visualization of verified Donors, NGO Shelters, Biogas Plants & Fleets.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Search Bar */}
        <div style={{ flex: '1', maxWidth: '420px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donors, shelters, locations (e.g. Tambaram, Anna Nagar)..."
            style={{
              width: '100%',
              padding: '0.5rem 2rem 0.5rem 2.25rem',
              borderRadius: '999px',
              border: '1.5px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '0.85rem',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Quick Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Focus on My Location"
          >
            <LocateFixed size={15} color={locating ? '#16a34a' : '#475569'} className={locating ? 'spin' : ''} />
            <span style={{ display: window.innerWidth < 800 ? 'none' : 'inline' }}>Locate Me</span>
          </button>

          <button
            onClick={fetchMarkers}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Refresh Live Ecosystem Nodes"
          >
            <RefreshCw size={14} color="#16a34a" className={loading ? 'spin' : ''} />
            <span style={{ display: window.innerWidth < 800 ? 'none' : 'inline' }}>Refresh</span>
          </button>

          {user && (
            <button
              onClick={() => {
                const role = String(user.role || '').toUpperCase();
                if (role === 'ADMIN') navigate('/admin/dashboard');
                else if (role === 'NGO') navigate('/ngo-dashboard');
                else if (role === 'BIOGAS') navigate('/biogas-dashboard');
                else navigate('/donor-dashboard');
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: '#16a34a',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
              }}
            >
              My Portal →
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. LAYER FILTER BAR                                         */}
      {/* ============================================================ */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.6rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        zIndex: 999,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.3rem' }}>
            <Layers size={14} /> FILTER:
          </span>

          {[
            { id: 'ALL', label: `🌐 All Nodes (${counts.all})`, bg: '#f1f5f9', color: '#334155' },
            { id: 'DONOR', label: `🟢 Verified Donors (${counts.donors})`, bg: '#dcfce7', color: '#15803d' },
            { id: 'NGO', label: `🔵 NGO Shelters (${counts.ngos})`, bg: '#e0f2fe', color: '#0369a1' },
            { id: 'BIOGAS', label: `🟠 Biogas Plants (${counts.biogas})`, bg: '#ffedd5', color: '#c2410c' },
            { id: 'DONATION', label: `📦 Active Surplus (${counts.donations})`, bg: '#f0fdf4', color: '#166534' },
            { id: 'VEHICLE', label: `🚚 Live Fleets (${counts.vehicles})`, bg: '#eff6ff', color: '#1d4ed8' }
          ].map(tab => {
            const isActive = activeLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                style={{
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                  background: isActive ? '#f0fdf4' : '#ffffff',
                  color: isActive ? '#15803d' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 4px rgba(22, 163, 74, 0.15)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Showing <strong>{filteredMarkers.length}</strong> active locations on OpenStreetMap &bull; Auto-synced
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN MAP CONTAINER WITH SIDEBAR DRAWER                    */}
      {/* ============================================================ */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        
        {/* Leaflet Map taking 100% height */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <Map
            markers={filteredMarkers}
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            latitude={userLocation?.lat}
            longitude={userLocation?.lng}
          />
        </div>

        {/* ============================================================ */}
        {/* 4. FLOATING INTERACTIVE NODE EXPLORER SIDEBAR                */}
        {/* ============================================================ */}
        <div style={{
          width: '380px',
          maxWidth: '90vw',
          height: '100%',
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          transition: 'transform 0.3s ease'
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}>
            <div>
              <h2 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Ecosystem Directory
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {filteredMarkers.length} locations matching criteria
              </span>
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                style={{ border: 'none', background: '#e2e8f0', color: '#475569', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Clear Pin
              </button>
            )}
          </div>

          {/* If a node is currently selected: Detailed Card View */}
          {selectedNode ? (
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: selectedNode.type === 'DONOR' ? '#f0fdf4' : selectedNode.type === 'NGO' ? '#e0f2fe' : selectedNode.type === 'BIOGAS' ? '#ffedd5' : selectedNode.type === 'VEHICLE' ? '#eff6ff' : '#f0fdf4',
                border: `1.5px solid ${selectedNode.type === 'DONOR' ? '#bbf7d0' : selectedNode.type === 'NGO' ? '#bae6fd' : selectedNode.type === 'BIOGAS' ? '#fed7aa' : selectedNode.type === 'VEHICLE' ? '#bfdbfe' : '#bbf7d0'}`,
                borderRadius: '16px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: '#ffffff',
                    color: selectedNode.type === 'DONOR' ? '#15803d' : selectedNode.type === 'NGO' ? '#0369a1' : selectedNode.type === 'BIOGAS' ? '#c2410c' : '#1d4ed8'
                  }}>
                    {selectedNode.type}
                  </span>
                  {selectedNode.isVerified && (
                    <VerifiedDonorBadge isVerified={true} compact={true} />
                  )}
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  {selectedNode.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', marginBottom: '0.75rem' }}>
                  {selectedNode.subtitle}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.82rem', color: '#334155', marginTop: '0.5rem' }}>
                  <MapPin size={16} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{selectedNode.address}</span>
                </div>

                {selectedNode.details && Object.entries(selectedNode.details).map(([key, val]) => {
                  if (typeof val === 'boolean' || !val) return null;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                      <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <strong style={{ color: '#0f172a' }}>{val}</strong>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons for Selected Node */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedNode.type === 'DONATION' && (
                  <Link
                    to={`/tracking/${selectedNode.details?.donationId || selectedNode.originalId}`}
                    className="btn-primary"
                    style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      fontWeight: '800',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Track Real-Time Pickup Journey</span>
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                  </Link>
                )}

                <button
                  onClick={() => {
                    const lat = selectedNode.lat;
                    const lng = selectedNode.lng;
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontWeight: '700',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    border: '1.5px solid #cbd5e1'
                  }}
                >
                  <Navigation size={15} color="#0284c7" />
                  <span>Get Driving Navigation</span>
                  <ExternalLink size={14} color="#64748b" />
                </button>
              </div>
            </div>
          ) : (
            /* List of all filtered markers */
            <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredMarkers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <MapPin size={32} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#cbd5e1' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#334155' }}>No locations found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search query</div>
                </div>
              ) : (
                filteredMarkers.map(marker => {
                  const isSelected = selectedNode?.id === marker.id;
                  return (
                    <div
                      key={marker.id}
                      onClick={() => handleSelectNode(marker)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          background: marker.type === 'DONOR' ? '#dcfce7' : marker.type === 'NGO' ? '#e0f2fe' : marker.type === 'BIOGAS' ? '#ffedd5' : marker.type === 'VEHICLE' ? '#eff6ff' : '#f0fdf4',
                          color: marker.type === 'DONOR' ? '#15803d' : marker.type === 'NGO' ? '#0369a1' : marker.type === 'BIOGAS' ? '#c2410c' : '#1d4ed8'
                        }}>
                          {marker.type}
                        </span>
                        {marker.isVerified && (
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700' }}>✓ Verified</span>
                        )}
                      </div>

                      <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                        {marker.title}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {marker.subtitle}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                        <MapPin size={12} color="#0ea5e9" />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {marker.address}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

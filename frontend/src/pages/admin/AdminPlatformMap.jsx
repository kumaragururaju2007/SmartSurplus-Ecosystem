import React, { useState, useEffect } from 'react';
import { 
  MapPin, Utensils, Building2, Factory, Package, 
  Filter, RefreshCw, AlertCircle, Eye, Info
} from 'lucide-react';
import { getMapMarkers } from '../../services/adminAPI';
import Map from '../../components/Map';
import '../../styles/dashboard.css';
import '../../styles/map.css';

export default function AdminPlatformMap({ token }) {
  const [markersData, setMarkersData] = useState({
    donors: [],
    ngos: [],
    biogasPlants: [],
    activeDonations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layerFilter, setLayerFilter] = useState('ALL'); // 'ALL' | 'DONORS' | 'NGOS' | 'BIOGAS' | 'DONATIONS'

  const fetchMarkers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMapMarkers(token);
      if (res.success) {
        setMarkersData(res.markers || {});
      } else {
        setError(res.message || 'Unable to load map markers.');
      }
    } catch (err) {
      setError('Connection failure loading platform coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, [token]);

  // Consolidate valid markers for Leaflet Map
  let markersToDisplay = [];

  if (layerFilter === 'ALL' || layerFilter === 'DONORS') {
    markersData.donors.forEach(d => {
      if (d.hasValidLocation) {
        markersToDisplay.push({
          lat: d.lat,
          lng: d.lng,
          type: 'DONOR',
          name: d.name,
          businessType: d.business_type,
          address: d.address
        });
      }
    });
  }

  if (layerFilter === 'ALL' || layerFilter === 'NGOS') {
    markersData.ngos.forEach(n => {
      if (n.hasValidLocation) {
        markersToDisplay.push({
          lat: n.lat,
          lng: n.lng,
          type: 'NGO',
          name: n.name,
          foodCapacity: `${n.food_capacity || 150} Meals`,
          address: n.address
        });
      }
    });
  }

  if (layerFilter === 'ALL' || layerFilter === 'BIOGAS') {
    markersData.biogasPlants.forEach(b => {
      if (b.hasValidLocation) {
        markersToDisplay.push({
          lat: b.lat,
          lng: b.lng,
          type: 'BIOGAS',
          name: b.name,
          processingCapacity: `${b.processing_capacity || 500} kg/day`,
          address: b.address
        });
      }
    });
  }

  if (layerFilter === 'ALL' || layerFilter === 'DONATIONS') {
    markersData.activeDonations.forEach(don => {
      if (don.hasValidLocation) {
        markersToDisplay.push({
          lat: don.lat,
          lng: don.lng,
          type: 'DONATION',
          name: `📦 ${don.food_name} (${don.quantity} ${don.quantity_unit || 'Meals'})`,
          businessType: `Status: ${don.status}`
        });
      }
    });
  }

  const totalValidMarkers = (markersData.donors.filter(d => d.hasValidLocation).length +
                             markersData.ngos.filter(n => n.hasValidLocation).length +
                             markersData.biogasPlants.filter(b => b.hasValidLocation).length +
                             markersData.activeDonations.filter(d => d.hasValidLocation).length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            GEOSPATIAL ECOSYSTEM MAPPING
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Interactive Platform Map 🗺️
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Live geospatial distribution of Donors, verified NGOs, Biogas conversion facilities, and active food surplus origins.
          </p>
        </div>

        <button onClick={fetchMarkers} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Map Data
        </button>
      </div>

      {/* Layer Filter Bar */}
      <div className="glass-card" style={{ padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Filter size={16} color="#6b7280" />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>Map Layers:</span>
          
          <button
            onClick={() => setLayerFilter('ALL')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: layerFilter === 'ALL' ? '800' : '600',
              background: layerFilter === 'ALL' ? '#16a34a' : '#f3f4f6',
              color: layerFilter === 'ALL' ? 'white' : '#4b5563',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            All Entities ({totalValidMarkers})
          </button>

          <button
            onClick={() => setLayerFilter('DONORS')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: layerFilter === 'DONORS' ? '800' : '600',
              background: layerFilter === 'DONORS' ? '#16a34a' : '#f3f4f6',
              color: layerFilter === 'DONORS' ? 'white' : '#4b5563',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🟢 Donors ({markersData.donors.filter(d => d.hasValidLocation).length})
          </button>

          <button
            onClick={() => setLayerFilter('NGOS')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: layerFilter === 'NGOS' ? '800' : '600',
              background: layerFilter === 'NGOS' ? '#0284c7' : '#f3f4f6',
              color: layerFilter === 'NGOS' ? 'white' : '#4b5563',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🔵 NGOs ({markersData.ngos.filter(n => n.hasValidLocation).length})
          </button>

          <button
            onClick={() => setLayerFilter('BIOGAS')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: layerFilter === 'BIOGAS' ? '800' : '600',
              background: layerFilter === 'BIOGAS' ? '#d97706' : '#f3f4f6',
              color: layerFilter === 'BIOGAS' ? 'white' : '#4b5563',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🟠 Biogas Plants ({markersData.biogasPlants.filter(b => b.hasValidLocation).length})
          </button>

          <button
            onClick={() => setLayerFilter('DONATIONS')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: layerFilter === 'DONATIONS' ? '800' : '600',
              background: layerFilter === 'DONATIONS' ? '#15803d' : '#f3f4f6',
              color: layerFilter === 'DONATIONS' ? 'white' : '#4b5563',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            📦 Active Surplus ({markersData.activeDonations.filter(d => d.hasValidLocation).length})
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Info size={14} /> Real database coordinates only
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6b7280' }}>
            <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
            Initializing platform map and pinning coordinates...
          </div>
        ) : (
          <Map
            markers={markersToDisplay}
            height="560px"
            zoom={12}
          />
        )}
      </div>
    </div>
  );
}

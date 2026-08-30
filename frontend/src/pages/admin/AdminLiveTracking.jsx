import React, { useState, useEffect } from 'react';
import { 
  Truck, Navigation, Compass, AlertCircle, RefreshCw, 
  MapPin, CheckCircle2, Clock, Zap, ArrowRight, ShieldCheck
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getLiveTracking, getDonationJourney } from '../../services/adminAPI';
import Map from '../../components/Map';
import Timer from '../../components/Timer';
import VerifiedDonorBadge from '../../components/VerifiedDonorBadge';
import '../../styles/dashboard.css';
import '../../styles/tracking.css';

export default function AdminLiveTracking({ token }) {
  const [activeTransports, setActiveTransports] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTransports = async () => {
    try {
      const res = await getLiveTracking(token);
      if (res.success) {
        setActiveTransports(res.activeTransports || []);
        if (res.activeTransports?.length > 0 && !selectedDonationId) {
          setSelectedDonationId(res.activeTransports[0].donationId);
        }
      }
    } catch (err) {
      setError('Unable to load live active transports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJourney = async (id) => {
    if (!id) return;
    setJourneyLoading(true);
    try {
      const res = await getDonationJourney(id, token);
      if (res.success) {
        setSelectedJourney(res.journey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJourneyLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
    const interval = setInterval(fetchTransports, 12000);

    // Socket.io for live updates
    const socket = io();
    socket.on('tracking_updated', () => {
      fetchTransports();
      if (selectedDonationId) fetchJourney(selectedDonationId);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (selectedDonationId) {
      fetchJourney(selectedDonationId);
    }
  }, [selectedDonationId]);

  const filteredTransports = activeTransports.filter(t => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_TRANSIT') return ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(t.status);
    if (statusFilter === 'MATCHED') return ['MATCHED', 'ACCEPTED'].includes(t.status);
    if (statusFilter === 'BIOGAS') return t.destinationType === 'BIOGAS';
    return true;
  });

  const isBiogas = selectedJourney?.destinationType === 'BIOGAS' || ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(selectedJourney?.status);
  
  const NGO_TIMELINE = [
    { label: 'Donation Created', key: 'POSTED' },
    { label: 'Match Confirmed', key: 'MATCHED' },
    { label: 'NGO Accepted', key: 'ACCEPTED' },
    { label: 'Pickup Scheduled', key: 'PICKUP_STARTED' },
    { label: 'In Transit', key: 'COLLECTED' },
    { label: 'NGO Received', key: 'DELIVERED' },
    { label: 'Completed', key: 'COMPLETED' }
  ];

  const BIOGAS_TIMELINE = [
    { label: 'Donation Created', key: 'POSTED' },
    { label: 'Redirected to Biogas', key: 'REDIRECTED_TO_BIOGAS' },
    { label: 'Plant Accepted', key: 'ACCEPTED' },
    { label: 'Pickup Started', key: 'PICKUP_STARTED' },
    { label: 'In Transit', key: 'COLLECTED' },
    { label: 'Waste Received', key: 'PROCESSING' },
    { label: 'Energy Recovery Completed', key: 'COMPLETED' }
  ];

  const timelineSteps = isBiogas ? BIOGAS_TIMELINE : NGO_TIMELINE;
  const currentStatus = selectedJourney?.status || 'POSTED';
  const statusKeys = timelineSteps.map(s => s.key);
  const currentStepIdx = statusKeys.indexOf(currentStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            REAL-TIME LOGISTICS & TRANSIT RADAR
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Live Transportation & Journey Tracking 🚚
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Monitor food surplus collection, transit routes, and confirmed deliveries across the metropolitan grid.
          </p>
        </div>

        <button onClick={fetchTransports} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Transports
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
          <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
          Connecting to live transportation radar...
        </div>
      ) : activeTransports.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
          <Truck size={42} color="#16a34a" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>No active transportation at the moment.</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>
            When surplus food listings are matched and confirmed for pickup, live transit vectors will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Active Transports List */}
          <div className="glass-card" style={{ padding: '1.25rem', maxHeight: '750px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                Active Transports ({filteredTransports.length})
              </h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {['ALL', 'IN_TRANSIT', 'BIOGAS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: statusFilter === f ? '800' : '600',
                      background: statusFilter === f ? '#16a34a' : '#f3f4f6',
                      color: statusFilter === f ? 'white' : '#4b5563',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredTransports.map((t) => {
                const isSelected = selectedDonationId === t.donationId;
                return (
                  <div
                    key={t.donationId}
                    onClick={() => setSelectedDonationId(t.donationId)}
                    style={{
                      padding: '0.9rem',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ color: '#111827', fontSize: '0.92rem' }}>{t.foodName}</strong>
                      <span className={`badge badge-${t.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                        {t.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <span>Qty: <strong>{t.quantity}</strong> | Origin: {t.donorName}</span>
                      <VerifiedDonorBadge isVerified={t.is_donor_verified || t.isVerified || t.is_verified} compact={true} />
                    </div>

                    <div style={{ fontSize: '0.8rem', color: t.isConfirmedMatch ? (t.destinationType === 'BIOGAS' ? '#d97706' : '#0284c7') : '#9ca3af', marginTop: '0.2rem', fontWeight: '700' }}>
                      {t.isConfirmedMatch ? `➔ Destination: ${t.destinationName}` : '⌛ Awaiting NGO / Plant Match Confirmation'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Map & Detailed Journey Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {journeyLoading ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                Loading route telemetry...
              </div>
            ) : selectedJourney ? (
              <>
                {/* Journey Detail Header Card */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: isBiogas ? '#d97706' : '#15803d', textTransform: 'uppercase' }}>
                        {isBiogas ? '⚡ BIOGAS RECOVERY LOGISTICS' : '🍲 HUMAN REDISTRIBUTION ROUTE'}
                      </span>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#111827', marginTop: '0.2rem' }}>
                        {selectedJourney.food_name} (#{selectedJourney.id})
                      </h2>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        Quantity: <strong>{selectedJourney.quantity} {selectedJourney.quantity_unit || 'Meals'}</strong> | Category: {selectedJourney.food_category}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${selectedJourney.status.toLowerCase()}`} style={{ fontSize: '0.85rem' }}>
                        {selectedJourney.status}
                      </span>
                      {selectedJourney.safe_until && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <Timer safeUntil={selectedJourney.safe_until} status={selectedJourney.status} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Origin ➔ Destination Details */}
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d' }}>ORIGIN (DONOR)</span>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#111827', fontSize: '0.92rem', flexWrap: 'wrap' }}>
                        <span>{selectedJourney.donor_name}</span>
                        <VerifiedDonorBadge isVerified={selectedJourney.is_donor_verified || selectedJourney.is_verified || selectedJourney.isVerified} compact={true} />
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {selectedJourney.donor_address || selectedJourney.pickup_address}
                      </span>
                    </div>

                    <div style={{ color: '#9ca3af', fontWeight: 'bold', fontSize: '1.2rem' }}>➔</div>

                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isBiogas ? '#d97706' : '#0284c7' }}>
                        DESTINATION ({isBiogas ? 'BIOGAS FACILITY' : 'NGO SHELTER'})
                      </span>
                      {selectedJourney.isConfirmedMatch ? (
                        <>
                          <strong style={{ display: 'block', color: '#111827', fontSize: '0.92rem' }}>
                            {selectedJourney.destinationName}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {selectedJourney.destinationAddress || 'Verified Destination Location'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#d97706', fontWeight: '600', display: 'block' }}>
                          ⚠️ Destination route activates only after match is confirmed.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Leaflet Map Route */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <Map
                      donorLat={selectedJourney.donor_lat}
                      donorLng={selectedJourney.donor_lng}
                      destLat={selectedJourney.destLat}
                      destLng={selectedJourney.destLng}
                      destType={isBiogas ? 'BIOGAS' : 'NGO'}
                      vehicleLat={selectedJourney.vehicle_lat || selectedJourney.current_lat}
                      vehicleLng={selectedJourney.vehicle_lng || selectedJourney.current_lng}
                      vehicleNumber={selectedJourney.vehicle_number}
                      driverName={selectedJourney.driver_name}
                      height="380px"
                    />
                  </div>

                  {/* Real-time Journey Timeline */}
                  <div style={{ marginTop: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
                      Donation Collection & Transit Timeline
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timelineSteps.length}, 1fr)`, gap: '0.4rem', textAlign: 'center' }}>
                      {timelineSteps.map((step, idx) => {
                        const isCurrent = selectedJourney.status === step.key;
                        const isPassed = currentStepIdx >= idx && currentStepIdx !== -1;

                        return (
                          <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: isCurrent ? '#16a34a' : isPassed ? '#bbf7d0' : '#e5e7eb',
                              color: isCurrent ? 'white' : isPassed ? '#15803d' : '#9ca3af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              marginBottom: '0.35rem',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.2)' : 'none'
                            }}>
                              {isPassed ? '✓' : idx + 1}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? '#16a34a' : '#6b7280', lineHeight: '1.2' }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

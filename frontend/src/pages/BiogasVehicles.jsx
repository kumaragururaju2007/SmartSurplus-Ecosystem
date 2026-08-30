import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Plus, Navigation, ShieldCheck, AlertCircle, 
  CheckCircle2, X, RefreshCw, Smartphone, Radio, Trash2, 
  Edit3, KeyRound, Clock, User, Phone, MapPin, ExternalLink,
  Flame, Gauge, Fuel, Info, Check, Copy
} from 'lucide-react';
import { 
  getVehicles, createVehicle, updateVehicleStatus, deleteVehicle, 
  getDrivers, createDriver, assignDriver, updateDriver, deleteDriver, 
  generatePairingCode, registerGPSDevice 
} from '../services/fleetAPI';
import '../styles/dashboard.css';
import '../styles/biogasDashboard.css';

export default function BiogasVehicles({ token, user }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('VEHICLES'); // 'VEHICLES' | 'DRIVERS'
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Selected Records for Modals
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pairingData, setPairingData] = useState(null);
  const [pairingCountdown, setPairingCountdown] = useState(900); // 15 mins in seconds
  const [copiedCode, setCopiedCode] = useState(false);

  // Vehicle Form State
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Waste Collection Van',
    vehicleModel: '',
    capacity: '2000 kg',
    fuelType: 'CNG',
    gpsTrackingMethod: 'DRIVER_MOBILE_GPS',
    status: 'AVAILABLE'
  });

  // Driver Form State
  const [driverForm, setDriverForm] = useState({
    driverName: '',
    driverPhone: '',
    licenseNumber: '',
    employeeId: '',
    emergencyContact: '',
    vehicleId: '',
    status: 'AVAILABLE'
  });

  // IoT Device Form State
  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    serialNumber: '',
    imei: '',
    provider: 'SmartSurplus IoT'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      setError('');
      const [vRes, dRes] = await Promise.all([
        getVehicles(token),
        getDrivers(token)
      ]);

      if (vRes.success) setVehicles(vRes.vehicles || []);
      if (dRes.success) setDrivers(dRes.drivers || []);
    } catch (err) {
      setError('Error connecting to fleet and driver database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, [token]);

  // Pairing code countdown timer
  useEffect(() => {
    if (!isPairingModalOpen || !pairingData) return;
    setPairingCountdown(900);
    const timer = setInterval(() => {
      setPairingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPairingModalOpen, pairingData]);

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await createVehicle(vehicleForm, token);
      if (res.success) {
        setSuccessMsg(res.message || 'Vehicle registered successfully!');
        setIsAddVehicleOpen(false);
        setVehicleForm({
          vehicleNumber: '',
          vehicleType: 'Waste Collection Van',
          vehicleModel: '',
          capacity: '2000 kg',
          fuelType: 'CNG',
          gpsTrackingMethod: 'DRIVER_MOBILE_GPS',
          status: 'AVAILABLE'
        });
        fetchFleetData();
      } else {
        setFormError(res.message || 'Failed to register vehicle.');
      }
    } catch (err) {
      setFormError('Server error registering vehicle.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await createDriver(driverForm, token);
      if (res.success) {
        setSuccessMsg(res.message || 'Driver registered successfully!');
        setIsAddDriverOpen(false);
        setDriverForm({
          driverName: '',
          driverPhone: '',
          licenseNumber: '',
          employeeId: '',
          emergencyContact: '',
          vehicleId: '',
          status: 'AVAILABLE'
        });
        fetchFleetData();
      } else {
        setFormError(res.message || 'Failed to register driver.');
      }
    } catch (err) {
      setFormError('Server error registering driver.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGeneratePairingCode = async (vehicle) => {
    setFormError('');
    try {
      let drvId = vehicle.driver_id;
      if (!drvId) {
        const availableDriver = drivers.find(d => d.status === 'AVAILABLE' || Number(d.vehicle_id) === Number(vehicle.id));
        if (availableDriver) drvId = availableDriver.id;
      }

      if (!drvId) {
        setError('Please assign a driver to this vehicle before generating a mobile GPS pairing code.');
        return;
      }

      const res = await generatePairingCode({ vehicleId: vehicle.id, driverId: drvId }, token);
      if (res.success) {
        setPairingData(res);
        setSelectedVehicle(vehicle);
        setIsPairingModalOpen(true);
        setCopiedCode(false);
      } else {
        setError(res.message || 'Failed to generate driver pairing code.');
      }
    } catch (err) {
      setError('Server error generating pairing code.');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your facility fleet?')) return;
    try {
      const res = await deleteVehicle(id, token);
      if (res.success) {
        setSuccessMsg('Vehicle removed successfully.');
        fetchFleetData();
      } else {
        setError(res.message || 'Failed to remove vehicle.');
      }
    } catch (e) {
      setError('Error removing vehicle.');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to remove this driver from your facility fleet?')) return;
    try {
      const res = await deleteDriver(id, token);
      if (res.success) {
        setSuccessMsg('Driver removed successfully.');
        fetchFleetData();
      } else {
        setError(res.message || 'Failed to remove driver.');
      }
    } catch (e) {
      setError('Error removing driver.');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;

  return (
    <div className="biogas-page-container" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
              <Truck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#111827', margin: 0 }}>Vehicles & Fleet</h1>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                Manage vehicles, drivers, GPS devices and tracking status
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setError(''); setSuccessMsg(''); setIsAddVehicleOpen(true); }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={16} /> Add Vehicle
          </button>
          <button 
            onClick={() => { setError(''); setSuccessMsg(''); setIsAddDriverOpen(true); }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#f3f4f6' }}
          >
            <User size={16} /> Register Driver
          </button>
          <button 
            onClick={fetchFleetData}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
            title="Refresh Fleet"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.88rem' }}>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.88rem' }}>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}><X size={16} /></button>
        </div>
      )}

      {/* Top Fleet KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '10px' }}><Truck size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>{vehicles.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Total Facility Fleet</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#ecfdf5', color: '#16a34a', padding: '0.75rem', borderRadius: '10px' }}><Navigation size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>{onTripVehicles}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Active on Trip (Live GPS)</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.75rem', borderRadius: '10px' }}><ShieldCheck size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#d97706' }}>{availableVehicles}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Available for Dispatch</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '0.75rem', borderRadius: '10px' }}><User size={22} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#9333ea' }}>{drivers.length}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Registered Drivers</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('VEHICLES')}
          style={{
            padding: '0.6rem 1rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'VEHICLES' ? '#d97706' : '#6b7280',
            borderBottom: activeTab === 'VEHICLES' ? '2px solid #d97706' : 'none',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Truck size={16} /> Vehicles & GPS Tracking ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveTab('DRIVERS')}
          style={{
            padding: '0.6rem 1rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'DRIVERS' ? '#d97706' : '#6b7280',
            borderBottom: activeTab === 'DRIVERS' ? '2px solid #d97706' : 'none',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <User size={16} /> Driver Management ({drivers.length})
        </button>
      </div>

      {/* Tab 1: Vehicles List */}
      {activeTab === 'VEHICLES' && (
        <div>
          {vehicles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white' }}>
              <Truck size={48} color="#9ca3af" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#374151' }}>No Vehicles in Fleet</h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Register your food waste collection vans, trucks, and transport fleet to enable real-time GPS tracking.
              </p>
              <button onClick={() => setIsAddVehicleOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                + Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {vehicles.map((v) => {
                const assignedDriver = drivers.find(d => Number(d.id) === Number(v.driver_id) || Number(d.vehicle_id) === Number(v.id));
                const isMobileGps = (v.gps_tracking_method || 'DRIVER_MOBILE_GPS') === 'DRIVER_MOBILE_GPS';
                const isLive = v.status === 'ON_TRIP';

                return (
                  <div key={v.id} className="glass-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'inline-block', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.5px', color: '#111827' }}>
                            {v.vehicle_number}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                            {v.vehicle_type} {v.vehicle_model ? `• ${v.vehicle_model}` : ''}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: isLive ? '#dcfce7' : (v.status === 'AVAILABLE' ? '#fef3c7' : '#f3f4f6'),
                          color: isLive ? '#15803d' : (v.status === 'AVAILABLE' ? '#b45309' : '#4b5563')
                        }}>
                          {isLive ? '🟢 ON TRIP (LIVE)' : v.status}
                        </span>
                      </div>

                      {/* Specs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f9fafb', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#6b7280', display: 'block' }}>Capacity</span>
                          <strong style={{ color: '#111827' }}>{v.capacity || 'N/A'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280', display: 'block' }}>Fuel Type</span>
                          <strong style={{ color: '#111827' }}>{v.fuel_type || 'Diesel'}</strong>
                        </div>
                      </div>

                      {/* Driver & Tracking Status */}
                      <div style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151', marginBottom: '0.3rem' }}>
                          <User size={14} color="#6b7280" />
                          <span>Driver: <strong>{assignedDriver ? assignedDriver.driver_name : (v.driver_name || 'Unassigned')}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151' }}>
                          {isMobileGps ? <Smartphone size={14} color="#d97706" /> : <Radio size={14} color="#2563eb" />}
                          <span>Source: <strong>{isMobileGps ? 'Driver Mobile GPS' : 'Vehicle IoT Device'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isMobileGps ? (
                        <button
                          onClick={() => handleGeneratePairingCode(v)}
                          className="btn-primary"
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', background: '#d97706', borderColor: '#b45309' }}
                        >
                          <KeyRound size={14} /> Pair Mobile GPS
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedVehicle(v); setIsDeviceModalOpen(true); }}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Radio size={14} /> IoT Config
                        </button>
                      )}

                      <button
                        onClick={() => { setSelectedVehicle(v); setIsDetailsModalOpen(true); }}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                        title="Vehicle Details"
                      >
                        Details
                      </button>

                      {isLive && (
                        <button
                          onClick={() => navigate('/tracking')}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', background: '#16a34a', borderColor: '#15803d' }}
                          title="View Live GPS Map"
                        >
                          <Navigation size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        style={{ background: 'none', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete Vehicle"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Drivers List */}
      {activeTab === 'DRIVERS' && (
        <div>
          {drivers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white' }}>
              <User size={48} color="#9ca3af" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#374151' }}>No Drivers Registered</h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Register drivers authorized to operate collection vehicles and log into the mobile tracking portal.
              </p>
              <button onClick={() => setIsAddDriverOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                + Register First Driver
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {drivers.map((d) => {
                const assignedVeh = vehicles.find(v => Number(v.id) === Number(d.vehicle_id));
                const isOnTrip = d.status === 'ON_TRIP';

                return (
                  <div key={d.id} className="glass-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', margin: 0 }}>{d.driver_name}</h4>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                            <Phone size={12} /> {d.driver_phone}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: isOnTrip ? '#dcfce7' : '#fef3c7',
                          color: isOnTrip ? '#15803d' : '#b45309'
                        }}>
                          {isOnTrip ? '🟢 ON TRIP' : d.status}
                        </span>
                      </div>

                      <div style={{ background: '#f9fafb', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}>
                          <span style={{ color: '#6b7280' }}>License: </span>
                          <strong style={{ color: '#111827' }}>{d.license_number || 'On File'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Assigned Vehicle: </span>
                          <strong style={{ color: assignedVeh ? '#d97706' : '#6b7280' }}>
                            {assignedVeh ? assignedVeh.vehicle_number : (d.vehicle_number || 'Unassigned')}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ID: #{d.id}</span>
                      <button
                        onClick={() => handleDeleteDriver(d.id)}
                        style={{ background: 'none', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Driver Mobile GPS Pairing Code Modal */}
      {/* ========================================================================= */}
      {isPairingModalOpen && pairingData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem', borderRadius: '10px' }}><KeyRound size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: 0 }}>Driver Pairing Code</h3>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Single-use Driver GPS session key</span>
                </div>
              </div>
              <button onClick={() => setIsPairingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* 6-Digit Pairing Box */}
            <div style={{ background: '#fffbe6', border: '2px dashed #f59e0b', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                PAIRING CODE
              </span>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '8px', color: '#92400e', margin: '0.5rem 0' }}>
                {pairingData.code}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: pairingCountdown > 60 ? '#b45309' : '#dc2626', fontWeight: '600' }}>
                <Clock size={14} />
                <span>Expires in: {formatTime(pairingCountdown)}</span>
              </div>
            </div>

            {/* Target Info */}
            <div style={{ background: '#f9fafb', padding: '0.85rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#6b7280' }}>Vehicle:</span>
                <strong style={{ color: '#111827' }}>{pairingData.vehicleNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#6b7280' }}>Assigned Driver:</span>
                <strong style={{ color: '#111827' }}>{pairingData.driverName} ({pairingData.driverPhone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Tracking Source:</span>
                <strong style={{ color: '#d97706' }}>Driver Mobile GPS</strong>
              </div>
            </div>

            {/* Instructions */}
            <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: '1.4', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.4rem 0' }}><strong>Driver Instructions:</strong></p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Open the SmartSurplus <strong>Driver Portal</strong> (or navigate to <code>/driver-login</code>).</li>
                <li>Enter the 6-digit pairing code <strong>{pairingData.code}</strong>.</li>
                <li>Tap <strong>Allow Location Access</strong> to stream authentic live GPS coordinates.</li>
              </ol>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleCopyCode(pairingData.code)}
                className="btn-primary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: copiedCode ? '#16a34a' : '#d97706', borderColor: copiedCode ? '#15803d' : '#b45309' }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Code Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={() => window.open('/driver-login', '_blank')}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <ExternalLink size={16} /> Open Driver Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Add Vehicle Modal */}
      {/* ========================================================================= */}
      {isAddVehicleOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0 }}>Register New Fleet Vehicle</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Vehicle Registration Number (Indian Plate) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA 01 AB 5678"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  >
                    <option value="Waste Collection Van">Waste Collection Van</option>
                    <option value="Food Transport Van">Food Transport Van</option>
                    <option value="Mini Truck">Mini Truck</option>
                    <option value="Truck">Truck</option>
                    <option value="Refrigerated Vehicle">Refrigerated Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Ace EV / Mahindra"
                    value={vehicleForm.vehicleModel}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Payload Capacity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2000 kg"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, capacity: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Fuel Type
                  </label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, fuelType: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  >
                    <option value="CNG">CNG / Biogas</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  GPS Tracking Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', background: vehicleForm.gpsTrackingMethod === 'DRIVER_MOBILE_GPS' ? '#fef3c7' : 'white' }}>
                    <input
                      type="radio"
                      name="gpsTrackingMethod"
                      value="DRIVER_MOBILE_GPS"
                      checked={vehicleForm.gpsTrackingMethod === 'DRIVER_MOBILE_GPS'}
                      onChange={() => setVehicleForm(prev => ({ ...prev, gpsTrackingMethod: 'DRIVER_MOBILE_GPS' }))}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Driver Mobile GPS</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', background: vehicleForm.gpsTrackingMethod === 'VEHICLE_IOT_GPS' ? '#eff6ff' : 'white' }}>
                    <input
                      type="radio"
                      name="gpsTrackingMethod"
                      value="VEHICLE_IOT_GPS"
                      checked={vehicleForm.gpsTrackingMethod === 'VEHICLE_IOT_GPS'}
                      onChange={() => setVehicleForm(prev => ({ ...prev, gpsTrackingMethod: 'VEHICLE_IOT_GPS' }))}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Vehicle IoT Device</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Initial Vehicle Status
                </label>
                <select
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddVehicleOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-primary" style={{ flex: 1, background: '#d97706', borderColor: '#b45309' }}>
                  {formLoading ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Register Driver Modal */}
      {/* ========================================================================= */}
      {isAddDriverOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0 }}>Register Facility Driver</h3>
              <button onClick={() => setIsAddDriverOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddDriverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={driverForm.driverName}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, driverName: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Driver Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9840123456"
                  value={driverForm.driverPhone}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Driving License No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KA-01-2020-0012345"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                    Employee / Badge ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BIO-DRV-04"
                    value={driverForm.employeeId}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '0.3rem' }}>
                  Assign to Vehicle
                </label>
                <select
                  value={driverForm.vehicleId}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                >
                  <option value="">-- No Vehicle Assigned (Standby) --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddDriverOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-primary" style={{ flex: 1, background: '#d97706', borderColor: '#b45309' }}>
                  {formLoading ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Vehicle Details Drawer / Modal */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && selectedVehicle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>Vehicle Dossier</h3>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Facility Fleet Telemetry & Assignment Specs</span>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
            </div>

            {/* Vehicle Information */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Vehicle Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div><span style={{ color: '#6b7280' }}>Vehicle Number:</span> <strong style={{ display: 'block' }}>{selectedVehicle.vehicle_number}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Type:</span> <strong style={{ display: 'block' }}>{selectedVehicle.vehicle_type}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Model:</span> <strong style={{ display: 'block' }}>{selectedVehicle.vehicle_model || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Payload Capacity:</span> <strong style={{ display: 'block' }}>{selectedVehicle.capacity || 'N/A'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Fuel Type:</span> <strong style={{ display: 'block' }}>{selectedVehicle.fuel_type || 'Diesel'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Operating Status:</span> <strong style={{ display: 'block', color: selectedVehicle.status === 'ON_TRIP' ? '#16a34a' : '#d97706' }}>{selectedVehicle.status}</strong></div>
            </div>

            {/* Driver Information */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Driver Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem' }}>
              <div><span style={{ color: '#6b7280' }}>Driver Name:</span> <strong style={{ display: 'block' }}>{selectedVehicle.driver_name || 'Unassigned'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>Driver Phone:</span> <strong style={{ display: 'block' }}>{selectedVehicle.driver_phone || 'Unassigned'}</strong></div>
            </div>

            {/* Tracking Information */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              GPS Tracking & Telemetry
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div><span style={{ color: '#6b7280' }}>Tracking Method:</span> <strong style={{ display: 'block' }}>{selectedVehicle.gps_tracking_method || 'DRIVER_MOBILE_GPS'}</strong></div>
              <div><span style={{ color: '#6b7280' }}>GPS Device Status:</span> <strong style={{ display: 'block' }}>{selectedVehicle.gps_device_status || 'READY'}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setIsDetailsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                Close
              </button>
              <button onClick={() => { setIsDetailsModalOpen(false); navigate('/tracking'); }} className="btn-primary" style={{ flex: 1, background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <Navigation size={16} /> Open Live Tracking Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

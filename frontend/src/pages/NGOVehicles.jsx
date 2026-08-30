import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Navigation, ShieldCheck, AlertCircle, 
  CheckCircle2, X, RefreshCw, Smartphone, Radio, Trash2, Edit3 
} from 'lucide-react';
import { getVehicles, createVehicle, updateVehicleStatus, deleteVehicle, registerGPSDevice } from '../services/fleetAPI';
import '../styles/dashboard.css';

export default function NGOVehicles({ token, user }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [selectedVehicleForDevice, setSelectedVehicleForDevice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Food Transport Van',
    vehicleModel: '',
    capacity: '500 kg',
    fuelType: 'Diesel',
    gpsTrackingMethod: 'DRIVER_MOBILE_GPS',
    status: 'AVAILABLE'
  });

  // IoT Device Form State
  const [deviceFormData, setDeviceFormData] = useState({
    deviceId: '',
    serialNumber: '',
    imei: '',
    provider: 'SmartSurplus IoT'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVehicleList = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getVehicles(token);
      if (res.success) {
        setVehicles(res.vehicles || []);
      } else {
        setError(res.message || 'Could not load vehicle fleet.');
      }
    } catch (err) {
      setError('Network error connecting to vehicle fleet database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleList();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vehicleNumber') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddVehicleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await createVehicle(formData, token);
      if (res.success) {
        setSuccessMsg(res.message || 'Vehicle registered successfully!');
        setIsAddModalOpen(false);
        setFormData({
          vehicleNumber: '',
          vehicleType: 'Food Transport Van',
          vehicleModel: '',
          capacity: '500 kg',
          fuelType: 'Diesel',
          gpsTrackingMethod: 'DRIVER_MOBILE_GPS',
          status: 'AVAILABLE'
        });
        fetchVehicleList();
      } else {
        setFormError(res.message || 'Failed to register vehicle.');
      }
    } catch (err) {
      setFormError('Server error registering vehicle.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegisterDeviceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleForDevice) return;
    setFormError('');
    setFormLoading(true);

    try {
      const res = await registerGPSDevice({
        vehicleId: selectedVehicleForDevice.id,
        ...deviceFormData
      }, token);

      if (res.success) {
        setSuccessMsg(`IoT GPS Device linked to ${selectedVehicleForDevice.vehicle_number} successfully!`);
        setIsDeviceModalOpen(false);
        setDeviceFormData({ deviceId: '', serialNumber: '', imei: '', provider: 'SmartSurplus IoT' });
        fetchVehicleList();
      } else {
        setFormError(res.message || 'Could not register GPS device.');
      }
    } catch (err) {
      setFormError('Error linking GPS hardware.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      const res = await updateVehicleStatus(vehicleId, { status: newStatus }, token);
      if (res.success) {
        setSuccessMsg('Vehicle status updated successfully.');
        fetchVehicleList();
      }
    } catch (err) {
      setError('Could not update vehicle status.');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your fleet?')) return;
    try {
      const res = await deleteVehicle(vehicleId, token);
      if (res.success) {
        setSuccessMsg('Vehicle removed successfully.');
        fetchVehicleList();
      } else {
        setError(res.message || 'Could not remove vehicle.');
      }
    } catch (err) {
      setError('Error removing vehicle.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>AVAILABLE</span>;
      case 'ASSIGNED':
        return <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>ASSIGNED</span>;
      case 'ON_TRIP':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>ON TRIP 🚚</span>;
      case 'MAINTENANCE':
        return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>MAINTENANCE</span>;
      default:
        return <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>{status}</span>;
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase' }}>
            NGO FLEET HUB
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#111827', margin: '0.35rem 0 0 0' }}>
            Vehicle Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.92rem', margin: '0.25rem 0 0 0' }}>
            Register and manage your food transport fleet, assign verified drivers, and configure real-time GPS tracking methods.
          </p>
        </div>

        <button
          onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#ffffff', padding: '0.75rem 1.4rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)' }}
        >
          <Plus size={18} strokeWidth={2.6} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.9rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#f0fdf4', color: '#15803d', padding: '0.9rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '600' }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Vehicle Cards Grid / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', display: 'block', color: '#16a34a' }} />
          <span>Loading NGO vehicle fleet...</span>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff' }}>
          <div style={{ width: '64px', height: '64px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Truck size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>No Vehicles Registered Yet</h3>
          <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            Register your transport vans or trucks to accept food donations and enable live GPS trip tracking.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ background: '#16a34a', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '700' }}
          >
            + Register First Vehicle
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {vehicles.map((v) => (
            <div key={v.id} className="glass-card hover-lift" style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#111827', letterSpacing: '0.5px', background: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '0.2rem 0.6rem', borderRadius: '6px', display: 'inline-block' }}>
                      {v.vehicle_number}
                    </span>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.35rem', fontWeight: '600' }}>
                      {v.vehicle_type} {v.vehicle_model ? `• ${v.vehicle_model}` : ''}
                    </div>
                  </div>
                  {getStatusBadge(v.status)}
                </div>

                <div style={{ background: '#f9fafb', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.85rem', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Capacity:</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>{v.capacity || 'Standard'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Fuel Type:</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>{v.fuel_type || 'Diesel'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Assigned Driver:</span>
                    <span style={{ fontWeight: '700', color: v.driver_name ? '#15803d' : '#9ca3af' }}>
                      {v.driver_name ? `👤 ${v.driver_name}` : 'None (Unassigned)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280' }}>GPS Method:</span>
                    <span style={{ fontWeight: '800', fontSize: '0.78rem', color: v.gps_tracking_method === 'VEHICLE_IOT_GPS' ? '#d97706' : '#2563eb', background: v.gps_tracking_method === 'VEHICLE_IOT_GPS' ? '#fffbeb' : '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {v.gps_tracking_method === 'VEHICLE_IOT_GPS' ? '⚡ Vehicle IoT Device' : '📱 Driver Mobile GPS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '0.85rem' }}>
                <select
                  value={v.status}
                  onChange={(e) => handleStatusChange(v.id, e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '700', color: '#374151' }}
                >
                  <option value="AVAILABLE">Set AVAILABLE</option>
                  <option value="MAINTENANCE">Set MAINTENANCE</option>
                  <option value="INACTIVE">Set INACTIVE</option>
                </select>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {v.gps_tracking_method === 'VEHICLE_IOT_GPS' && (
                    <button
                      onClick={() => { setSelectedVehicleForDevice(v); setIsDeviceModalOpen(true); }}
                      title="Configure GPS Device"
                      style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <Radio size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(v.id)}
                    title="Remove Vehicle"
                    style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL: + ADD VEHICLE ==================== */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.5rem', borderRadius: '10px' }}>
                  <Truck size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827', margin: 0 }}>Register New Vehicle</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '600', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddVehicleSubmit}>
              {/* Vehicle Number */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  Vehicle Registration Number * <span style={{ color: '#6b7280', fontWeight: '500' }}>(Indian Plate: e.g. TN 38 AB 1234)</span>
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="TN 38 AB 1234"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase' }}
                />
              </div>

              {/* Vehicle Type & Model */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.9rem' }}
                  >
                    <option value="Food Transport Van">Food Transport Van</option>
                    <option value="Refrigerated Vehicle">Refrigerated Vehicle</option>
                    <option value="Mini Truck">Mini Truck</option>
                    <option value="Truck">Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    placeholder="Tata Ace / Mahindra Bolero"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Capacity & Fuel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Capacity
                  </label>
                  <input
                    type="text"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="800 kg / 300 Meals"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Fuel Type
                  </label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.9rem' }}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              {/* GPS Tracking Method */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
                  GPS Tracking Method *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, gpsTrackingMethod: 'DRIVER_MOBILE_GPS' }))}
                    style={{
                      padding: '0.85rem',
                      border: formData.gpsTrackingMethod === 'DRIVER_MOBILE_GPS' ? '2px solid #2563eb' : '1px solid #d1d5db',
                      background: formData.gpsTrackingMethod === 'DRIVER_MOBILE_GPS' ? '#eff6ff' : '#ffffff',
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Smartphone size={18} color="#2563eb" />
                      <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1e40af' }}>Driver Mobile GPS</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Driver uses smartphone GPS during pickup</p>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, gpsTrackingMethod: 'VEHICLE_IOT_GPS' }))}
                    style={{
                      padding: '0.85rem',
                      border: formData.gpsTrackingMethod === 'VEHICLE_IOT_GPS' ? '2px solid #d97706' : '1px solid #d1d5db',
                      background: formData.gpsTrackingMethod === 'VEHICLE_IOT_GPS' ? '#fffbeb' : '#ffffff',
                      borderRadius: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Radio size={18} color="#d97706" />
                      <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#b45309' }}>Vehicle IoT Device</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Hardware GPS device installed in vehicle</p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#16a34a', color: '#ffffff', fontWeight: '800', border: 'none', cursor: 'pointer' }}
                >
                  {formLoading ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CONFIGURE IoT GPS DEVICE ==================== */}
      {isDeviceModalOpen && selectedVehicleForDevice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>Link GPS Hardware Device</h3>
                <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Vehicle: <strong>{selectedVehicleForDevice.vehicle_number}</strong></span>
              </div>
              <button onClick={() => setIsDeviceModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterDeviceSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  GPS Device ID / Hardware Identifier *
                </label>
                <input
                  type="text"
                  value={deviceFormData.deviceId}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, deviceId: e.target.value })}
                  placeholder="SMART-GPS-001"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={deviceFormData.serialNumber}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, serialNumber: e.target.value })}
                    placeholder="SN-8982341"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    IMEI
                  </label>
                  <input
                    type="text"
                    value={deviceFormData.imei}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, imei: e.target.value })}
                    placeholder="860123456789012"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#d97706', color: '#ffffff', fontWeight: '800', border: 'none' }}
                >
                  {formLoading ? 'Linking...' : 'Connect Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

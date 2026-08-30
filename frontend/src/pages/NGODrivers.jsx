import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Truck, Phone, ShieldCheck, AlertCircle, 
  CheckCircle2, X, RefreshCw, Smartphone, Award, UserCheck, Link2 
} from 'lucide-react';
import { getDrivers, createDriver, assignDriver, getVehicles } from '../services/fleetAPI';
import '../styles/dashboard.css';

export default function NGODrivers({ token, user }) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    driverName: '',
    driverPhone: '',
    licenseNumber: '',
    employeeId: '',
    emergencyContact: '',
    vehicleId: '',
    status: 'AVAILABLE'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [drvRes, vehRes] = await Promise.all([
        getDrivers(token),
        getVehicles(token)
      ]);

      if (drvRes.success) setDrivers(drvRes.drivers || []);
      if (vehRes.success) setVehicles(vehRes.vehicles || []);
    } catch (err) {
      setError('Could not load driver data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await createDriver(formData, token);
      if (res.success) {
        setSuccessMsg(res.message || 'Driver registered successfully!');
        setIsAddModalOpen(false);
        setFormData({
          driverName: '',
          driverPhone: '',
          licenseNumber: '',
          employeeId: '',
          emergencyContact: '',
          vehicleId: '',
          status: 'AVAILABLE'
        });
        fetchData();
      } else {
        setFormError(res.message || 'Failed to register driver.');
      }
    } catch (err) {
      setFormError('Server error registering driver.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVehicleAssignChange = async (driverId, newVehicleId) => {
    try {
      const res = await assignDriver({ driverId, vehicleId: newVehicleId || null }, token);
      if (res.success) {
        setSuccessMsg('Vehicle assignment updated.');
        fetchData();
      } else {
        setError(res.message || 'Could not assign vehicle.');
      }
    } catch (err) {
      setError('Error updating vehicle assignment.');
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
      case 'OFFLINE':
      case 'INACTIVE':
        return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800' }}>{status}</span>;
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
            NGO DISPATCH HUB
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#111827', margin: '0.35rem 0 0 0' }}>
            Driver Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.92rem', margin: '0.25rem 0 0 0' }}>
            Register certified drivers, manage vehicle assignments, and authorize live mobile GPS tracking sessions.
          </p>
        </div>

        <button
          onClick={() => { setFormError(''); setIsAddModalOpen(true); }}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#ffffff', padding: '0.75rem 1.4rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)' }}
        >
          <Plus size={18} strokeWidth={2.6} />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Notices */}
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

      {/* Driver List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', display: 'block', color: '#16a34a' }} />
          <span>Loading drivers list...</span>
        </div>
      ) : drivers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff' }}>
          <div style={{ width: '64px', height: '64px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>No Drivers Registered</h3>
          <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            Register your organization drivers to assign them to food rescue transport trips and enable live GPS tracking.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ background: '#16a34a', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '700' }}
          >
            + Register First Driver
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {drivers.map((d) => (
            <div key={d.id} className="glass-card hover-lift" style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCheck size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#111827', margin: 0 }}>{d.driver_name}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>ID: {d.employee_id || `DRV-${d.id}`}</span>
                    </div>
                  </div>
                  {getStatusBadge(d.status)}
                </div>

                <div style={{ background: '#f9fafb', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.85rem', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Mobile Phone:</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>{d.driver_phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>License Number:</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>{d.license_number || 'On File'}</span>
                  </div>
                  {d.emergency_contact && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Emergency Contact:</span>
                      <span style={{ fontWeight: '700', color: '#111827' }}>{d.emergency_contact}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280' }}>Assigned Vehicle:</span>
                    <span style={{ fontWeight: '800', color: d.vehicle_number ? '#15803d' : '#9ca3af', background: d.vehicle_number ? '#dcfce7' : '#f3f4f6', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {d.vehicle_number ? `🚚 ${d.vehicle_number}` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Control */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', marginBottom: '0.35rem' }}>
                  Link / Change Assigned Vehicle:
                </label>
                <select
                  value={d.vehicle_id || ''}
                  onChange={(e) => handleVehicleAssignChange(d.id, e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.vehicle_type}) - {v.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL: + ADD DRIVER ==================== */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="glass-card" style={{ background: '#ffffff', width: '100%', maxWidth: '520px', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.5rem', borderRadius: '10px' }}>
                  <UserCheck size={22} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827', margin: 0 }}>Register New Driver</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddDriverSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  placeholder="e.g. Ravi Kumar"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Driver Mobile Number *
                  </label>
                  <input
                    type="text"
                    name="driverPhone"
                    value={formData.driverPhone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Driver / Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    placeholder="EMP-902"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="TN-01-2018-0098765"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="+91 98765 00000"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.35rem' }}>
                  Initial Assigned Vehicle
                </label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.92rem' }}
                >
                  <option value="">-- Select Vehicle (Optional) --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.vehicle_type}) - {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#16a34a', color: '#ffffff', fontWeight: '800', border: 'none' }}
                >
                  {formLoading ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

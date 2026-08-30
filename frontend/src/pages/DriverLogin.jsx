import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, KeyRound, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Smartphone, Leaf } from 'lucide-react';
import { driverLogin } from '../services/fleetAPI';
import '../styles/login.css';

export default function DriverLogin({ onLoginSuccess }) {
  const [pairingCode, setPairingCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectedVehicle, setConnectedVehicle] = useState(null);

  const navigate = useNavigate();

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPairingCode(val);
    setError('');
  };

  const handlePairingSubmit = async (e) => {
    e.preventDefault();
    if (!pairingCode || pairingCode.length < 4) {
      return setError('Please enter your complete 6-digit pairing code.');
    }

    setLoading(true);
    setError('');

    try {
      const res = await driverLogin({ code: pairingCode });
      if (res.success && res.token) {
        setConnectedVehicle(res.vehicle);

        const driverUser = {
          id: res.driver.id,
          name: res.driver.name,
          role: 'DRIVER',
          driverId: res.driver.id,
          vehicleId: res.vehicle.id,
          vehicleNumber: res.vehicle.vehicleNumber
        };

        if (onLoginSuccess) {
          onLoginSuccess(res.token, driverUser);
        } else {
          localStorage.setItem('smartsurplus_token', res.token);
          localStorage.setItem('smartsurplus_user', JSON.stringify(driverUser));
        }

        setTimeout(() => {
          navigate('/driver-tracking');
        }, 800);
      } else {
        setError(res.message || 'Invalid or expired pairing code.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-card login-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08)' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#d97706', width: '56px', height: '56px', borderRadius: '16px', marginBottom: '0.75rem' }}>
            <Truck size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#111827', margin: 0 }}>Driver Portal</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.3rem' }}>
            Live GPS Vehicle Pairing & Collection Tracking
          </p>
        </div>

        {/* Success Alert */}
        {connectedVehicle && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>Connected to <strong>{connectedVehicle.vehicleNumber}</strong>! Launching tracking...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePairingSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem', textAlign: 'center' }}>
              ENTER 6-DIGIT PAIRING CODE
            </label>
            
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              maxLength={6}
              placeholder="••••••"
              value={pairingCode}
              onChange={handleCodeChange}
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '2rem',
                fontWeight: '900',
                letterSpacing: '10px',
                textAlign: 'center',
                color: '#92400e',
                background: '#fffbe6',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)'
              }}
            />

            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '0.5rem' }}>
              Ask your facility operator or fleet manager for your temporary pairing key.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || pairingCode.length < 4}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: '700',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#d97706',
              borderColor: '#b45309',
              cursor: (loading || pairingCode.length < 4) ? 'not-allowed' : 'pointer',
              opacity: (loading || pairingCode.length < 4) ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying Code...' : (
              <>
                <KeyRound size={18} /> Connect to Assigned Vehicle <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Security and Privacy Notice */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#16a34a', fontWeight: '600', marginBottom: '0.3rem' }}>
            <ShieldCheck size={14} /> HTTPS Secure Browser Geolocation
          </div>
          GPS location is only shared during active trip sessions.
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <Link to="/login" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
            ← Back to Main SmartSurplus Login
          </Link>
        </div>

      </div>
    </div>
  );
}

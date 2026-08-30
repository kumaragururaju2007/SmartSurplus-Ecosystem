import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Leaf, LogIn, AlertCircle, KeyRound, CheckCircle2, X, Truck, ArrowRight, 
  ShieldCheck, Utensils, Building2, Factory, Eye, EyeOff, Mail, Lock, Sparkles
} from 'lucide-react';
import { loginUser, resetPassword } from '../services/authAPI';
import { driverLogin } from '../services/fleetAPI';
import '../styles/login.css';

const ROLES = [
  { id: 'DONOR', label: 'DONOR', icon: Utensils, desc: '🌱 Food Donor • Hotels, Restaurants & Caterers', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { id: 'NGO', label: 'NGO', icon: Building2, desc: '🏢 Verified NGO • Shelters & Charities', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'BIOGAS', label: 'BIOGAS', icon: Factory, desc: '⚡ Biogas Recovery • Clean Energy Plants', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'ADMIN', label: 'ADMIN', icon: ShieldCheck, desc: '👑 Platform System Administrator', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'DRIVER', label: 'DRIVER', icon: Truck, desc: '🚛 Driver Portal • Dispatch & GPS Key', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' }
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [role, setRole] = useState('DONOR');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
  };

  const handleDriverPairingSubmit = async (e) => {
    e.preventDefault();
    if (!pairingCode || pairingCode.length < 4) {
      return setError('Please enter your 6-digit driver pairing code.');
    }

    setLoading(true);
    setError('');

    try {
      const res = await driverLogin({ code: pairingCode });
      if (res.success && res.token) {
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

        navigate('/driver-tracking');
      } else {
        setError(res.message || 'Invalid or expired pairing code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'DRIVER') {
      return handleDriverPairingSubmit(e);
    }
    setError('');
    setSuccessMsg('');

    if (!email || !email.trim()) {
      return setError('Please enter your email address.');
    }
    if (!password) {
      return setError('Please enter your password.');
    }

    setLoading(true);

    try {
      const res = await loginUser({ email: email.trim(), password, role });
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess(res.token, res.user);
        
        switch (res.user.role) {
          case 'DONOR': navigate('/donor-dashboard'); break;
          case 'NGO': navigate('/ngo-dashboard'); break;
          case 'BIOGAS': navigate('/biogas-dashboard'); break;
          case 'ADMIN': navigate('/admin-dashboard'); break;
          case 'DRIVER': navigate('/driver-tracking'); break;
          default: navigate('/');
        }
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!forgotEmail || !forgotEmail.trim()) {
      return setResetError('Please enter your account email.');
    }
    if (!newPassword || newPassword.length < 4) {
      return setResetError('New password must be at least 4 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setResetError('Passwords do not match.');
    }

    setResetLoading(true);

    try {
      const res = await resetPassword({ email: forgotEmail.trim(), newPassword, role });
      if (res.success) {
        setEmail(forgotEmail.trim());
        setPassword(newPassword);
        setSuccessMsg('Password reset successfully! Please click Login to continue.');
        setShowForgotModal(false);
        setForgotEmail('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetError(res.message || 'Password reset failed.');
      }
    } catch (err) {
      setResetError('Connection error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const currentRoleObj = ROLES.find(r => r.id === role) || ROLES[0];

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        
        {/* Card Header */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Leaf size={28} />
          </div>
          <h2 className="auth-title">SmartSurplus Ecosystem</h2>
          <p className="auth-subtitle">Select your organization role to sign in</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.86rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.86rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 5-Role Selector with ADMIN on the Left of DRIVER */}
        <div className="role-selector-container">
          <div className="role-selector">
            {ROLES.map((r) => {
              const IconComponent = r.icon;
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`role-btn role-${r.id.toLowerCase()} ${isActive ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(r.id)}
                >
                  <IconComponent size={16} />
                  <span>{r.id === 'DRIVER' ? 'DRIVER' : r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Role Descriptive Info Banner */}
          <div 
            className="role-info-banner"
            style={{ 
              background: currentRoleObj.bg, 
              color: currentRoleObj.color, 
              border: `1px solid ${currentRoleObj.border}` 
            }}
          >
            <currentRoleObj.icon size={15} />
            <span>{currentRoleObj.desc}</span>
          </div>
        </div>

        {/* DRIVER PORTAL FORM (Pairing Key) */}
        {role === 'DRIVER' ? (
          <form onSubmit={handleDriverPairingSubmit}>
            <div className="auth-form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <label className="auth-form-label" style={{ justifyContent: 'center', fontSize: '0.88rem', fontWeight: '800' }}>
                6-Digit Vehicle Pairing Key
              </label>
              <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  maxLength={6}
                  placeholder="••••••"
                  value={pairingCode}
                  onChange={(e) => {
                    setPairingCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                    setError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '1.9rem',
                    fontWeight: '900',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    color: '#c2410c',
                    background: '#fff7ed',
                    border: '2px solid #ea580c',
                    borderRadius: '14px',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.12)'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Enter the temporary pairing code generated by your NGO or Biogas dispatch team.
              </span>
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn" 
              style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', boxShadow: '0 10px 20px -5px rgba(234, 88, 12, 0.4)' }}
              disabled={loading || pairingCode.length < 4}
            >
              <KeyRound size={18} />
              <span>{loading ? 'Verifying Pairing Key...' : 'Connect to Vehicle & Start'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link to="/driver-login" style={{ fontSize: '0.84rem', color: '#ea580c', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Open Fullscreen Mobile Driver Portal</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </form>
        ) : (
          /* STANDARD ROLE LOGIN FORM (DONOR, NGO, BIOGAS, ADMIN) */
          <form onSubmit={handleSubmit}>
            
            {/* Email Field */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                <span>Email Address</span>
              </label>
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  className="auth-form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@organization.org"
                  autoComplete="email"
                  required 
                />
                <Mail size={18} className="auth-input-icon" />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-form-group">
              <div className="auth-form-label">
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setResetError('');
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#16a34a',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="auth-form-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required 
                  style={{ paddingRight: '2.85rem' }}
                />
                <Lock size={18} className="auth-input-icon" />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="auth-submit-btn"
              style={{
                background: role === 'ADMIN' 
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                  : role === 'BIOGAS'
                  ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                  : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
              }}
              disabled={loading}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : `Login as ${role}`}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Footer Registration Link */}
        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.88rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '800', color: '#16a34a', textDecoration: 'none' }}>
            Register Organization
          </Link>
        </p>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.25rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#16a34a', fontWeight: '800', fontSize: '1.2rem' }}>
                <KeyRound size={22} />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '1.35rem', lineHeight: '1.5' }}>
              Enter your registered account email and set a new password to restore access immediately.
            </p>

            {resetError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem 0.9rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="auth-form-group">
                <label className="auth-form-label">Account Email</label>
                <input
                  type="email"
                  className="auth-form-input"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. donor@gmail.com"
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-form-label">New Password</label>
                <input
                  type="password"
                  className="auth-form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div className="auth-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="auth-form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="auth-form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.85rem' }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center', padding: '0.85rem' }}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

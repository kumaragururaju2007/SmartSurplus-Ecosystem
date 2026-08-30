import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, User, LogOut, Bell, ArrowRight, Menu, X, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { getNotifications } from '../services/notificationAPI';
import VerifiedDonorBadge from './VerifiedDonorBadge';
import VerifiedBadge from './VerifiedBadge';
import '../styles/navbar.css';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile menu on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function checkNotifications() {
      const token = localStorage.getItem('smartsurplus_token');
      if (token && user) {
        try {
          const res = await getNotifications(token);
          if (res.success && res.notifications) {
            const count = res.notifications.filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0' || n.is_read === false).length;
            setUnreadCount(count);
          }
        } catch (err) {
          // Silent fallback
        }
      }
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);
    const handleUpdate = () => checkNotifications();
    window.addEventListener('notifications_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';
  const isDonor = user?.role === 'DONOR';
  const isBiogas = user?.role === 'BIOGAS';
  const isNGO = user?.role === 'NGO';

  const handleHomeClick = (e) => {
    setMobileMenuOpen(false);
    if (window.location.pathname === '/' || window.location.pathname === '') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <nav className={`navbar ${isAdmin ? 'admin-navbar' : (isDonor || isBiogas || isNGO) ? 'donor-navbar' : ''}`}>
      <div className={`navbar-container ${isAdmin ? 'admin-header' : (isDonor || isBiogas || isNGO) ? 'donor-header' : ''}`}>
        
        {/* Extreme Left Branding */}
        <Link 
          to={isAdmin ? '/admin/overview' : isDonor ? '/donor/dashboard' : isNGO ? '/ngo/dashboard' : isBiogas ? '/biogas-dashboard' : '/'} 
          className="navbar-brand"
          onClick={(!isAdmin && !isDonor && !isBiogas && !isNGO) ? handleHomeClick : undefined}
        >
          <div className="navbar-logo-icon">
            <Leaf size={20} />
          </div>
          <span className="navbar-brand-text">
            {isAdmin ? 'SmartSurplus Ecosystem' : 'SmartSurplus'}
          </span>
        </Link>

        {/* Extreme Right Controls for ADMIN */}
        {isAdmin ? (
          <div className="admin-header-right">
            {/* Notifications Icon with Unread Count Badge */}
            <div className="admin-header-item">
              <Link 
                to="/admin/notifications" 
                className="admin-header-bell"
                title="Platform Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="admin-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Admin Profile Info */}
            <div className="admin-profile-badge">
              <User size={16} />
              <span className="admin-profile-name">
                {user.name || 'Platform Administrator'}
              </span>
            </div>

            {/* Admin Logout Button */}
            <button 
              onClick={handleLogout} 
              className="admin-header-logout-btn"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="admin-logout-label">Logout</span>
            </button>
          </div>
        ) : isNGO ? (
          /* Extreme Right Controls for NGO */
          <div className="donor-header-right">
            {/* Notifications Icon with Unread Count Badge */}
            <div className="donor-header-item">
              <Link 
                to="/ngo/notifications" 
                className="donor-header-bell"
                title="NGO Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="donor-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* NGO Profile Info Badge */}
            <div className="donor-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} />
              <span className="donor-profile-name">
                {user.name || 'NGO Organization'}
              </span>
              <VerifiedBadge 
                type="NGO" 
                isVerified={Boolean(user?.is_verified || user?.isVerified || user?.verification_status === 'VERIFIED')} 
                status={user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING')} 
                iconOnly={true} 
              />
            </div>

            {/* NGO Logout Button */}
            <button 
              onClick={handleLogout} 
              className="donor-header-logout-btn"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="donor-logout-label">Logout</span>
            </button>
          </div>
        ) : isDonor ? (
          /* Extreme Right Controls for DONOR */
          <div className="donor-header-right">
            {/* Notifications Icon with Unread Count Badge */}
            <div className="donor-header-item">
              <Link 
                to="/notifications" 
                className="donor-header-bell"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="donor-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Donor Profile Info Badge */}
            <div className="donor-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} />
              <span className="donor-profile-name">
                {user.name || 'Food Donor'}
              </span>
              <VerifiedBadge 
                type="DONOR" 
                isVerified={Boolean(user?.is_verified || user?.isVerified || user?.verification_status === 'VERIFIED')} 
                status={user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING')} 
                iconOnly={true} 
              />
            </div>

            {/* Donor Logout Button */}
            <button 
              onClick={handleLogout} 
              className="donor-header-logout-btn"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="donor-logout-label">Logout</span>
            </button>
          </div>
        ) : isBiogas ? (
          /* Extreme Right Controls for BIOGAS (Matching Donor Navbar) */
          <div className="donor-header-right">
            {/* Notifications Icon with Unread Count Badge */}
            <div className="donor-header-item">
              <Link 
                to="/notifications" 
                className="donor-header-bell"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="donor-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Biogas Profile Info Badge */}
            <div className="donor-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} />
              <span className="donor-profile-name">
                {user.name || 'Biogas Facility'}
              </span>
              <VerifiedBadge 
                type="BIOGAS" 
                isVerified={Boolean(user?.is_verified || user?.isVerified || user?.verification_status === 'VERIFIED')} 
                status={user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING')} 
                iconOnly={true} 
              />
            </div>

            {/* Biogas Logout Button */}
            <button 
              onClick={handleLogout} 
              className="donor-header-logout-btn"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="donor-logout-label">Logout</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Navigation Links */}
            <ul className="navbar-links navbar-desktop-links">
              <li className="navbar-item">
                <a href="/#home" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
                  Home
                </a>
              </li>
              <li className="navbar-item"><a href="/#how-it-works">How It Works</a></li>
              <li className="navbar-item"><a href="/#smart-matching">Smart Matching</a></li>
              <li className="navbar-item"><a href="/#food-safety">Food Safety</a></li>
              <li className="navbar-item"><a href="/#biogas">Biogas Recovery</a></li>
              <li className="navbar-item"><Link to="/impact">Live Impact</Link></li>
              <li className="navbar-item" style={{ marginLeft: '0.5rem' }}>
                <Link to="/login" className="navbar-get-started-btn">
                  <span>Get Started</span>
                  <ArrowRight size={16} strokeWidth={2.6} />
                </Link>
              </li>
            </ul>

            {/* Mobile Hamburger Toggle Button */}
            <button 
              className="navbar-mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu for Unauthenticated Visitors */}
      {!user && mobileMenuOpen && (
        <div className="navbar-mobile-drawer-overlay">
          <div className="navbar-mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="navbar-mobile-drawer">
            <div className="navbar-mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="navbar-logo-icon" style={{ width: '28px', height: '28px' }}>
                  <Leaf size={16} />
                </div>
                <span style={{ fontWeight: '800', color: '#15803d', fontSize: '1.1rem' }}>SmartSurplus</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="navbar-mobile-close-btn"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <ul className="navbar-mobile-nav-list">
              <li>
                <a href="/#home" onClick={handleHomeClick} className="navbar-mobile-link">
                  Home
                </a>
              </li>
              <li>
                <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#smart-matching" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                  Smart Matching
                </a>
              </li>
              <li>
                <a href="/#food-safety" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                  Food Safety Timers
                </a>
              </li>
              <li>
                <a href="/#biogas" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                  Biogas Recovery
                </a>
              </li>
              <li>
                <Link to="/impact" onClick={() => setMobileMenuOpen(false)} className="navbar-mobile-link">
                  Live Impact Statistics
                </Link>
              </li>
            </ul>

            <div className="navbar-mobile-actions">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)} 
                className="navbar-mobile-btn-primary"
              >
                <LogIn size={18} />
                <span>Sign In / Get Started</span>
              </Link>
              <Link 
                to="/register" 
                onClick={() => setMobileMenuOpen(false)} 
                className="navbar-mobile-btn-secondary"
              >
                <UserPlus size={18} />
                <span>Create New Account</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


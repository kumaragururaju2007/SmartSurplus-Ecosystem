import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Navigation,
  Leaf,
  Bell,
  User,
  Settings,
  LogOut,
  UtensilsCrossed,
  Heart,
  LineChart
} from 'lucide-react';
import VerifiedDonorBadge from './VerifiedDonorBadge';
import VerifiedBadge from './VerifiedBadge';

export default function DonorSidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/donor/dashboard', icon: LayoutDashboard },
    { label: 'Personal Info / Profile', path: '/donor/profile', icon: User },
    { label: 'Create Donation', path: '/donor/create-donation', icon: PlusCircle },
    { label: 'My Donations', path: '/donor/donations', icon: Package },
    { label: 'Donation Analytics', path: '/donor/analytics', icon: LineChart },
    { label: 'Live Tracking', path: '/tracking', icon: Navigation },
    { label: 'Environmental Impact', path: '/impact', icon: Leaf },
    { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '2px 0 12px rgba(0,0,0,0.02)'
    }}>
      {/* Donor Header Badge */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#f0fdf4',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UtensilsCrossed size={22} />
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Food Donor'}</span>
            <VerifiedBadge 
              type="DONOR" 
              isVerified={Boolean(user?.is_verified || user?.isVerified || user?.verification_status === 'VERIFIED')} 
              status={user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING')} 
              iconOnly={true} 
            />
          </div>
          <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
            DONOR PORTAL
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `donor-nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? '#15803d' : '#4b5563',
                background: isActive ? '#f0fdf4' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              })}
            >
              <IconComponent size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            border: 'none',
            background: 'transparent',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

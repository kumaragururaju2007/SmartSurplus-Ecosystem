import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Inbox,
  Handshake,
  Package,
  Truck,
  UserCheck,
  Users,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  HeartHandshake,
  History
} from 'lucide-react';

export default function NGOSidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/ngo/dashboard', icon: LayoutDashboard },
    { label: 'NGO Profile', path: '/ngo/profile', icon: Building2 },
    { label: 'Incoming Requests', path: '/ngo/incoming-requests', icon: Inbox },
    { label: 'Matched Donations', path: '/ngo/matched-donations', icon: Handshake },
    { label: 'Incoming Donations', path: '/ngo/incoming-donations', icon: Package },
    { label: 'Donation History', path: '/ngo/history', icon: History },
    { label: 'Vehicle Fleet', path: '/ngo/vehicles', icon: Truck },
    { label: 'Drivers', path: '/ngo/drivers', icon: UserCheck },
    { label: 'Beneficiaries', path: '/ngo/beneficiaries', icon: Users },
    { label: 'Impact & Analytics', path: '/ngo/impact', icon: BarChart3 },
    { label: 'Reports', path: '/ngo/reports', icon: FileSpreadsheet },
    { label: 'Notifications', path: '/ngo/notifications', icon: Bell },
    { label: 'Settings', path: '/ngo/settings', icon: Settings },
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
      {/* NGO Header Badge */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#f0fdf4',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <HeartHandshake size={22} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'NGO Organization'}
          </div>
          <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
            NGO PORTAL
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
              className={({ isActive }) => `ngo-nav-item ${isActive ? 'active' : ''}`}
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

      {/* Logout Footer */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: '700',
            color: '#dc2626',
            background: '#fef2f2',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

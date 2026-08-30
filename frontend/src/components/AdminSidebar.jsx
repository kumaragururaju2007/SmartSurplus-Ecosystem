import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Factory,
  Utensils,
  ShieldCheck,
  Package,
  Truck,
  MapPin,
  BarChart3,
  Bell,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function AdminSidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orgsExpanded, setOrgsExpanded] = useState(
    location.pathname.includes('/admin/organizations') || location.pathname.includes('/admin/donors') || location.pathname.includes('/admin/ngos') || location.pathname.includes('/admin/biogas')
  );

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
    // Organizations will be rendered with expandable sub-links
    { label: 'Verification Center', path: '/admin/verification', icon: ShieldCheck },
    { label: 'Donations', path: '/admin/donations', icon: Package },
    { label: 'Live Tracking', path: '/admin/live-tracking', icon: Truck },
    { label: 'Platform Map', path: '/admin/map', icon: MapPin },
    { label: 'Activities & Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '270px',
      minWidth: '270px',
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '2px 0 10px rgba(0,0,0,0.02)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Sidebar Header Brand */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #15803d, #166534)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)'
        }}>
          <Shield size={22} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#111827', letterSpacing: '-0.01em' }}>
            SMARTSURPLUS ADMIN
          </div>
          <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '800', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
            CONTROL CENTER
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {/* 1. Overview */}
        <NavLink
          to="/admin/overview"
          className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.7rem 0.9rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: isActive ? '800' : '600',
            color: isActive ? '#15803d' : '#4b5563',
            background: isActive ? '#f0fdf4' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          })}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        {/* 2. Organizations Collapsible Section */}
        <div style={{ margin: '0.2rem 0' }}>
          <div
            onClick={() => setOrgsExpanded(!orgsExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 0.9rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: location.pathname.includes('/admin/organizations') ? '800' : '600',
              color: location.pathname.includes('/admin/organizations') ? '#15803d' : '#4b5563',
              background: location.pathname.includes('/admin/organizations') ? '#f0fdf4' : 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Users size={18} />
              <span>Organizations</span>
            </div>
            {orgsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {/* Submenu for Organizations */}
          {orgsExpanded && (
            <div style={{ paddingLeft: '1.75rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <NavLink
                to="/admin/organizations?type=donors"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: location.search.includes('type=donors') ? '800' : '600',
                  color: location.search.includes('type=donors') ? '#15803d' : '#6b7280',
                  background: location.search.includes('type=donors') ? '#f0fdf4' : 'transparent',
                  textDecoration: 'none'
                })}
              >
                <Utensils size={15} />
                <span>Donors</span>
              </NavLink>

              <NavLink
                to="/admin/organizations?type=ngos"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: location.search.includes('type=ngos') ? '800' : '600',
                  color: location.search.includes('type=ngos') ? '#15803d' : '#6b7280',
                  background: location.search.includes('type=ngos') ? '#f0fdf4' : 'transparent',
                  textDecoration: 'none'
                })}
              >
                <Building2 size={15} />
                <span>NGOs</span>
              </NavLink>

              <NavLink
                to="/admin/organizations?type=biogas"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: location.search.includes('type=biogas') ? '800' : '600',
                  color: location.search.includes('type=biogas') ? '#15803d' : '#6b7280',
                  background: location.search.includes('type=biogas') ? '#f0fdf4' : 'transparent',
                  textDecoration: 'none'
                })}
              >
                <Factory size={15} />
                <span>Biogas Plants</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 3. Other Admin Routes */}
        {navItems.slice(1).map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.7rem 0.9rem',
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

      {/* Admin User Footer / Logout */}
      <div style={{ padding: '0.85rem', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', padding: '0.4rem 0.6rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>
              {user?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {user?.email || 'admin@smartsurplus.org'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '700',
            color: '#dc2626',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

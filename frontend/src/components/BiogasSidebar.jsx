import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Package,
  Navigation,
  Leaf,
  Bell,
  LogOut,
  Zap,
  Clock,
  Truck,
  CheckCircle2,
  Inbox,
  Flame,
  History,
  Wrench,
  FileBarChart2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import { getBiogasRequests } from '../services/biogasAPI';

export default function BiogasSidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ pending: 0, active: 0, completed: 0, alerts: 1 });

  const token = localStorage.getItem('smartsurplus_token');

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      if (!token) return;
      try {
        const res = await getBiogasRequests(token);
        if (res.success && res.wasteRequests && isMounted) {
          const reqs = res.wasteRequests;
          const isPending = (st) => ['OFFERED', 'PENDING', 'REDIRECTED_TO_BIOGAS', 'EXPIRED', 'POSTED'].includes(st);
          const isActive = (st) => ['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'PROCESSING'].includes(st);
          const isCompleted = (st) => ['COMPLETED', 'DELIVERED', 'PROCESSED'].includes(st);

          setCounts({
            pending: reqs.filter(r => isPending(r.match_status || r.status)).length,
            active: reqs.filter(r => isActive(r.match_status || r.status)).length,
            completed: reqs.filter(r => isCompleted(r.match_status || r.status)).length,
            alerts: 1
          });
        }
      } catch (err) {
        // silent fallback
      }
    }
    loadCounts();
    const interval = setInterval(loadCounts, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, location.pathname, location.search]);

  const currentTab = (new URLSearchParams(location.search).get('tab') || '').toUpperCase();
  const currentHash = location.hash;

  const handleSectionClick = (sectionId, fallbackPath) => {
    if (location.pathname === '/biogas-dashboard' || location.pathname === '/biogas/dashboard') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${sectionId}`);
      }
    } else {
      navigate(fallbackPath || `/biogas-dashboard#${sectionId}`);
    }
  };

  const navSections = [
    {
      header: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/biogas-dashboard', icon: LayoutDashboard },
        { label: 'Plant Profile', path: '/biogas/profile', icon: Factory }
      ]
    },
    {
      header: 'WASTE MANAGEMENT',
      items: [
        { 
          label: 'Waste Requests', 
          path: '/biogas/requests?tab=PENDING', 
          tab: 'PENDING',
          icon: Clock, 
          count: counts.pending, 
          badgeColor: '#d97706', 
          badgeBg: '#fef3c7' 
        },
        { 
          label: 'Waste Inventory', 
          path: '/biogas/requests?tab=ACTIVE', 
          tab: 'ACTIVE',
          icon: Package, 
          count: counts.active, 
          badgeColor: '#2563eb', 
          badgeBg: '#dbeafe' 
        },
        { 
          label: 'Waste History', 
          path: '/biogas/requests?tab=COMPLETED', 
          tab: 'COMPLETED',
          icon: History, 
          count: counts.completed, 
          badgeColor: '#16a34a', 
          badgeBg: '#dcfce7' 
        }
      ]
    },
    {
      header: 'OPERATIONS',
      items: [
        { label: 'Live Tracking', path: '/tracking', icon: Navigation },
        { label: 'Vehicles & Fleet', path: '/biogas/fleet', icon: Truck }
      ]
    },
    {
      header: 'IMPACT',
      items: [
        { label: 'Environmental Impact', path: '/impact', icon: Leaf },
        { label: 'Reports & Analytics', path: '/impact/report', icon: FileBarChart2 }
      ]
    },
    {
      header: 'SYSTEM',
      items: [
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Plant Alerts', sectionId: 'plant-alerts', icon: AlertTriangle, count: counts.alerts, badgeColor: '#dc2626', badgeBg: '#fee2e2' }
      ]
    }
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <aside style={{
      width: '265px',
      minWidth: '265px',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '2px 0 12px rgba(0,0,0,0.02)',
      position: 'sticky',
      top: '70px',
      height: 'calc(100vh - 70px)'
    }}>
      {/* Biogas Header Badge */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: '#fff7ed',
          color: '#ea580c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Flame size={22} />
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Biogas Facility'}</span>
            <VerifiedBadge 
              type="BIOGAS" 
              isVerified={Boolean(user?.is_verified || user?.isVerified || user?.verification_status === 'VERIFIED')} 
              status={user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING')} 
              iconOnly={true} 
            />
          </div>
          <span style={{ fontSize: '0.7rem', background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '999px', display: 'inline-block', marginTop: '0.2rem' }}>
            BIOGAS RECOVERY
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', overflowY: 'auto' }}>
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: '0.65rem' }}>
            <div style={{ padding: '0.5rem 0.75rem 0.25rem', fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {section.header}
            </div>

            {section.items.map((item, iIdx) => {
              const IconComponent = item.icon;

              if (item.sectionId) {
                const isActive = (location.pathname === '/biogas-dashboard' || location.pathname === '/biogas/dashboard') && currentHash === `#${item.sectionId}`;

                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => handleSectionClick(item.sectionId, `/biogas-dashboard#${item.sectionId}`)}
                    className={`biogas-nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      fontWeight: isActive ? '800' : '600',
                      color: isActive ? '#ea580c' : '#475569',
                      background: isActive ? '#fff7ed' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      borderLeft: isActive ? '3.5px solid #ea580c' : '3.5px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <IconComponent size={18} color={isActive ? '#ea580c' : '#64748b'} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== undefined && item.count > 0 && (
                      <span style={{
                        background: isActive ? '#ea580c' : item.badgeBg,
                        color: isActive ? 'white' : item.badgeColor,
                        padding: '0.12rem 0.48rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '800'
                      }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              }

              const isLinkActive = item.tab
                ? location.pathname === '/biogas/requests' && currentTab === item.tab
                : location.pathname === item.path;

              return (
                <NavLink
                  key={item.path + (item.tab || '')}
                  to={item.path}
                  className={`biogas-nav-item ${isLinkActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: isLinkActive ? '800' : '600',
                    color: isLinkActive ? '#ea580c' : '#475569',
                    background: isLinkActive ? '#fff7ed' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    borderLeft: isLinkActive ? '3.5px solid #ea580c' : '3.5px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <IconComponent size={18} color={isLinkActive ? '#ea580c' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span style={{
                      background: isLinkActive ? '#ea580c' : item.badgeBg,
                      color: isLinkActive ? 'white' : item.badgeColor,
                      padding: '0.12rem 0.48rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}>
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.85rem',
            border: 'none',
            background: 'transparent',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.86rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

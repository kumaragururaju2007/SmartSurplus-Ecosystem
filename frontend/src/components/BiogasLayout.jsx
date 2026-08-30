import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BiogasSidebar from './BiogasSidebar';
import { Menu, X } from 'lucide-react';

export default function BiogasLayout({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (mainEl) {
      mainEl.classList.add('donor-portal-full-bleed');
    }
    return () => {
      if (mainEl) {
        mainEl.classList.remove('donor-portal-full-bleed');
      }
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 70px)',
      width: '100vw',
      maxWidth: '100%',
      margin: 0,
      padding: 0,
      background: '#f8fafc',
      position: 'relative',
      left: 0
    }}>
      {/* Desktop Sidebar (attached at left edge x=0) */}
      <div className="biogas-sidebar-desktop" style={{ display: 'flex' }}>
        <BiogasSidebar user={user} onLogout={onLogout} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1050,
          display: 'flex'
        }}>
          <div style={{
            width: '280px',
            maxWidth: '85vw',
            height: '100%',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            animation: 'pageEnter 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <button 
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '0.35rem', display: 'flex', alignItems: 'center' }}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <BiogasSidebar user={user} onLogout={onLogout} />
            </div>
          </div>
          <div style={{ flex: 1 }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Biogas Content Container */}
      <main className="portal-main-content" style={{
        flex: 1,
        padding: '2rem 2.5rem',
        overflowY: 'auto',
        minWidth: 0,
        width: '100%'
      }}>
        {/* Mobile Toggle Button Header (Visible on small screens) */}
        <div className="biogas-mobile-toggle" style={{ display: 'none', marginBottom: '1rem' }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', borderRadius: '10px' }}
          >
            <Menu size={18} /> Biogas Navigation Menu
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}


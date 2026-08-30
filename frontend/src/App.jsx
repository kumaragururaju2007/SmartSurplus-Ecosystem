import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NGOLayout from './components/NGOLayout';
import AdminLayout from './components/AdminLayout';
import DonorLayout from './components/DonorLayout';
import BiogasLayout from './components/BiogasLayout';
import MobileNotificationPopup from './components/MobileNotificationPopup';

// Public & Donor Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import DonorProfile from './pages/DonorProfile';
import MyDonations from './pages/MyDonations';
import DonorAnalytics from './pages/DonorAnalytics';
import CreateDonation from './pages/CreateDonation';
import DonationDetails from './pages/DonationDetails';
import MatchingResult from './pages/MatchingResult';

// NGO Pages
import NGODashboard from './pages/NGODashboard';
import NGOProfile from './pages/NGOProfile';
import NGOIncomingRequests from './pages/NGOIncomingRequests';
import NGOMatchedDonations from './pages/NGOMatchedDonations';
import NGOIncomingDonations from './pages/NGOIncomingDonations';
import NGOHistory from './pages/NGOHistory';
import NGOVehicles from './pages/NGOVehicles';
import NGODrivers from './pages/NGODrivers';
import NGOBeneficiaries from './pages/NGOBeneficiaries';
import NGOImpact from './pages/NGOImpact';
import NGOReports from './pages/NGOReports';
import NGONotifications from './pages/NGONotifications';
import NGOSettings from './pages/NGOSettings';
import NGODonationDetails from './pages/NGODonationDetails';
import DriverTracking from './pages/DriverTracking';

// Biogas Pages
import BiogasDashboard from './pages/BiogasDashboard';
import BiogasProfile from './pages/BiogasProfile';
import BiogasRequests from './pages/BiogasRequests';
import BiogasRequestDetails from './pages/BiogasRequestDetails';
import BiogasVehicles from './pages/BiogasVehicles';
import DriverLogin from './pages/DriverLogin';

// Reconstructed Admin Control Center Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminOrganizationDetails from './pages/admin/AdminOrganizationDetails';
import AdminVerificationCenter from './pages/admin/AdminVerificationCenter';
import AdminDonations from './pages/admin/AdminDonations';
import AdminLiveTracking from './pages/admin/AdminLiveTracking';
import AdminPlatformMap from './pages/admin/AdminPlatformMap';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSettings from './pages/admin/AdminSettings';

// General Authenticated & Public Ecosystem Pages
import Tracking from './pages/Tracking';
import FullscreenTrackingMap from './pages/FullscreenTrackingMap';
import ImpactDashboard from './pages/ImpactDashboard';
import ImpactReport from './pages/ImpactReport';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import { getProfile } from './services/authAPI';

import './styles/global.css';

// Protected Route Component
function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }} className="glass-card">
        <h2 style={{ color: '#dc2626', fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          You do not have permission to access this resource. Required role: <strong>{allowedRoles.join(' or ')}</strong>.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex' }}>Return to Home Page</Link>
      </div>
    );
  }

  return children;
}

function PortalLayoutWrapper({ user, onLogout, children }) {
  if (user?.role === 'DONOR') {
    return <DonorLayout user={user} onLogout={onLogout}>{children}</DonorLayout>;
  }
  if (user?.role === 'BIOGAS') {
    return <BiogasLayout user={user} onLogout={onLogout}>{children}</BiogasLayout>;
  }
  if (user?.role === 'NGO') {
    return <NGOLayout user={user} onLogout={onLogout}>{children}</NGOLayout>;
  }
  if (user?.role === 'ADMIN') {
    return <AdminLayout user={user} onLogout={onLogout}>{children}</AdminLayout>;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartsurplus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('smartsurplus_token') || '');

  // Live profile synchronization to keep verified status, badge, and organization name fresh
  useEffect(() => {
    if (!token || !user) return;

    let isMounted = true;
    const syncProfile = async () => {
      try {
        const res = await getProfile(token);
        if (res && res.success && res.user && isMounted) {
          setUser(prev => {
            if (!prev) return prev;
            const isVerified = Boolean(res.user.isVerified || res.user.is_verified || res.user.verification_status === 'VERIFIED');
            const updated = {
              ...prev,
              ...res.user,
              is_verified: isVerified ? 1 : 0,
              isVerified,
              verification_status: res.user.verification_status || (isVerified ? 'VERIFIED' : 'PENDING'),
              name: res.user.name || prev.name
            };
            localStorage.setItem('smartsurplus_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        // silent fallback
      }
    };

    syncProfile();
    const interval = setInterval(syncProfile, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('smartsurplus_token', newToken);
    localStorage.setItem('smartsurplus_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('smartsurplus_token');
    localStorage.removeItem('smartsurplus_user');
  };

  return (
    <Router>
      <div className="app-container">
        {/* Real-time Mobile & Responsive Toast Notification Popup */}
        <MobileNotificationPopup user={user} token={token} />

        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="main-content" style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/driver-login" element={<DriverLogin onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/driver-tracking" element={<DriverTracking token={token} />} />
            <Route path="/driver/trip/:tripId" element={<DriverTracking token={token} />} />
            
            {/* DONOR Protected Routes (Wrapped in DonorLayout with Vertical Left Sidebar) */}
            <Route path="/donor/dashboard" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <DonorDashboard user={user} token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/donor/donations" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <MyDonations user={user} token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/donor/analytics" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <DonorAnalytics user={user} token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/donor-dashboard" element={<Navigate to="/donor/dashboard" replace />} />
            
            <Route path="/donor/create-donation" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <CreateDonation token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/donor/donation/:id" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <DonationDetails token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/donations/:id" element={
              <ProtectedRoute user={user}>
                <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                  <DonationDetails token={token} />
                </PortalLayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/donor/matching/:id" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <MatchingResult token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            {/* NGO Protected Routes (Wrapped in NGOLayout with Left Sidebar) */}
            <Route path="/ngo-dashboard" element={<Navigate to="/ngo/dashboard" replace />} />

            <Route path="/ngo/dashboard" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGODashboard user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/profile" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOProfile user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/incoming-requests" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOIncomingRequests user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/matched-donations" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOMatchedDonations user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/incoming-donations" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOIncomingDonations user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/history" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOHistory user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/vehicles" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOVehicles token={token} user={user} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/drivers" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGODrivers token={token} user={user} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/beneficiaries" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOBeneficiaries user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/impact" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOImpact user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/reports" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOReports user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/notifications" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGONotifications user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/settings" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGOSettings user={user} token={token} onLogout={handleLogout} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            <Route path="/ngo/donations/:id" element={
              <ProtectedRoute user={user} allowedRoles={['NGO', 'ADMIN']}>
                <NGOLayout user={user} onLogout={handleLogout}>
                  <NGODonationDetails user={user} token={token} />
                </NGOLayout>
              </ProtectedRoute>
            } />

            {/* Biogas Protected Routes */}
            <Route path="/biogas-dashboard" element={
              <ProtectedRoute user={user} allowedRoles={['BIOGAS', 'ADMIN']}>
                <BiogasLayout user={user} onLogout={handleLogout}>
                  <BiogasDashboard user={user} token={token} />
                </BiogasLayout>
              </ProtectedRoute>
            } />

            <Route path="/biogas/profile" element={
              <ProtectedRoute user={user} allowedRoles={['BIOGAS', 'ADMIN']}>
                <BiogasLayout user={user} onLogout={handleLogout}>
                  <BiogasProfile user={user} token={token} />
                </BiogasLayout>
              </ProtectedRoute>
            } />

            <Route path="/biogas/requests" element={
              <ProtectedRoute user={user} allowedRoles={['BIOGAS', 'ADMIN']}>
                <BiogasLayout user={user} onLogout={handleLogout}>
                  <BiogasRequests user={user} token={token} />
                </BiogasLayout>
              </ProtectedRoute>
            } />

            <Route path="/biogas/requests/:id" element={
              <ProtectedRoute user={user} allowedRoles={['BIOGAS', 'ADMIN']}>
                <BiogasLayout user={user} onLogout={handleLogout}>
                  <BiogasRequestDetails token={token} />
                </BiogasLayout>
              </ProtectedRoute>
            } />

            <Route path="/biogas/fleet" element={
              <ProtectedRoute user={user} allowedRoles={['BIOGAS', 'ADMIN']}>
                <BiogasLayout user={user} onLogout={handleLogout}>
                  <BiogasVehicles token={token} user={user} />
                </BiogasLayout>
              </ProtectedRoute>
            } />

            {/* Platform Administrator Control Center Routes */}
            <Route path="/admin-dashboard" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

            <Route path="/admin/overview" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminOverview token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/organizations" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminOrganizations token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/organizations/:id" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminOrganizationDetails token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/organizations/:type/:id" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminOrganizationDetails token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/verification" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminVerificationCenter token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/verifications" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminVerificationCenter token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/donations" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminDonations token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/live-tracking" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminLiveTracking token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/tracking" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminLiveTracking token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/map" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminPlatformMap token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/analytics" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminAnalytics token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/notifications" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminNotifications token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/reports" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminReports token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/audit-logs" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminAuditLogs token={token} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/settings" element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminSettings user={user} token={token} onLogout={handleLogout} />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Public Fullscreen Ecosystem Tracking Map (Accessible to All Visitors & Portals) */}
            <Route path="/tracking-map" element={<FullscreenTrackingMap user={user} />} />
            <Route path="/ecosystem-map" element={<FullscreenTrackingMap user={user} />} />

            {/* General Authenticated & Public Routes */}
            <Route path="/tracking" element={<FullscreenTrackingMap user={user} />} />
            <Route path="/donor/tracking" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <Tracking token={token} user={user} />
                </DonorLayout>
              </ProtectedRoute>
            } />
            <Route path="/tracking/:id" element={
              <ProtectedRoute user={user}>
                <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                  <Tracking token={token} user={user} />
                </PortalLayoutWrapper>
              </ProtectedRoute>
            } />
            
            <Route path="/impact" element={
              <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                <ImpactDashboard />
              </PortalLayoutWrapper>
            } />
            <Route path="/donor/impact" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <ImpactDashboard />
                </DonorLayout>
              </ProtectedRoute>
            } />
            <Route path="/impact/report" element={
              <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                <ImpactReport token={token} />
              </PortalLayoutWrapper>
            } />
            
            <Route path="/driver/tracking/:tripId" element={<DriverTracking token={token} />} />
            <Route path="/driver/tracking" element={<DriverTracking token={token} />} />
            <Route path="/driver-tracking" element={<DriverTracking token={token} />} />
            
            <Route path="/notifications" element={
              <ProtectedRoute user={user}>
                <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                  <Notifications token={token} />
                </PortalLayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/donor/notifications" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <Notifications token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute user={user}>
                <PortalLayoutWrapper user={user} onLogout={handleLogout}>
                  <Profile user={user} />
                </PortalLayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/donor/profile" element={
              <ProtectedRoute user={user} allowedRoles={['DONOR', 'ADMIN']}>
                <DonorLayout user={user} onLogout={handleLogout}>
                  <DonorProfile user={user} token={token} />
                </DonorLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!['DONOR', 'NGO', 'ADMIN'].includes(user?.role) && <Footer />}
      </div>
    </Router>
  );
}

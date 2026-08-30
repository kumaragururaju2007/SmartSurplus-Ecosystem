import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderTop: '1px solid #e5e7eb',
      padding: '3rem 1.5rem 1.5rem',
      marginTop: 'auto',
      color: '#374151'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            <Leaf size={22} />
            <span>SmartSurplus</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: '1.5' }}>
            SmartSurplus connects excess edible food with verified NGOs through intelligent matching, real-time tracking, and automated biogas recovery workflows.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
            <li><a href="#home" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</a></li>
            <li><a href="#how-it-works" style={{ color: '#4b5563', textDecoration: 'none' }}>How It Works</a></li>
            <li><a href="#features" style={{ color: '#4b5563', textDecoration: 'none' }}>Features</a></li>
            <li><a href="#impact" style={{ color: '#4b5563', textDecoration: 'none' }}>Impact</a></li>
            <li><Link to="/login" style={{ color: '#4b5563', textDecoration: 'none' }}>Login</Link></li>
            <li><Link to="/register" style={{ color: '#15803d', fontWeight: '600', textDecoration: 'none' }}>Register</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>Platform</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: '#4b5563' }}>
            <li>Food Donors</li>
            <li>NGO Shelters</li>
            <li>Biogas Facilities</li>
            <li>Platform Admin</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>Technology</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: '#4b5563' }}>
            <li>Smart Matching Engine</li>
            <li>OpenStreetMap & Leaflet</li>
            <li>Real-Time Tracking</li>
            <li>Multi-Channel Notifications</li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.82rem', color: '#9ca3af' }}>
        <span>© {new Date().getFullYear()} SmartSurplus Ecosystem. All rights reserved.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          Built with <Heart size={14} color="#ef4444" fill="#ef4444" /> for Zero Food Waste & Clean Energy.
        </span>
      </div>
    </footer>
  );
}

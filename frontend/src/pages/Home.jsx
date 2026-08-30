import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, Heart, Zap, Clock, ShieldCheck, MapPin, Compass, ArrowRight, 
  CheckCircle2, Users, Building, Factory, ShieldAlert, Cpu, Bell, 
  Mail, Smartphone, BarChart3, Lock, Settings, Utensils, Building2, Sparkles,
  ChevronDown
} from 'lucide-react';
import Map from '../components/Map';
import EcosystemFlow from '../components/EcosystemFlow';
import '../styles/home.css';

export default function Home() {
  // Real-time Database Impact Metrics
  const [impactStats, setImpactStats] = useState({
    totalDonations: 0,
    completedDonations: 0,
    foodRescuedKg: 0,
    mealsSupported: 0,
    wasteDivertedKg: 0,
    biogasGeneratedM3: 0,
    co2SavedKg: 0,
    landfillDiversionRate: 0,
    impactScore: 0,
    scoreBadge: 'STANDARD'
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Live Map Markers State
  const [mapMarkers, setMapMarkers] = useState([]);
  const [activeMapLayer, setActiveMapLayer] = useState('ALL');
  const [mapLoading, setMapLoading] = useState(true);

  // Fetch real statistics from database API
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/impact/summary');
        const data = await res.json();
        if (data && data.success && data.summary) {
          setImpactStats(data.summary);
        }
      } catch (err) {
        console.error('Error fetching authentic impact data:', err);
      } finally {
        setLoadingStats(false);
      }
    }

    async function loadMapMarkers() {
      try {
        const res = await fetch('/api/donations/map/markers');
        const data = await res.json();
        if (data && data.success && data.markers) {
          const list = [];
          if (data.markers.donors) {
            data.markers.donors.forEach(d => {
              if (d.hasValidLocation) {
                list.push({
                  lat: d.lat,
                  lng: d.lng,
                  type: 'DONOR',
                  name: d.name,
                  businessType: d.business_type,
                  address: d.address
                });
              }
            });
          }
          if (data.markers.ngos) {
            data.markers.ngos.forEach(n => {
              if (n.hasValidLocation) {
                list.push({
                  lat: n.lat,
                  lng: n.lng,
                  type: 'NGO',
                  name: n.name,
                  foodCapacity: `${n.food_capacity || 150} Meals`,
                  address: n.address
                });
              }
            });
          }
          if (data.markers.biogasPlants) {
            data.markers.biogasPlants.forEach(b => {
              if (b.hasValidLocation) {
                list.push({
                  lat: b.lat,
                  lng: b.lng,
                  type: 'BIOGAS',
                  name: b.name,
                  processingCapacity: `${b.processing_capacity || 500} kg/day`,
                  address: b.address
                });
              }
            });
          }
          if (data.markers.activeDonations) {
            data.markers.activeDonations.forEach(don => {
              if (don.hasValidLocation) {
                list.push({
                  lat: don.lat,
                  lng: don.lng,
                  type: 'DONATION',
                  name: `📦 ${don.food_name} (${don.quantity} ${don.quantity_unit || 'Meals'})`,
                  businessType: `Status: ${don.status}`,
                  address: don.pickup_address
                });
              }
            });
          }
          setMapMarkers(list);
        }
      } catch (err) {
        console.error('Error loading public map markers:', err);
      } finally {
        setMapLoading(false);
      }
    }

    loadStats();
    loadMapMarkers();
  }, []);

  // Standard Food Safety Guidelines Category Selector
  const [selectedCategory, setSelectedCategory] = useState('Cooked Gravy');
  const safetyRules = {
    'Cooked Gravy': { time: '2 Hours', temp: 'Maintain > 60°C or < 5°C', detail: 'High moisture dishes require immediate redistribution within 2 hours.' },
    'Cooked Rice & Meals': { time: '4 Hours', temp: 'Covered insulated containers', detail: 'Standard cooked meals remain food-safe for up to 4 hours after preparation.' },
    'Bakery & Dry Breads': { time: '8 Hours', temp: 'Ambient dry storage', detail: 'Packaged bakery and bread products have up to an 8-hour collection window.' },
    'Raw Produce / Veggies': { time: '12 Hours', temp: 'Cool ventilated crates', detail: 'Fresh surplus vegetables & fruits must be collected within 12 hours.' }
  };

  return (
    <div id="home" className="home-page-container">
      
      {/* ==================== 100% FULL-WIDTH VIEWPORT HERO SECTION ==================== */}
      <section className="home-hero hero-with-video">
        {/* Looping Humanity / Helping Poor Background Video */}
        <div className="hero-video-container">
          <video
            className="hero-video-element"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/helping-poor.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="hero-video-overlay"></div>
          <div className="hero-video-glow"></div>
        </div>

        {/* Centered Hero Content Overlay (Constrained to 1200px) */}
        <div className="hero-content-wrapper">
          <div className="hero-live-badge">
            <span className="live-pulse-dot"></span>
            <span>Smart Surplus Redistribution & Clean Energy Platform 🌿</span>
          </div>

          <h1 className="hero-title">
            SMARTSURPLUS ECOSYSTEM
          </h1>
          
          <p className="hero-tagline">
            "Every surplus has a smarter destination."
          </p>

          <p className="hero-description">
            Connecting surplus food with verified NGOs using intelligent proximity matching, real-time dispatch tracking, and strict food safety collection windows — while automatically redirecting uncollected surplus into clean biogas energy.
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="hero-btn-primary">
              <span>Donate Surplus</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="hero-btn-secondary">
              <span>Explore How It Works</span>
            </a>
          </div>

          <a href="#metrics" className="hero-scroll-indicator" aria-label="Scroll to discover impact metrics">
            <span>Scroll to explore</span>
            <ChevronDown size={20} className="scroll-chevron-bounce" />
          </a>
        </div>
      </section>

      {/* ==================== HOME BODY CONTENT (CONSTRAINED TO 1200PX) ==================== */}
      <div className="home-body-content">
        
        {/* ==================== AUTHENTIC LIVE METRICS RIBBON ==================== */}
        <div id="metrics" className="hero-metrics-ribbon">
        <div className="metric-card hover-lift">
          <div className="metric-number">
            {loadingStats ? '...' : impactStats.mealsSupported.toLocaleString()}
          </div>
          <div className="metric-label">Meals Rescued 🍲</div>
        </div>
        <div className="metric-card hover-lift">
          <div className="metric-number">
            {loadingStats ? '...' : `${impactStats.wasteDivertedKg.toLocaleString()} kg`}
          </div>
          <div className="metric-label">Waste Diverted to Biogas 🌿</div>
        </div>
        <div className="metric-card hover-lift">
          <div className="metric-number">
            {loadingStats ? '...' : `${impactStats.completedDonations} / ${impactStats.totalDonations}`}
          </div>
          <div className="metric-label">Completed Listings ⚡</div>
        </div>
        <div className="metric-card hover-lift">
          <div className="metric-number">
            {loadingStats ? '...' : `${impactStats.landfillDiversionRate}%`}
          </div>
          <div className="metric-label">Landfill Diversion Rate 🔄</div>
        </div>
      </div>

      {/* ==================== 5. INTERACTIVE ECOSYSTEM FLOW VISUAL ==================== */}
      <section id="ecosystem-flow" style={{ marginTop: '0.5rem' }}>
        <EcosystemFlow />
      </section>

      {/* ==================== QUICK GATEWAYS / OPTIONS ==================== */}
      <section id="options">
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#15803d', background: '#f0fdf4' }}>
            Choose Your Gateway
          </span>
          <h2 className="section-title">
            Get Started with SmartSurplus
          </h2>
          <p className="section-subtitle">
            Select your organization category to access dedicated tools, real-time matching, and verified compliance workflows.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          
          {/* Option 1: Food Donor */}
          <div className="gateway-card donor-card hover-lift">
            <div>
              <div className="gateway-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Utensils size={28} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563eb', background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                1st • Food Donors
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: '0.6rem 0 0.4rem 0' }}>
                Hotels & Restaurants
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '1.5rem' }}>
                List surplus cooked or packaged meals in seconds. Track real-time shelter pickups, reduce wastage, and obtain verifiable donation receipts.
              </p>
            </div>
            <Link to="/register" className="btn-primary" style={{ background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none' }}>
              <span>Donate Food Surplus</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Option 2: NGO / Shelter */}
          <div className="gateway-card ngo-card hover-lift">
            <div>
              <div className="gateway-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <Building2 size={28} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                2nd • Verified NGOs
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: '0.6rem 0 0.4rem 0' }}>
                Shelters & Charities
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '1.5rem' }}>
                Receive automated, proximity-ranked surplus food matches. Accept incoming listings, coordinate collections, and feed communities.
              </p>
            </div>
            <Link to="/register" className="btn-primary" style={{ background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none' }}>
              <span>Register NGO Shelter</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Option 3: Biogas Recovery */}
          <div className="gateway-card biogas-card hover-lift">
            <div>
              <div className="gateway-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
                <Factory size={28} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b45309', background: '#fffbeb', padding: '0.25rem 0.75rem', borderRadius: '999px', textTransform: 'uppercase' }}>
                3rd • Biogas Plants
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: '0.6rem 0 0.4rem 0' }}>
                Clean Energy Facilities
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.55', marginBottom: '1.5rem' }}>
                Receive automatic pipeline redirection of uncollected surplus. Transform food waste into clean CBG, electricity, and organic fertilizers.
              </p>
            </div>
            <Link to="/register" className="btn-primary" style={{ background: '#d97706', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none' }}>
              <span>Register Biogas Plant</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ==================== 6. PROBLEM SECTION ==================== */}
      <section id="problem">
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#dc2626', background: '#fef2f2' }}>
            Current Operational Gap
          </span>
          <h2 className="section-title">
            The Food Surplus Dilemma
          </h2>
          <p className="section-subtitle">
            Large quantities of usable surplus food remain unrescued because donors, NGOs, and clean energy facilities are disconnected.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card hover-lift" style={{ borderLeft: '5px solid #ef4444', background: '#ffffff' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.75rem' }}>
              <ShieldAlert size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.4rem' }}>
              FOOD SURPLUS
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: '1.55' }}>
              Usable food often remains uncollected due to fragmented communication channels and manual coordination barriers.
            </p>
          </div>

          <div className="glass-card hover-lift" style={{ borderLeft: '5px solid #f59e0b', background: '#ffffff' }}>
            <div style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>
              <Clock size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.4rem' }}>
              TIME SENSITIVITY
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: '1.55' }}>
              Prepared dishes have strict safe consumption windows before perishability risks compromise edible quality.
            </p>
          </div>

          <div className="glass-card hover-lift" style={{ borderLeft: '5px solid #6b7280', background: '#ffffff' }}>
            <div style={{ color: '#6b7280', marginBottom: '0.75rem' }}>
              <Leaf size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.4rem' }}>
              LANDFILL DAMAGE
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: '1.55' }}>
              Uncollected food decays in landfills, generating hazardous methane emissions and wasting valuable environmental resources.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 7. SOLUTION SECTION ==================== */}
      <section id="solution" className="glass-card" style={{ background: '#f8fafc', padding: '3.5rem 2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#15803d', background: '#f0fdf4' }}>
            Closed-Loop Solution
          </span>
          <h2 className="section-title">
            One Platform. Two Smart Destinations.
          </h2>
          <p className="section-subtitle">
            SmartSurplus first prioritizes human consumption by connecting food donors with verified local shelters. If the safe collection deadline expires, the system automatically routes the food to registered biogas recovery facilities.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div className="hover-lift" style={{ background: 'white', padding: '2rem', borderRadius: '18px', border: '1px solid #e5e7eb', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#16a34a' }}>
              <CheckCircle2 size={26} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>Destination A: NGO Redistribution</h3>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              When food is freshly listed, our rule-based matching engine immediately pairs the listing with the highest-scoring verified NGO shelter.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f0fdf4', padding: '0.95rem', borderRadius: '12px', fontSize: '0.92rem', color: '#15803d', fontWeight: '800' }}>
              <span>FOOD</span> ➔ <span>NGO</span> ➔ <span>COMMUNITY 🍲</span>
            </div>
          </div>

          <div className="hover-lift" style={{ background: 'white', padding: '2rem', borderRadius: '18px', border: '1px solid #e5e7eb', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#d97706' }}>
              <Zap size={26} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>Destination B: Biogas Energy</h3>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#6b7280', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              If NGO pickup cannot occur within the food safety timer, the listing is automatically redirected to nearby anaerobic digesters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fffbe6', padding: '0.95rem', borderRadius: '12px', fontSize: '0.92rem', color: '#b45309', fontWeight: '800' }}>
              <span>FOOD</span> ➔ <span>BIOGAS</span> ➔ <span>CLEAN ENERGY ⚡</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. HOW SMARTSURPLUS WORKS ==================== */}
      <section id="how-it-works">
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#0284c7', background: '#e0f2fe' }}>
            Step-by-Step Architecture
          </span>
          <h2 className="section-title">
            How SmartSurplus Works
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            { step: 'STEP 1', title: 'Create Surplus Listing', desc: 'Donor posts food category, quantity, address, and pinpoint location.', icon: <Building size={22} color="#15803d" /> },
            { step: 'STEP 2', title: 'Smart Matching', desc: 'Engine scores nearby shelters by distance, capacity, urgency, and response.', icon: <Cpu size={22} color="#0284c7" /> },
            { step: 'STEP 3', title: 'NGO Acceptance', desc: 'Top-ranked verified NGO receives notification and accepts the donation.', icon: <Heart size={22} color="#ec4899" /> },
            { step: 'STEP 4', title: 'Pickup & Tracking', desc: 'Live OpenStreetMap route tracking handles collection workflow.', icon: <Compass size={22} color="#8b5cf6" /> },
            { step: 'STEP 5', title: 'Impact or Biogas', desc: 'Delivery logs social impact, or expired food transforms into biogas.', icon: <Zap size={22} color="#d97706" /> }
          ].map((item, idx) => (
            <div key={idx} className="glass-card hover-lift" style={{ background: '#ffffff', padding: '1.35rem', borderTop: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                  {item.step}
                </span>
                {item.icon}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '0.4rem' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#6b7280', lineHeight: '1.5' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 9. SMART MATCHING SECTION ==================== */}
      <section id="smart-matching" className="glass-card" style={{ background: '#ffffff', padding: '3.5rem 2.5rem', borderRadius: '24px' }}>
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#15803d', background: '#f0fdf4' }}>
            Intelligent Allocation
          </span>
          <h2 className="section-title">
            Smart Matching, Not Just Matching.
          </h2>
          <p className="section-subtitle">
            SmartSurplus ranks suitable NGOs using a weighted scoring algorithm to maximize redistribution efficiency and minimize food transit time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { factor: 'Distance', weight: '25%', text: 'Proximity via Haversine geographic calculation' },
            { factor: 'Capacity', weight: '20%', text: 'Daily NGO capacity vs donation quantity' },
            { factor: 'Urgency', weight: '25%', text: 'Food safety timer remaining window' },
            { factor: 'Availability', weight: '15%', text: 'Active operational status & verification' },
            { factor: 'Response History', weight: '15%', text: 'Historical acceptance & pickup reliability' }
          ].map((f, i) => (
            <div key={i} className="hover-lift" style={{ background: '#f8fafc', padding: '1.25rem 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#15803d', display: 'block' }}>{f.weight}</span>
              <strong style={{ fontSize: '0.95rem', color: '#111827', display: 'block', margin: '0.25rem 0' }}>{f.factor}</strong>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#f0fdf4', padding: '1.75rem', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #16a34a' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#15803d', marginBottom: '0.75rem' }}>
            Rule-Based AI / Smart Matching Engine Visual
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', fontWeight: '800', color: '#111827', fontSize: '0.98rem' }}>
            <span style={{ background: 'white', padding: '0.65rem 1.35rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>DONATION</span>
            <span style={{ color: '#16a34a' }}>➔</span>
            <span style={{ background: '#15803d', color: 'white', padding: '0.65rem 1.35rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)' }}>SMART MATCHING ENGINE</span>
            <span style={{ color: '#16a34a' }}>➔</span>
            <span style={{ background: 'white', padding: '0.65rem 1.35rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>BEST SUITABLE NGO</span>
          </div>
        </div>
      </section>

      {/* ==================== 10. FOOD SAFETY SECTION ==================== */}
      <section id="food-safety" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
        <div>
          <span className="section-pill" style={{ color: '#dc2626', background: '#fef2f2', marginBottom: '0.5rem' }}>
            Safety First Policy
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '800', marginTop: '0.5rem', color: '#111827', lineHeight: '1.25' }}>
            Operational Food Safety Window.
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.02rem', margin: '1rem 0 1.5rem', lineHeight: '1.65' }}>
            Each surplus category follows standardized safety handling time limits. If safe human collection cannot be completed before the limit expires, the system automatically redirects the listing to clean biogas conversion.
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {Object.keys(safetyRules).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  border: selectedCategory === cat ? '1.5px solid #16a34a' : '1px solid #d1d5db',
                  background: selectedCategory === cat ? '#f0fdf4' : '#ffffff',
                  color: selectedCategory === cat ? '#15803d' : '#4b5563',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: '800', color: '#111827', fontSize: '0.95rem' }}>{selectedCategory}</span>
              <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                Safe Window: {safetyRules[selectedCategory].time}
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#6b7280', margin: '0 0 0.3rem 0' }}>{safetyRules[selectedCategory].detail}</p>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>✓ {safetyRules[selectedCategory].temp}</span>
          </div>
        </div>

        <div className="safety-clock-card hover-lift">
          <span style={{ fontSize: '0.82rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>
            Selected Category Safety Window
          </span>
          <div className="safety-clock-display" style={{ fontSize: '2.8rem' }}>
            {safetyRules[selectedCategory].time}
          </div>
          <span style={{ fontSize: '0.88rem', color: '#d1d5db', background: 'rgba(255,255,255,0.1)', padding: '0.45rem 1rem', borderRadius: '8px', display: 'inline-block' }}>
            Maximum Safe Human Collection Period
          </span>
          <p style={{ fontSize: '0.84rem', color: '#9ca3af', marginTop: '1.25rem' }}>
            Uncollected past safety limit ➔ Automatically routed to registered biogas facility.
          </p>
        </div>
      </section>

      {/* ==================== 11. BIOGAS SECTION ==================== */}
      <section id="biogas" className="glass-card hover-lift" style={{ borderLeft: '6px solid #d97706', background: '#fffbeb', padding: '2.75rem 2.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="section-pill" style={{ color: '#b45309', background: '#fef3c7' }}>
            Zero Waste Circular Recovery
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginTop: '0.5rem', color: '#78350f' }}>
            When Food Can't Reach People, It Can Still Create Value.
          </h2>
          <p style={{ color: '#92400e', fontSize: '1.02rem', marginTop: '0.5rem', lineHeight: '1.65', maxWidth: '820px' }}>
            If the collection deadline expires before successful human redistribution, SmartSurplus identifies a suitable registered biogas facility to divert waste into clean energy.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'white', padding: '1.35rem', borderRadius: '16px', border: '1px solid #fde68a', fontSize: '0.92rem', fontWeight: '800', color: '#78350f', justifyContent: 'space-between' }}>
          <span>Expired Surplus</span>
          <span>➔</span>
          <span>Nearest Suitable Biogas Facility</span>
          <span>➔</span>
          <span>Collection</span>
          <span>➔</span>
          <span>Processing</span>
          <span>➔</span>
          <span>Clean Energy Recovery ⚡</span>
        </div>
      </section>

      {/* ==================== 12. MAP PREVIEW ==================== */}
      <section id="map-preview" className="glass-card" style={{ background: '#ffffff', padding: '2.25rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MapPin size={24} color="#15803d" /> Live OpenStreetMap Tracking
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#6b7280', margin: 0 }}>
              Live OpenStreetMap visualization of active Donors, NGO Shelters, Biogas Facilities, and Surplus Pickups.
            </p>
          </div>
          <Link 
            to="/tracking-map" 
            className="btn-secondary" 
            style={{ 
              padding: '0.6rem 1.35rem', 
              fontSize: '0.9rem', 
              fontWeight: '800',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '12px',
              border: '1.5px solid #16a34a',
              color: '#15803d',
              background: '#f0fdf4',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)'
            }}
          >
            <span>Open Fullscreen Tracking Map →</span>
          </Link>
        </div>

        {/* Interactive Layer Filter Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { id: 'ALL', label: `🌐 All Locations (${mapMarkers.length})` },
            { id: 'DONOR', label: `🟢 Donors (${mapMarkers.filter(m => m.type === 'DONOR').length})` },
            { id: 'NGO', label: `🔵 NGOs (${mapMarkers.filter(m => m.type === 'NGO').length})` },
            { id: 'BIOGAS', label: `🟠 Biogas (${mapMarkers.filter(m => m.type === 'BIOGAS').length})` },
            { id: 'DONATION', label: `📦 Active Surplus (${mapMarkers.filter(m => m.type === 'DONATION').length})` }
          ].map(tab => {
            const isActive = activeMapLayer === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMapLayer(tab.id)}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #16a34a' : '1px solid #e2e8f0',
                  background: isActive ? '#f0fdf4' : '#ffffff',
                  color: isActive ? '#15803d' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <Map 
          markers={mapMarkers.filter(m => {
            if (activeMapLayer === 'ALL') return true;
            return m.type === activeMapLayer;
          })} 
          height="420px" 
          zoom={12} 
          center={[13.0827, 80.2707]} 
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', fontSize: '0.84rem', color: '#6b7280' }}>
          <span>ℹ️ Click on any pin on the map to view organization profiles, capacities, and live surplus status.</span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>● {mapMarkers.length} Active Nodes Displayed</span>
        </div>
      </section>

      {/* ==================== 13. KEY FEATURES ==================== */}
      <section id="features">
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#15803d', background: '#f0fdf4' }}>
            Platform Capabilities
          </span>
          <h2 className="section-title">
            Key SmartSurplus Features
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.35rem' }}>
          {[
            { icon: <Cpu size={22} color="#15803d" />, title: 'Smart NGO Matching', desc: '5-factor rule-based algorithm pairing food with best available local shelters.' },
            { icon: <Clock size={22} color="#15803d" />, title: 'Food Safety Timer', desc: 'Configurable countdown windows based on food perishability category.' },
            { icon: <Zap size={22} color="#15803d" />, title: 'Automatic Biogas Redirection', desc: 'Seamless fail-safe transfer of expired food to renewable energy plants.' },
            { icon: <Compass size={22} color="#15803d" />, title: 'Live Pickup Tracking', desc: 'Real-time step-by-step progress tracking for active donation pickups.' },
            { icon: <MapPin size={22} color="#15803d" />, title: 'Leaflet + OpenStreetMap', desc: 'Embedded interactive map views with custom pins and route visualization.' },
            { icon: <Smartphone size={22} color="#0284c7" />, title: 'SMS Notifications', desc: 'Direct text alerts sent for urgent match requests and dispatch updates.', badge: 'Upcoming' },
            { icon: <Mail size={22} color="#0284c7" />, title: 'Gmail Notifications', desc: 'Automated email dispatch for confirmations, receipts, and system alerts.', badge: 'Upcoming' },
            { icon: <Bell size={22} color="#15803d" />, title: 'Real-Time Updates', desc: 'Instant browser notifications powered by Socket.IO event channels.' },
            { icon: <BarChart3 size={22} color="#15803d" />, title: 'Impact Dashboard', desc: 'Comprehensive analytics on meals served, waste diverted, and CO₂ offset.' },
            { icon: <ShieldCheck size={22} color="#15803d" />, title: 'Digital Receipts', desc: 'Verified digital documentation and automated audit tracking for donations.' },
            { icon: <Lock size={22} color="#15803d" />, title: 'Secure Authentication', desc: 'Encrypted JWT login sessions and role-based route permissions.' },
            { icon: <ShieldCheck size={22} color="#15803d" />, title: 'Admin Monitoring', desc: 'Centralized dashboard for auditing organizations and platform operations.' }
          ].map((feat, idx) => (
            <div key={idx} className="hover-lift" style={{ position: 'relative', background: 'white', padding: '1.5rem', borderRadius: '16px', border: feat.badge ? '1.5px solid #bae6fd' : '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ background: feat.badge ? '#f0f9ff' : '#f0fdf4', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                {feat.badge && (
                  <span style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: '800', 
                    color: '#0369a1', 
                    background: '#e0f2fe', 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '999px', 
                    letterSpacing: '0.4px', 
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    border: '1px solid #bae6fd'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block' }}></span>
                    {feat.badge}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '0.4rem' }}>{feat.title}</h4>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', lineHeight: '1.5', margin: 0 }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 14. IMPACT SECTION ==================== */}
      <section id="impact" className="glass-card" style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)', color: 'white', padding: '3.5rem 2.5rem', borderRadius: '24px' }}>
        <div className="section-header-center">
          <span style={{ fontSize: '0.82rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.35rem 1rem', borderRadius: '999px', textTransform: 'uppercase' }}>
            Measurable Change
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '800', marginTop: '0.6rem', color: 'white' }}>
            Measure the Impact of Every Surplus.
          </h2>
          <p style={{ color: '#dcfce7', fontSize: '1.02rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
            Transparent environmental and social tracking for donors, NGOs, and community partners.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '1.75rem', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
            <Heart size={34} style={{ marginBottom: '0.6rem', opacity: 0.95 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem' }}>Track Food Rescued</h4>
            <p style={{ fontSize: '0.86rem', color: '#dcfce7', margin: 0 }}>Real-time logs of edible meals safely diverted to shelters.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '1.75rem', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
            <Leaf size={34} style={{ marginBottom: '0.6rem', opacity: 0.95 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem' }}>Track Waste Diverted</h4>
            <p style={{ fontSize: '0.86rem', color: '#dcfce7', margin: 0 }}>Kilograms of potential landfill waste completely eliminated.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '1.75rem', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
            <Users size={34} style={{ marginBottom: '0.6rem', opacity: 0.95 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem' }}>Measure Community Impact</h4>
            <p style={{ fontSize: '0.86rem', color: '#dcfce7', margin: 0 }}>Partner NGOs empowered with consistent, predictable food supply.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '1.75rem', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
            <Zap size={34} style={{ marginBottom: '0.6rem', opacity: 0.95 }} />
            <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem' }}>Biogas Energy Recovered</h4>
            <p style={{ fontSize: '0.86rem', color: '#dcfce7', margin: 0 }}>Clean renewable energy generated from expired food items.</p>
          </div>
        </div>
      </section>

      {/* ==================== 15. WHO CAN USE SMARTSURPLUS ==================== */}
      <section id="about">
        <div className="section-header-center">
          <span className="section-pill" style={{ color: '#15803d', background: '#f0fdf4' }}>
            User Roles
          </span>
          <h2 className="section-title">
            Who Can Use SmartSurplus
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card hover-lift" style={{ background: 'white' }}>
            <div style={{ background: '#f0fdf4', color: '#15803d', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Building size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>FOOD DONORS</h3>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.65' }}>
              <li>Restaurants & Hotels</li>
              <li>Caterers & Event Venues</li>
              <li>Supermarkets & Bakeries</li>
              <li>Corporate Cafeterias</li>
            </ul>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'white' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Heart size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>NGOs & CHARITIES</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.65' }}>
              Verified charitable organizations, orphanages, and food banks that collect and redistribute edible surplus to people in need.
            </p>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'white' }}>
            <div style={{ background: '#fffbe6', color: '#d97706', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Factory size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>BIOGAS FACILITIES</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.65' }}>
              Registered anaerobic digestion and energy recovery facilities that receive suitable expired surplus for fuel production.
            </p>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'white' }}>
            <div style={{ background: '#f3e8ff', color: '#9333ea', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>ADMINISTRATORS</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.65' }}>
              Platform operators overseeing organization verification, safety compliance, and system-wide logistics performance.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 16. PROFESSIONAL TRUST SECTION ==================== */}
      <section className="glass-card" style={{ background: '#f8fafc', padding: '3.25rem 2.25rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#111827' }}>
            Built for Responsible Surplus Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.98rem', marginTop: '0.4rem' }}>
            Designed around legal compliance, complete transparency, and reliable execution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', textAlign: 'center' }}>
          {[
            'Verified Organizations', 'Secure Authentication', 'Real-Time Notifications',
            'Transparent Tracking', 'Data-Driven Matching', 'Circular Waste Recovery'
          ].map((concept, i) => (
            <div key={i} className="hover-lift" style={{ background: 'white', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.92rem', fontWeight: '800', color: '#15803d' }}>
              ✓ {concept}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 17. CALL TO ACTION ==================== */}
      <section className="glass-card" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: 'white', padding: '4rem 2.5rem', borderRadius: '28px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.6rem', fontWeight: '900', color: 'white', marginBottom: '0.85rem' }}>
          Ready to Give Surplus a Smarter Destination?
        </h2>
        <p style={{ fontSize: '1.15rem', color: '#dcfce7', maxWidth: '640px', margin: '0 auto 2.25rem' }}>
          Join SmartSurplus today as a Food Donor, NGO Shelter, or Registered Biogas Facility.
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="hero-btn-primary">
            Start Donating
          </Link>
          <Link to="/register" className="hero-btn-secondary">
            Join as an NGO
          </Link>
          <Link to="/register" className="hero-btn-secondary">
            Register a Biogas Facility
          </Link>
        </div>
      </section>

      </div> {/* End .home-body-content */}

    </div>
  );
}

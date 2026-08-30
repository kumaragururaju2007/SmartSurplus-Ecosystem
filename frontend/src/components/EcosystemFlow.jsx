import React from 'react';
import { Utensils, Cpu, Building2, Factory, Users, Zap, Leaf, ArrowDown, ArrowDownRight, ArrowDownLeft } from 'lucide-react';
import '../styles/ecosystemFlow.css';

export default function EcosystemFlow() {
  return (
    <div className="ecosystem-flow-wrapper">
      <div className="ecosystem-flow-header">
        <span className="flow-badge">HOW SMARTSURPLUS OPERATES</span>
        <h3 className="flow-title">Live Closed-Loop Redistribution Flow</h3>
      </div>

      <div className="ecosystem-flow-canvas">
        {/* Node 1: SURPLUS FOOD */}
        <div className="flow-row">
          <div className="flow-node node-surplus hover-lift">
            <div className="flow-node-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Utensils size={24} />
            </div>
            <div className="flow-node-content">
              <span className="node-tag" style={{ color: '#2563eb', background: '#dbeafe' }}>STEP 1 • INPUT</span>
              <h4 className="node-title">🍱 SURPLUS FOOD</h4>
              <p className="node-desc">Hotels, Caterers & Restaurants list edible or surplus food</p>
            </div>
          </div>
        </div>

        {/* Animated Connector: Vertical Down */}
        <div className="flow-connector-vertical">
          <div className="connector-line">
            <span className="pulse-particle"></span>
          </div>
          <span className="connector-label">Automated System Ingestion</span>
        </div>

        {/* Node 2: SMART MATCHING */}
        <div className="flow-row">
          <div className="flow-node node-engine hover-lift">
            <div className="flow-node-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Cpu size={26} />
            </div>
            <div className="flow-node-content">
              <span className="node-tag" style={{ color: '#15803d', background: '#dcfce7' }}>CORE INTELLIGENCE</span>
              <h4 className="node-title">🤖 SMART MATCHING ENGINE</h4>
              <p className="node-desc">5-Factor algorithm (Distance, Capacity, Urgency, Reliability)</p>
            </div>
          </div>
        </div>

        {/* Branching SVG Connectors: Left (NGO) vs Right (Biogas) */}
        <div className="flow-branch-row">
          {/* Left Branch Label */}
          <div className="branch-label-box left-label">
            <span className="branch-pill pill-green">Primary • Safe Window</span>
            <span className="branch-subtext">Active Collection Timer</span>
          </div>

          {/* Right Branch Label */}
          <div className="branch-label-box right-label">
            <span className="branch-pill pill-amber">Secondary • Expired Timer</span>
            <span className="branch-subtext">Auto-Pivot Fail Safe</span>
          </div>
        </div>

        {/* Level 3: Dual Destinations (NGO & Biogas) */}
        <div className="flow-dual-row">
          {/* Destination Left: NGO */}
          <div className="flow-node node-ngo hover-lift">
            <div className="flow-node-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Building2 size={24} />
            </div>
            <div className="flow-node-content">
              <span className="node-tag" style={{ color: '#15803d', background: '#dcfce7' }}>DESTINATION A</span>
              <h4 className="node-title">🏢 VERIFIED NGOs</h4>
              <p className="node-desc">Proximity-ranked shelters accept & dispatch pickup</p>
            </div>
          </div>

          {/* Destination Right: BIOGAS */}
          <div className="flow-node node-biogas hover-lift">
            <div className="flow-node-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Factory size={24} />
            </div>
            <div className="flow-node-content">
              <span className="node-tag" style={{ color: '#b45309', background: '#fef3c7' }}>DESTINATION B</span>
              <h4 className="node-title">⚡ BIOGAS PLANTS</h4>
              <p className="node-desc">Registered anaerobic digesters receive uncollected biomass</p>
            </div>
          </div>
        </div>

        {/* Intermediate Down Connectors */}
        <div className="flow-dual-connectors">
          <div className="dual-connector-left">
            <div className="connector-line green-line">
              <span className="pulse-particle green-particle"></span>
            </div>
            <span className="connector-sub">Safe Food Delivery</span>
          </div>
          <div className="dual-connector-right">
            <div className="connector-line amber-line">
              <span className="pulse-particle amber-particle"></span>
            </div>
            <span className="connector-sub">Bio-Methanation</span>
          </div>
        </div>

        {/* Level 4: Outcomes (People vs Energy) */}
        <div className="flow-dual-row">
          {/* Outcome Left: PEOPLE */}
          <div className="flow-node node-outcome-people hover-lift">
            <div className="flow-node-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <Users size={24} />
            </div>
            <div className="flow-node-content">
              <h4 className="node-title">👨‍👩‍👧 PEOPLE SERVED</h4>
              <p className="node-desc">Nutritious hot meals feed children, shelters & vulnerable communities 🍲</p>
            </div>
          </div>

          {/* Outcome Right: ENERGY */}
          <div className="flow-node node-outcome-energy hover-lift">
            <div className="flow-node-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <Zap size={24} />
            </div>
            <div className="flow-node-content">
              <h4 className="node-title">🔋 CLEAN ENERGY</h4>
              <p className="node-desc">Clean compressed biogas (CBG), renewable power & organic fertilizer ⚡</p>
            </div>
          </div>
        </div>

        {/* Converging Connectors to Final Impact */}
        <div className="flow-converge-row">
          <div className="converge-left-line"></div>
          <div className="converge-center-junction">
            <span className="junction-dot"></span>
          </div>
          <div className="converge-right-line"></div>
        </div>
        <div className="converge-connector-vertical">
          <div className="connector-line green-line">
            <span className="pulse-particle green-particle"></span>
          </div>
        </div>

        {/* Final Level: ZERO-WASTE IMPACT */}
        <div className="flow-row">
          <div className="flow-node node-impact hover-lift">
            <div className="flow-node-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Leaf size={28} />
            </div>
            <div className="flow-node-content">
              <span className="node-tag" style={{ color: '#047857', background: '#d1fae5' }}>100% CLOSED-LOOP DESTINATION</span>
              <h4 className="node-title" style={{ fontSize: '1.35rem', color: '#065f46' }}>🌱 ZERO-WASTE IMPACT</h4>
              <p className="node-desc" style={{ maxWidth: '480px' }}>
                Zero food to landfills. Measurable carbon offset (2.1 kg CO₂e saved per kg), certified CSR reports, and 100% circular utilization.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Utensils, Users, Info } from 'lucide-react';

export default function LinearDonationChart({ data = [], height = 300, timeRange = '30d' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute SVG dimensions and scale coordinates
  const { points, maxVal, pathD, areaD, yTicks, xLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxVal: 50, pathD: '', areaD: '', yTicks: [], xLabels: [] };
    }

    const paddingLeft = 55;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;
    const width = 800; // SVG internal coordinate width

    const rawMax = Math.max(...data.map(d => Number(d.amount_donated_kg) || 0), 10);
    // Round max to nice ceiling
    const maxVal = Math.ceil(rawMax / 10) * 10 * 1.15;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const n = data.length;
    const points = data.map((item, i) => {
      const x = n === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (i / (n - 1)) * chartWidth;
      const val = Number(item.amount_donated_kg) || 0;
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      return { ...item, x, y, val, originalIndex: i };
    });

    // Smooth Bezier Curve Path Generation
    let pathD = '';
    let areaD = '';

    if (points.length === 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      areaD = `M ${points[0].x} ${points[0].y} L ${points[0].x} ${paddingTop + chartHeight}`;
    } else if (points.length > 1) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const controlX = (current.x + next.x) / 2;
        pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
      }

      const last = points[points.length - 1];
      const first = points[0];
      const bottomY = paddingTop + chartHeight;
      areaD = `${pathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
    }

    // Y Axis ticks (4 intervals)
    const tickCount = 4;
    const yTicks = [];
    for (let i = 0; i <= tickCount; i++) {
      const val = Math.round((maxVal / tickCount) * i);
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      yTicks.push({ val, y });
    }

    // X Axis Labels - display 5 to 7 evenly spaced labels
    const step = Math.max(1, Math.floor(n / 6));
    const xLabels = points.filter((_, i) => i === 0 || i === n - 1 || i % step === 0);

    return { points, maxVal, pathD, areaD, yTicks, xLabels };
  }, [data, height]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      
      {/* SVG Linear Graph Canvas */}
      <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
        <svg
          viewBox={`0 0 800 ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '550px', display: 'block' }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Linear Area Gradient Fill */}
            <linearGradient id="donationAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#16a34a" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Gridlines and Y Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1="55"
                y1={tick.y}
                x2="770"
                y2={tick.y}
                stroke={idx === 0 ? '#cbd5e1' : '#f1f5f9'}
                strokeWidth={idx === 0 ? '1.5' : '1'}
                strokeDasharray={idx === 0 ? 'none' : '4 4'}
              />
              <text
                x="48"
                y={tick.y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="#64748b"
              >
                {tick.val} kg
              </text>
            </g>
          ))}

          {/* Smooth Area Under Curve */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#donationAreaGrad)"
            />
          )}

          {/* Linear Graph Stroke Curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Labels */}
          {xLabels.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#64748b"
            >
              {pt.dayLabel}
            </text>
          ))}

          {/* Vertical Guideline & Indicator on Active Hover */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1="30"
                x2={activePoint.x}
                y2={height - 40}
                stroke="#16a34a"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 2px 5px rgba(22, 163, 74, 0.4))' }}
              />
            </g>
          )}

          {/* Interactive Data Points & Hover Targets */}
          {points.map((pt, idx) => {
            const hasData = pt.val > 0;
            return (
              <g key={idx}>
                {/* Data point dot on active days */}
                {hasData && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIndex === idx ? '6.5' : '4'}
                    fill={hoveredIndex === idx ? '#15803d' : '#16a34a'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ transition: 'r 0.15s ease' }}
                  />
                )}

                {/* Invisible wide capture area for effortless mouse hover */}
                <rect
                  x={pt.x - 14}
                  y="20"
                  width="28"
                  height={height - 50}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Modern Interactive Tooltip Card */}
      {activePoint && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: activePoint.x > 500 ? 'auto' : `${Math.min(activePoint.x - 40, 520)}px`,
          right: activePoint.x > 500 ? '20px' : 'auto',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '0.75rem 1.1rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          fontSize: '0.85rem',
          pointerEvents: 'none',
          zIndex: 20,
          border: '1px solid rgba(255,255,255,0.15)',
          minWidth: '190px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', color: '#86efac', marginBottom: '0.35rem' }}>
            <Calendar size={14} />
            <span>{activePoint.dayLabel} ({activePoint.date})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.2rem 0' }}>
            <span style={{ color: '#cbd5e1' }}>Food Donated:</span>
            <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{activePoint.val} kg</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.2rem 0' }}>
            <span style={{ color: '#cbd5e1' }}>Donation Listings:</span>
            <strong style={{ color: '#ffffff' }}>{activePoint.donations_count}</strong>
          </div>
          {activePoint.people_served > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: '#93c5fd' }}>Est. People Served:</span>
              <strong style={{ color: '#60a5fa' }}>~{activePoint.people_served}</strong>
            </div>
          )}
        </div>
      )}

      {/* Axis Titles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0 0.5rem', fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
        <span>📈 Y-Axis: Amount of Surplus Food (kg)</span>
        <span>📅 X-Axis: Daily Timeline ({timeRange === '7d' ? 'Past 7 Days' : timeRange === '90d' ? 'Past 90 Days' : 'Past 30 Days'})</span>
      </div>
    </div>
  );
}

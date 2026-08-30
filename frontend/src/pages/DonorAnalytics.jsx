import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  LineChart, TrendingUp, Utensils, Calendar, Users, Leaf, Award, 
  Sparkles, Filter, Package, ArrowUpRight, CheckCircle2, Clock, 
  BarChart3, PieChart, ShieldCheck, Flame, RefreshCw
} from 'lucide-react';
import { getDonorAnalytics } from '../services/donationAPI';
import LinearDonationChart from '../components/LinearDonationChart';
import '../styles/dashboard.css';

export default function DonorAnalytics({ token, user }) {
  const [range, setRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async (selectedRange = range) => {
    if (!token) return;
    try {
      setRefreshing(true);
      const res = await getDonorAnalytics(selectedRange, token);
      if (res && res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Error fetching donor analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(range);
  }, [token, range]);

  const summary = analytics?.summary || {
    totalDonatedKg: 0,
    totalDonationsCount: 0,
    completedCount: 0,
    rescueRate: 0,
    avgDonationKg: 0,
    totalPeopleBenefited: 0,
    co2SavedKg: 0,
    peakDay: { date: 'N/A', amount_kg: 0 }
  };

  const dailyTrends = analytics?.dailyTrends || [];
  const frequentlyDonated = analytics?.frequentlyDonated || [];
  const categoryBreakdown = analytics?.categoryBreakdown || [];

  // Filter frequently donated foods by category if selected
  const filteredFoods = selectedCategory === 'ALL'
    ? frequentlyDonated
    : frequentlyDonated.filter(f => f.food_category === selectedCategory);

  const maxFreq = frequentlyDonated.length > 0 ? Math.max(...frequentlyDonated.map(f => f.frequency)) : 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ==================== PAGE HEADER & TIME RANGE SELECTOR ==================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.65rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Donor Intelligence & Insights
            </span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.65rem', letterSpacing: '-0.02em', margin: 0 }}>
            <LineChart size={30} color="#16a34a" />
            <span>Donation Analytics</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.96rem', marginTop: '0.35rem' }}>
            Analyze frequently donated food varieties, daily surplus trends, and community impact.
          </p>
        </div>

        {/* Time Range Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '0.3rem', flexWrap: 'wrap' }}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              style={{
                padding: '0.45rem 1rem',
                border: 'none',
                borderRadius: '9px',
                fontSize: '0.85rem',
                fontWeight: range === item.id ? '800' : '600',
                color: range === item.id ? '#15803d' : '#64748b',
                background: range === item.id ? '#ffffff' : 'transparent',
                boxShadow: range === item.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => fetchAnalyticsData(range)}
            style={{
              padding: '0.45rem',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '8px'
            }}
            title="Refresh Analytics"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* ==================== SUMMARY KPI STATS GRID ==================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        
        {/* Total Food Donated */}
        <div className="glass-card" style={{ padding: '1.35rem 1.5rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Donated</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {summary.totalDonatedKg.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: '700', color: '#16a34a' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.35rem', fontWeight: '700' }}>
            Across {summary.totalDonationsCount} listings
          </div>
        </div>

        {/* People Benefited */}
        <div className="glass-card" style={{ padding: '1.35rem 1.5rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>People Benefited</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
            ~{summary.totalPeopleBenefited.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '0.35rem', fontWeight: '700' }}>
            Meals provided to shelters
          </div>
        </div>

        {/* Peak Donation Day */}
        <div className="glass-card" style={{ padding: '1.35rem 1.5rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Peak Donation Day</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {summary.peakDay.date !== 'N/A' ? `${summary.peakDay.date}` : 'No Peak Yet'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '0.35rem', fontWeight: '700' }}>
            {summary.peakDay.amount_kg > 0 ? `${summary.peakDay.amount_kg} kg donated in a day` : 'Awaiting entries'}
          </div>
        </div>

        {/* Average per Listing */}
        <div className="glass-card" style={{ padding: '1.35rem 1.5rem', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Avg. Batch Weight</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {summary.avgDonationKg} <span style={{ fontSize: '1rem', fontWeight: '700', color: '#db2777' }}>kg</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#db2777', marginTop: '0.35rem', fontWeight: '700' }}>
            {summary.rescueRate}% rescue success rate
          </div>
        </div>
      </div>

      {/* ==================== LINEAR GRAPH: DAY VS AMOUNT OF FOOD DONATED ==================== */}
      <div className="glass-card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <TrendingUp size={22} color="#16a34a" />
              <span>Day vs. Amount of Food Donated (kg)</span>
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
              Continuous linear volume trajectory showing daily food weight redistributed over time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#15803d', background: '#f0fdf4', padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
              ● Live Dynamic Timeline
            </span>
          </div>
        </div>

        {/* Linear Graph Canvas */}
        {loading ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <span>Loading donation timeline...</span>
          </div>
        ) : dailyTrends.length === 0 || summary.totalDonatedKg === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <Utensils size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#334155', marginBottom: '0.35rem' }}>
              No Donation Volume in this Timeframe
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
              Start listing surplus food to automatically populate your linear donation trajectory and daily impact metrics.
            </p>
            <Link to="/donor/create-donation" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.65rem 1.25rem' }}>
              <span>Donate Food Surplus</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <LinearDonationChart data={dailyTrends} height={320} timeRange={range} />
        )}
      </div>

      {/* ==================== FREQUENTLY DONATED FOODS SECTION ==================== */}
      <div className="glass-card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Award size={22} color="#f59e0b" />
              <span>Frequently Donated Foods</span>
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>
              Top surplus dishes and food varieties ranked by donation frequency and total volume.
            </p>
          </div>

          {/* Category Filter Selector */}
          {categoryBreakdown.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} color="#64748b" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Categories ({frequentlyDonated.length})</option>
                {categoryBreakdown.map(c => (
                  <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Food Ranking Cards / Grid */}
        {loading ? (
          <p style={{ color: '#64748b' }}>Analyzing food frequencies...</p>
        ) : filteredFoods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
            <Utensils size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: '700', margin: 0 }}>No food donation data recorded in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredFoods.map((food, idx) => {
              const freqRatio = Math.min(100, Math.round((food.frequency / maxFreq) * 100));
              const isTop = idx === 0;

              return (
                <div
                  key={`${food.food_name}_${food.food_category}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    padding: '1.15rem 1.35rem',
                    background: isTop ? '#f0fdf4' : '#fafafa',
                    border: isTop ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    
                    {/* Left: Rank & Food Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#e2e8f0',
                        color: idx <= 2 ? '#ffffff' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}>
                        #{idx + 1}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                            {food.food_name}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                            {food.food_category}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Last donated: {new Date(food.last_donated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Right: Metrics Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      
                      {/* Frequency */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Frequency</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '900' }}>
                          {food.frequency} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>times</span>
                        </strong>
                      </div>

                      {/* Total Weight */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Total Volume</span>
                        <strong style={{ fontSize: '1.05rem', color: '#16a34a', fontWeight: '900' }}>
                          {food.total_kg} <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600' }}>kg</span>
                        </strong>
                      </div>

                      {/* Average Portion */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Avg. Batch</span>
                        <strong style={{ fontSize: '0.98rem', color: '#475569', fontWeight: '800' }}>
                          ~{food.avg_kg} kg
                        </strong>
                      </div>

                      {/* People Supported */}
                      {food.people_served_total > 0 && (
                        <div style={{ textAlign: 'right', background: '#eff6ff', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                          <span style={{ fontSize: '0.7rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: '800', display: 'block' }}>Impact</span>
                          <strong style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: '900' }}>
                            ~{food.people_served_total} people
                          </strong>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Frequency Progress Bar */}
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${freqRatio}%`,
                        height: '100%',
                        background: isTop ? 'linear-gradient(90deg, #16a34a 0%, #15803d 100%)' : '#64748b',
                        borderRadius: '999px',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== CATEGORY BREAKDOWN CARDS ==================== */}
      {categoryBreakdown.length > 0 && (
        <div className="glass-card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PieChart size={22} color="#2563eb" />
            <span>Surplus Food Category Distribution</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{cat.category}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2563eb' }}>{cat.percentage}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>{cat.total_kg} kg donated</span>
                  <span>{cat.count} listings</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.percentage}%`,
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: '999px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== ACTION FOOTER ==================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', color: '#ffffff', padding: '1.75rem 2rem', borderRadius: '18px', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
            Have More Surplus Ready for Donation?
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#dcfce7', marginTop: '0.25rem', margin: 0 }}>
            List excess meals now for automated proximity dispatch and food safety compliance.
          </p>
        </div>
        <Link
          to="/donor/create-donation"
          className="btn-primary"
          style={{ background: '#ffffff', color: '#15803d', fontWeight: '800', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>Create Food Donation</span>
          <ArrowUpRight size={18} />
        </Link>
      </div>

    </div>
  );
}

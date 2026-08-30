import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, Award, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { matchDonation } from '../services/matchingAPI';
import { getDonationById } from '../services/donationAPI';

export default function MatchingResult({ token }) {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function executeMatching() {
      try {
        const dRes = await getDonationById(id, token);
        if (dRes.success) setDonation(dRes.donation);

        const mRes = await matchDonation(id, token);
        if (mRes.success) {
          setResult(mRes);
        } else {
          setError(mRes.message || 'No suitable NGO found.');
        }
      } catch (err) {
        setError('Error triggering Smart Matching Engine.');
      } finally {
        setLoading(false);
      }
    }
    executeMatching();
  }, [id, token]);

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }} className="glass-card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Smart Matching Engine Analyzing...</h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Evaluating distance, NGO capacity, safe time urgency, availability, and response history.</p>
      </div>
    );
  }

  if (error || !result || !result.match) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }} className="glass-card">
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', color: '#b45309', marginBottom: '1.5rem' }}>
          <AlertCircle size={32} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{error || 'No suitable NGO currently available'}</h3>
          <p style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>The listing remains in POSTED status awaiting new verified NGO availability.</p>
        </div>
        <Link to="/donor/dashboard" className="btn-secondary">
          <ArrowLeft size={16} /> Return to Donor Dashboard
        </Link>
      </div>
    );
  }

  const { match, allCandidates } = result;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/donor/dashboard" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <div className="glass-card" style={{ borderTop: '4px solid #16a34a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.25rem 0.6rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
              RULE-BASED SMART MATCHING RESULT
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.4rem', color: '#111827' }}>
              Optimal NGO Recommended
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Matched for listing: <strong>{donation ? donation.food_name : `#${id}`}</strong>
            </p>
          </div>

          <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', padding: '0.75rem 1.25rem', borderRadius: '14px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#166534', display: 'block' }}>TOTAL SCORE</span>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#15803d', lineHeight: '1.1' }}>{match.score}%</span>
          </div>
        </div>

        {/* Matched NGO Highlight */}
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827' }}>{match.bestNGO.organization_name}</h3>
            <ShieldCheck size={20} color="#16a34a" title="Verified NGO" />
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
            <MapPin size={15} /> {match.bestNGO.address}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem', background: '#f9fafb', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem' }}>
            <div><strong>Distance:</strong> {match.distance} km</div>
            <div><strong>Capacity Score:</strong> {match.capacityScore}/100</div>
            <div><strong>Urgency Score:</strong> {match.urgencyScore}/100</div>
            <div><strong>Availability:</strong> {match.availabilityScore}/100</div>
            <div><strong>Response Rate:</strong> {match.responseScore}%</div>
          </div>
        </div>

        {/* Recommendation Rationale Explanation */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#111827' }}>
            Why This NGO Was Recommended
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {match.explanation.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                <Check size={16} color="#16a34a" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked Candidate List */}
      {allCandidates && allCandidates.length > 1 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
            Evaluated Candidate NGO Rankings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allCandidates.map((cand, idx) => (
              <div key={cand.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: idx === 0 ? '#f0fdf4' : 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ marginRight: '0.5rem' }}>#{idx + 1}</strong>
                  <span>{cand.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({cand.distanceKm} km)</span>
                </div>
                <span style={{ fontWeight: '800', color: idx === 0 ? '#15803d' : '#374151' }}>{cand.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

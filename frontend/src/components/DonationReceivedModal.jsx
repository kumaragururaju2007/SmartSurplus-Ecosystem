import React, { useState } from 'react';
import { X, CheckCircle2, Users, Utensils, AlertTriangle, Building, Truck, Sparkles, Star, ShieldAlert, Lock } from 'lucide-react';
import { confirmDonationReceipt } from '../services/ngoAPI';
import { rateDonor } from '../services/donationAPI';

export default function DonationReceivedModal({ donation, token, onClose, onSuccess }) {
  const defaultQty = donation?.quantity || donation?.food_quantity || '';
  const [quantityReceived, setQuantityReceived] = useState(defaultQty.toString());
  
  // Default estimate calculation helper (e.g. 1 kg ~ 4 people for rich cooked food or 2.5 for staple)
  const defaultEstimate = defaultQty ? Math.round(parseFloat(defaultQty) * 4).toString() : '';
  const [peopleServed, setPeopleServed] = useState(defaultEstimate);
  const [peopleServedType, setPeopleServedType] = useState('ESTIMATED');
  const [notes, setNotes] = useState('');
  
  // Trust Score & Feedback State
  const [ratingPoints, setRatingPoints] = useState(5);
  const [foodQuality, setFoodQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [hasComplaint, setHasComplaint] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState('Food Quality Issue');
  const [complaintText, setComplaintText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!donation) return null;

  const handleQtyChange = (e) => {
    const val = e.target.value;
    setQuantityReceived(val);
    if (val && !isNaN(parseFloat(val)) && parseFloat(val) > 0) {
      // Auto-suggest estimated people if untouched
      setPeopleServed(Math.round(parseFloat(val) * 4).toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qtyRec = parseFloat(quantityReceived);
    if (isNaN(qtyRec) || qtyRec <= 0) {
      return setError('Please enter a valid received food quantity in kilograms (kg).');
    }

    const peopleCount = parseInt(peopleServed, 10);
    if (isNaN(peopleCount) || peopleCount <= 0) {
      return setError('Please enter the approximate or actual number of people served.');
    }

    const targetDonationId = donation?.donation_id || donation?.id;
    setLoading(true);
    try {
      // 1. Confirm Receipt & Impact
      const res = await confirmDonationReceipt(targetDonationId, {
        quantityReceived: qtyRec,
        peopleServedEstimate: peopleServedType === 'ESTIMATED' ? peopleCount : peopleCount,
        peopleServedActual: peopleServedType === 'ACTUAL' ? peopleCount : null,
        peopleServedType: peopleServedType,
        notes: notes.trim()
      }, token);

      // 2. Submit Trust Rating & Confidential Feedback/Complaint
      try {
        await rateDonor(targetDonationId, {
          rating_points: ratingPoints,
          food_quality_score: foodQuality,
          packaging_score: ratingPoints,
          timeliness_score: timeliness,
          complaint_category: hasComplaint ? complaintCategory : null,
          complaint_text: hasComplaint && complaintText.trim() ? complaintText.trim() : null
        }, token);
      } catch (rateErr) {
        console.warn('Could not record donor rating:', rateErr);
      }

      if (res.success) {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        setError(res.message || 'Failed to record donation receipt.');
      }
    } catch (err) {
      setError('Connection error while recording impact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
          color: '#ffffff',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '800',
                letterSpacing: '0.5px'
              }}>
                DONATION #{donation.donation_id || donation.id}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#dcfce7', fontWeight: '600' }}>
                Receipt & Impact Confirmation
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0.2rem 0', color: '#ffffff' }}>
              Donation Received 🍱
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#dcfce7', opacity: 0.9 }}>
              Verify quantity received and enter the human impact count.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '1.5rem 1.75rem', maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* DONATION DETAILS SUMMARY */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Donor / Hotel</span>
                <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                  <Building size={14} color="#15803d" />
                  {donation.donor_name || 'Hotel Partner'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Food Item</span>
                <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '0.15rem' }}>
                  {donation.food_name || 'Surplus Meal'} ({donation.food_category || 'Cooked Food'})
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Quantity Donated</span>
                <div style={{ fontWeight: '800', color: '#15803d', marginTop: '0.15rem' }}>
                  {donation.quantity || donation.food_quantity || 0} kg
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Pickup Location</span>
                <div style={{ fontWeight: '600', color: '#475569', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {donation.pickup_address || 'City Location'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* QUANTITY RECEIVED (KG) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem' }}>
                Food Quantity Received (kg) *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantityReceived}
                  onChange={handleQtyChange}
                  placeholder="e.g. 142"
                  required
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
                <span style={{
                  padding: '0 1.25rem',
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: '800',
                  color: '#475569'
                }}>
                  kg
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Confirm actual weight after receiving and weighing food.
              </span>
            </div>

            {/* PEOPLE SERVED ESTIMATE / ACTUAL */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                  Approximate People Served *
                </label>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setPeopleServedType('ESTIMATED')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: peopleServedType === 'ESTIMATED' ? '#ffffff' : 'transparent',
                      color: peopleServedType === 'ESTIMATED' ? '#15803d' : '#64748b',
                      boxShadow: peopleServedType === 'ESTIMATED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    ~ Estimated
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeopleServedType('ACTUAL')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: peopleServedType === 'ACTUAL' ? '#ffffff' : 'transparent',
                      color: peopleServedType === 'ACTUAL' ? '#15803d' : '#64748b',
                      boxShadow: peopleServedType === 'ACTUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    ✓ Verified Actual
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  value={peopleServed}
                  onChange={(e) => setPeopleServed(e.target.value)}
                  placeholder="e.g. 568"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Users size={16} color="#15803d" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '600', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} />
                Enter the approximate number of people who can be served from this donation.
              </span>
            </div>

            {/* DISTRIBUTION / IMPACT NOTES */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem' }}>
                Distribution Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Distributed to community shelter on Park Street..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* DONOR TRUST SCORE & QUALITY RATING */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.1rem',
              marginTop: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Star size={16} color="#eab308" fill="#eab308" />
                    Rate Donor Trust & Food Quality
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Scores update the donor's platform trust reputation
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingPoints(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: star <= ratingPoints ? '#eab308' : '#cbd5e1',
                        transition: 'transform 0.1s'
                      }}
                    >
                      <Star size={22} fill={star <= ratingPoints ? '#eab308' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                    Food Freshness & Hygiene
                  </label>
                  <select
                    value={foodQuality}
                    onChange={(e) => setFoodQuality(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      background: '#ffffff'
                    }}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent Freshness</option>
                    <option value="4">⭐⭐⭐⭐ Good Quality</option>
                    <option value="3">⭐⭐⭐ Acceptable</option>
                    <option value="2">⭐⭐ Poor / Near Spoilage</option>
                    <option value="1">⭐ Unacceptable / Spoiled</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '0.25rem' }}>
                    Handover Timeliness
                  </label>
                  <select
                    value={timeliness}
                    onChange={(e) => setTimeliness(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      background: '#ffffff'
                    }}
                  >
                    <option value="5">⚡ Immediate / On Time</option>
                    <option value="4">✓ Minor Delay (&lt; 15 mins)</option>
                    <option value="3">⏱️ Moderate Delay</option>
                    <option value="2">⚠️ Excessive Delay</option>
                    <option value="1">❌ Severe Delay / Staff Unavailable</option>
                  </select>
                </div>
              </div>

              {/* CONFIDENTIAL COMPLAINT TOGGLE */}
              <div style={{
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed #e2e8f0'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', color: '#dc2626' }}>
                  <input
                    type="checkbox"
                    checked={hasComplaint}
                    onChange={(e) => setHasComplaint(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
                  />
                  <span>⚠️ Have an issue or complaint to report? (Direct to Admin)</span>
                </label>

                {hasComplaint && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', color: '#991b1b', fontSize: '0.75rem', fontWeight: '800' }}>
                      <Lock size={12} />
                      CONFIDENTIAL TO ADMIN PORTAL ONLY (Donor will NOT see this comment)
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#7f1d1d', marginBottom: '0.2rem' }}>
                        Issue Category
                      </label>
                      <select
                        value={complaintCategory}
                        onChange={(e) => setComplaintCategory(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid #fca5a5',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          background: '#ffffff'
                        }}
                      >
                        <option value="Food Quality Issue">Food Quality / Safety / Spoilage Concern</option>
                        <option value="Delayed Handover">Donor Staff Unavailable / Excessive Delay</option>
                        <option value="Incorrect Quantity">Significant Quantity Discrepancy</option>
                        <option value="Poor Hygiene / Packaging">Improper Packaging or Hygiene Defect</option>
                        <option value="Other">Other Operational Complaint</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#7f1d1d', marginBottom: '0.2rem' }}>
                        Explain the issue for Admin Review:
                      </label>
                      <textarea
                        rows="2"
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        placeholder="Describe the issue in detail. Platform Admins will review this log..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #fca5a5',
                          fontSize: '0.82rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CONFIRMATION PREVIEW BANNER */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px dashed #86efac',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={24} color="#15803d" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.84rem', color: '#14532d', lineHeight: '1.4' }}>
                <strong>Impact Preview:</strong> Approximately{' '}
                <span style={{ fontWeight: '800', color: '#15803d' }}>
                  {peopleServedType === 'ESTIMATED' ? `~${peopleServed || 0}` : (peopleServed || 0)} people
                </span>{' '}
                will be served from <strong>{quantityReceived || 0} kg</strong> received.
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)'
                }}
              >
                <CheckCircle2 size={18} />
                {loading ? 'Recording Impact...' : 'Confirm Impact & Complete'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

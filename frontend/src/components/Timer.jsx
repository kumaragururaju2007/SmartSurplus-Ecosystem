import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, XCircle, CheckCircle2, Zap } from 'lucide-react';

export default function Timer({ safeUntil, status }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  const upperStatus = String(status || '').toUpperCase().trim();
  const isCancelled = upperStatus === 'CANCELLED';
  const isDelivered = upperStatus === 'DELIVERED' || upperStatus === 'COMPLETED';
  const isBiogas = upperStatus === 'EXPIRED' || upperStatus === 'REDIRECTED_TO_BIOGAS';

  useEffect(() => {
    // If donation is cancelled, delivered, or redirected, do NOT run the countdown timer
    if (isCancelled || isDelivered || isBiogas) {
      return;
    }

    const calculateTime = () => {
      const targetTime = safeUntil ? new Date(safeUntil).getTime() : Date.now();
      const difference = targetTime - Date.now();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds, totalMs: difference });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [safeUntil, isCancelled, isDelivered, isBiogas]);

  // Inactive state: Cancelled
  if (isCancelled) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '700',
        background: '#f8fafc',
        color: '#64748b',
        border: '1.5px solid #cbd5e1'
      }}>
        <XCircle size={15} color="#94a3b8" />
        <span>Timer Stopped (Cancelled)</span>
      </div>
    );
  }

  // Inactive state: Delivered / Completed
  if (isDelivered) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '700',
        background: '#f0fdf4',
        color: '#15803d',
        border: '1.5px solid #bbf7d0'
      }}>
        <CheckCircle2 size={15} color="#16a34a" />
        <span>Delivered Safely</span>
      </div>
    );
  }

  // Inactive state: Redirected to Biogas
  if (isBiogas) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '700',
        background: '#fef3c7',
        color: '#b45309',
        border: '1.5px solid #fde68a'
      }}>
        <Zap size={15} color="#d97706" />
        <span>Redirected to Biogas</span>
      </div>
    );
  }

  const isWarning = timeLeft.totalMs > 0 && timeLeft.totalMs < 30 * 60 * 1000;
  const isExpired = timeLeft.totalMs <= 0;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.35rem 0.75rem',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '700',
      background: isExpired ? '#fee2e2' : isWarning ? '#fef3c7' : '#f0fdf4',
      color: isExpired ? '#dc2626' : isWarning ? '#b45309' : '#15803d',
      border: `1.5px solid ${isExpired ? '#fca5a5' : isWarning ? '#fde68a' : '#bbf7d0'}`
    }}>
      {isExpired ? (
        <>
          <AlertTriangle size={15} color="#dc2626" />
          <span>Collection time expired</span>
        </>
      ) : (
        <>
          <Clock size={15} color={isWarning ? '#b45309' : '#15803d'} />
          <span>
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')} remaining
          </span>
          {isWarning && <AlertTriangle size={14} color="#b45309" title="Less than 30 minutes remain!" />}
        </>
      )}
    </div>
  );
}

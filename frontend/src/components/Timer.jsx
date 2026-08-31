import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, XCircle, CheckCircle2, Zap, Truck } from 'lucide-react';

/**
 * Safely parse diverse date formats (ISO strings, SQL timestamps, Unix epoch ms, Date objects)
 */
function parseTargetTime(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val.getTime();
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Handle standard ISO or SQL "YYYY-MM-DD HH:mm:ss"
    const isoFormatted = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const parsed = new Date(isoFormatted);
    if (!isNaN(parsed.getTime())) return parsed.getTime();

    // Fallback: parse numbers if passed as numeric string
    const num = Number(trimmed);
    if (!isNaN(num) && num > 1000000) return num;
  }
  return null;
}

export default function Timer({ 
  safeUntil, 
  expiryTime, 
  safeExpiryTime, 
  expiresAt, 
  status, 
  compact = false, 
  onExpire = null,
  style = {},
  className = ''
}) {
  const targetDateInput = safeUntil || expiryTime || safeExpiryTime || expiresAt;
  const targetTimeMs = parseTargetTime(targetDateInput);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!targetTimeMs) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isValid: false };
    const diff = Math.max(0, targetTimeMs - Date.now());
    const totalSec = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      totalMs: diff,
      isValid: true
    };
  });

  const upperStatus = String(status || '').toUpperCase().trim();
  const isCancelled = upperStatus === 'CANCELLED';
  const isDelivered = upperStatus === 'DELIVERED' || upperStatus === 'COMPLETED' || upperStatus === 'RECEIVED';
  const isBiogas = upperStatus === 'EXPIRED' || upperStatus === 'REDIRECTED_TO_BIOGAS';
  const isInTransit = upperStatus === 'IN_TRANSIT' || upperStatus === 'COLLECTED';

  useEffect(() => {
    if (isCancelled || isDelivered || isBiogas || !targetTimeMs) {
      return;
    }

    const updateCountdown = () => {
      const difference = targetTimeMs - Date.now();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isValid: true });
        if (typeof onExpire === 'function') {
          onExpire();
        }
        return;
      }

      const totalSec = Math.floor(difference / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalMs: difference,
        isValid: true
      });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [targetTimeMs, isCancelled, isDelivered, isBiogas, onExpire]);

  // Inactive state: Cancelled
  if (isCancelled) {
    return (
      <div 
        className={`timer-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: '700',
          background: '#f8fafc',
          color: '#64748b',
          border: '1.5px solid #cbd5e1',
          ...style
        }}
      >
        <XCircle size={compact ? 13 : 15} color="#94a3b8" />
        <span>Timer Stopped (Cancelled)</span>
      </div>
    );
  }

  // Inactive state: Delivered / Completed
  if (isDelivered) {
    return (
      <div 
        className={`timer-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: '700',
          background: '#f0fdf4',
          color: '#15803d',
          border: '1.5px solid #bbf7d0',
          ...style
        }}
      >
        <CheckCircle2 size={compact ? 13 : 15} color="#16a34a" />
        <span>Delivered Safely</span>
      </div>
    );
  }

  // Inactive state: In Transit
  if (isInTransit) {
    return (
      <div 
        className={`timer-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: '700',
          background: '#eff6ff',
          color: '#1d4ed8',
          border: '1.5px solid #bfdbfe',
          ...style
        }}
      >
        <Truck size={compact ? 13 : 15} color="#2563eb" />
        <span>In Transit • Protected</span>
      </div>
    );
  }

  // Inactive state: Redirected to Biogas
  if (isBiogas) {
    return (
      <div 
        className={`timer-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: '700',
          background: '#fef3c7',
          color: '#b45309',
          border: '1.5px solid #fde68a',
          ...style
        }}
      >
        <Zap size={compact ? 13 : 15} color="#d97706" />
        <span>Redirected to Biogas</span>
      </div>
    );
  }

  if (!timeLeft.isValid) {
    return (
      <div 
        className={`timer-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '8px',
          fontSize: compact ? '0.75rem' : '0.85rem',
          fontWeight: '700',
          background: '#f8fafc',
          color: '#64748b',
          border: '1.5px solid #e2e8f0',
          ...style
        }}
      >
        <Clock size={compact ? 13 : 15} color="#94a3b8" />
        <span>Fresh Listing • Active</span>
      </div>
    );
  }

  const isWarning = timeLeft.totalMs > 0 && timeLeft.totalMs < 30 * 60 * 1000;
  const isExpired = timeLeft.totalMs <= 0;

  // Format display string
  const formattedTime = timeLeft.days > 0
    ? `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
    : `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;

  return (
    <div 
      className={`timer-badge ${isExpired ? 'timer-expired' : isWarning ? 'timer-warning' : 'timer-active'} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: compact ? '0.2rem 0.5rem' : '0.35rem 0.75rem',
        borderRadius: '8px',
        fontSize: compact ? '0.75rem' : '0.85rem',
        fontWeight: '700',
        background: isExpired ? '#fee2e2' : isWarning ? '#fef3c7' : '#f0fdf4',
        color: isExpired ? '#dc2626' : isWarning ? '#b45309' : '#15803d',
        border: `1.5px solid ${isExpired ? '#fca5a5' : isWarning ? '#fde68a' : '#bbf7d0'}`,
        ...style
      }}
    >
      {isExpired ? (
        <>
          <AlertTriangle size={compact ? 13 : 15} color="#dc2626" />
          <span>Collection time expired</span>
        </>
      ) : (
        <>
          <Clock size={compact ? 13 : 15} color={isWarning ? '#b45309' : '#15803d'} />
          <span>{formattedTime} remaining</span>
          {isWarning && (
            <AlertTriangle 
              size={compact ? 12 : 14} 
              color="#b45309" 
              title="Urgent: Less than 30 minutes remain!" 
            />
          )}
        </>
      )}
    </div>
  );
}

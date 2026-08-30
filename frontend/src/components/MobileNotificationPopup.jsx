import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Bell, X, ArrowRight, CheckCircle2, AlertTriangle, Zap, 
  Utensils, Truck, ShieldAlert, Sparkles, Volume2
} from 'lucide-react';
import { getNotifications } from '../services/notificationAPI';
import '../styles/mobileNotification.css';

export default function MobileNotificationPopup({ user, token }) {
  const navigate = useNavigate();
  const [activePopup, setActivePopup] = useState(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const seenIdsRef = useRef(new Set());
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Play synthesized modern chime sound
  const triggerAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Trigger mobile vibration
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 50, 120]);
      } catch (e) {}
    }
  };

  // Trigger Native Mobile / Desktop Push Notification
  const triggerNativePush = (title, message, id) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: `notif_${id || Date.now()}`
          });
        } catch (e) {}
      }
    }
  };

  // Show a notification popup
  const displayNotification = (notif) => {
    if (!notif || !notif.id) return;
    if (seenIdsRef.current.has(notif.id)) return;

    seenIdsRef.current.add(notif.id);
    
    // Save to active popup state
    setActivePopup({
      ...notif,
      timestamp: new Date()
    });

    // Alert feedback
    triggerAudioChime();
    triggerHaptic();
    triggerNativePush(notif.title || 'SmartSurplus Alert', notif.message, notif.id);

    // Auto-dismiss after 8 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActivePopup(null);
    }, 8000);
  };

  // Request native permission once on user interaction
  const requestNativePermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(() => {
        setPermissionRequested(true);
      });
    }
  };

  // Real-time Socket.IO Connection
  useEffect(() => {
    if (!user || !user.id) return;

    const socketUrl = window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Join user specific room
      socket.emit('join_user_room', user.id);
    });

    socket.on('notificationCreated', (data) => {
      if (data && (!data.userId || Number(data.userId) === Number(user.id))) {
        displayNotification(data);
      }
    });

    socket.on('new_notification', (data) => {
      if (data && Number(data.userId) === Number(user.id)) {
        displayNotification(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Periodic Fast Polling for DB Notifications
  useEffect(() => {
    if (!token || !user) return;

    let isMounted = true;
    let initialLoad = true;

    async function checkNewAlerts() {
      try {
        const res = await getNotifications(token);
        if (res && res.success && Array.isArray(res.notifications) && isMounted) {
          const list = res.notifications;

          if (initialLoad) {
            // Seed existing notification IDs so we don't spam popups on page reload
            list.forEach(n => seenIdsRef.current.add(n.id));
            initialLoad = false;
            return;
          }

          // Find the newest unread notification that hasn't been shown in popup
          const newest = list.find(n => !n.is_read && !seenIdsRef.current.has(n.id));
          if (newest) {
            displayNotification(newest);
          }
        }
      } catch (err) {
        // Silent background fallback
      }
    }

    checkNewAlerts();
    const interval = setInterval(checkNewAlerts, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token, user]);

  // Navigate to appropriate page when user clicks popup action
  const handleActionClick = () => {
    if (!activePopup) return;
    const role = user?.role;
    const title = (activePopup.title || '').toLowerCase();
    const msg = (activePopup.message || '').toLowerCase();

    setActivePopup(null);

    if (role === 'NGO') {
      if (title.includes('match') || msg.includes('match') || msg.includes('surplus')) {
        navigate('/ngo/incoming-requests');
      } else {
        navigate('/ngo/dashboard');
      }
    } else if (role === 'DONOR') {
      if (title.includes('driver') || msg.includes('driver') || title.includes('accepted')) {
        navigate('/donor/donations');
      } else {
        navigate('/donor/dashboard');
      }
    } else if (role === 'BIOGAS') {
      if (title.includes('biogas') || msg.includes('redirection')) {
        navigate('/biogas-requests');
      } else {
        navigate('/biogas-dashboard');
      }
    } else {
      navigate('/notifications');
    }
  };

  if (!activePopup) return null;

  // Determine role styling & icon
  const role = user?.role;
  const isNGO = role === 'NGO';
  const isBiogas = role === 'BIOGAS';
  const isDonor = role === 'DONOR';

  let roleBadge = 'SmartSurplus Alert';
  let badgeColor = '#16a34a';
  let badgeBg = '#f0fdf4';
  let IconComponent = Bell;

  if (isNGO) {
    roleBadge = '🍲 NGO Surplus Alert';
    badgeColor = '#15803d';
    badgeBg = '#dcfce7';
    IconComponent = Utensils;
  } else if (isBiogas) {
    roleBadge = '⚡ Biogas Redirection Alert';
    badgeColor = '#b45309';
    badgeBg = '#fef3c7';
    IconComponent = Zap;
  } else if (isDonor) {
    roleBadge = '🚚 Donor Pickup Update';
    badgeColor = '#0284c7';
    badgeBg = '#e0f2fe';
    IconComponent = Truck;
  }

  return (
    <div className="mobile-notification-toast-wrapper" role="alert" aria-live="assertive">
      <div className={`mobile-notification-card ${isNGO ? 'card-ngo' : isBiogas ? 'card-biogas' : isDonor ? 'card-donor' : 'card-default'}`}>
        
        {/* Top Header Row */}
        <div className="mobile-toast-header">
          <div className="mobile-toast-badge" style={{ color: badgeColor, background: badgeBg }}>
            <IconComponent size={14} />
            <span>{roleBadge}</span>
          </div>

          <div className="mobile-toast-actions-top">
            <span className="mobile-toast-time">Just now</span>
            <button 
              type="button" 
              className="mobile-toast-close" 
              onClick={() => setActivePopup(null)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toast Body Content */}
        <div className="mobile-toast-body" onClick={handleActionClick}>
          <h4 className="mobile-toast-title">{activePopup.title}</h4>
          <p className="mobile-toast-message">{activePopup.message}</p>
        </div>

        {/* Action Button & Timer Bar */}
        <div className="mobile-toast-footer">
          <button 
            type="button" 
            className="mobile-toast-action-btn"
            onClick={handleActionClick}
          >
            <span>Open & View Details</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Animated Progress Countdown Bar */}
        <div className="mobile-toast-progress-bar">
          <div className="mobile-toast-progress-fill"></div>
        </div>

      </div>
    </div>
  );
}

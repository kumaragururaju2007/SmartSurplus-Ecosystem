import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Users, User, ShieldAlert, CheckCircle2, 
  AlertCircle, RefreshCw, Eye, X, CheckCheck, Clock, 
  FileText, ExternalLink, Zap, Building2, Utensils, Factory
} from 'lucide-react';
import { 
  getNotificationRecipients, 
  sendAdminNotification, 
  getAdminNotificationHistory,
  getAdminNotificationDetail,
  getAdminNotifications
} from '../../services/adminAPI';
import '../../styles/dashboard.css';

export default function AdminNotifications({ token }) {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'history' | 'stream'
  const [loading, setLoading] = useState(false);
  const [recipientsData, setRecipientsData] = useState({
    donors: [],
    ngos: [],
    biogasPlants: [],
    counts: { totalDonors: 0, totalNGOs: 0, totalBiogasPlants: 0, totalUsers: 0 }
  });

  // Composer Form State
  const [recipientType, setRecipientType] = useState('ALL_USERS'); // 'SPECIFIC_USER' | 'ALL_DONORS' | 'ALL_NGOS' | 'ALL_BIOGAS' | 'ALL_USERS'
  const [specificUserId, setSpecificUserId] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal'); // 'Normal' | 'Important' | 'Urgent'
  const [category, setCategory] = useState('General Announcement');
  const [actionLabel, setActionLabel] = useState('');
  const [actionRoute, setActionRoute] = useState('');

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // History & Details State
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Platform Stream State
  const [streamNotifications, setStreamNotifications] = useState([]);

  // Fetch recipients list and counts
  const fetchRecipients = async () => {
    try {
      const res = await getNotificationRecipients(token);
      if (res.success) {
        setRecipientsData(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch sent history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getAdminNotificationHistory(token);
      if (res.success) {
        setHistory(res.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch live stream
  const fetchStream = async () => {
    try {
      const res = await getAdminNotifications(token);
      if (res.success) {
        setStreamNotifications(res.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecipients();
    fetchHistory();
    fetchStream();
  }, [token]);

  // Consolidate all users for specific user search
  const allSpecificUsers = [
    ...recipientsData.donors.map(d => ({ ...d, displayOrg: d.business_name || d.name, icon: 'DONOR' })),
    ...recipientsData.ngos.map(n => ({ ...n, displayOrg: n.organization_name || n.name, icon: 'NGO' })),
    ...recipientsData.biogasPlants.map(b => ({ ...b, displayOrg: b.plant_name || b.name, icon: 'BIOGAS' }))
  ];

  const filteredSpecificUsers = allSpecificUsers.filter(u => {
    const q = userSearchTerm.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) ||
           (u.displayOrg || '').toLowerCase().includes(q) ||
           (u.email || '').toLowerCase().includes(q) ||
           (u.role || '').toLowerCase().includes(q);
  });

  const selectedSpecificUser = allSpecificUsers.find(u => String(u.user_id) === String(specificUserId));

  // Compute calculated recipient count for composer
  const getEstimatedRecipientCount = () => {
    if (recipientType === 'SPECIFIC_USER') return selectedSpecificUser ? 1 : 0;
    if (recipientType === 'ALL_DONORS') return recipientsData.counts.totalDonors;
    if (recipientType === 'ALL_NGOS') return recipientsData.counts.totalNGOs;
    if (recipientType === 'ALL_BIOGAS') return recipientsData.counts.totalBiogasPlants;
    if (recipientType === 'ALL_USERS') return recipientsData.counts.totalUsers;
    return 0;
  };

  // Open Preview Confirmation
  const handleOpenPreview = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Please fill in both the notification title and message content.');
      return;
    }
    if (recipientType === 'SPECIFIC_USER' && !specificUserId) {
      alert('Please select a specific recipient from the list.');
      return;
    }
    if (getEstimatedRecipientCount() === 0) {
      alert('No eligible recipients found in the database for the selected target.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Submit Notification Broadcast
  const handleSendNotification = async () => {
    setSending(true);
    try {
      const payload = {
        recipientType,
        recipientId: recipientType === 'SPECIFIC_USER' ? specificUserId : null,
        title: title.trim(),
        message: message.trim(),
        priority,
        category,
        actionLabel: actionLabel.trim() || null,
        actionRoute: actionRoute.trim() || null
      };

      const res = await sendAdminNotification(payload, token);
      if (res.success) {
        setShowConfirmModal(false);
        setSendSuccessMessage(res.message || 'Notification successfully dispatched!');
        // Reset form
        setTitle('');
        setMessage('');
        setActionLabel('');
        setActionRoute('');
        setSpecificUserId('');
        // Refresh records
        fetchHistory();
        fetchStream();
        setTimeout(() => setSendSuccessMessage(''), 5000);
      } else {
        alert(res.message || 'Failed to dispatch notification.');
      }
    } catch (err) {
      alert('Connection error occurred while sending notification.');
    } finally {
      setSending(false);
    }
  };

  // View Sent Notification Details
  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await getAdminNotificationDetail(id, token);
      if (res.success) {
        setSelectedDetail(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const categoriesList = [
    'General Announcement',
    'Platform Update',
    'Donation',
    'Matching',
    'Transportation',
    'Verification',
    'Maintenance',
    'Emergency',
    'Other'
  ];

  const presetRoutes = [
    { label: 'None', value: '' },
    { label: 'Donor - My Donations (/donor/donations)', value: '/donor/donations' },
    { label: 'Donor - Create Donation (/donor/create-donation)', value: '/donor/create-donation' },
    { label: 'NGO - Incoming Requests (/ngo/incoming-requests)', value: '/ngo/incoming-requests' },
    { label: 'NGO - Matched Donations (/ngo/matched-donations)', value: '/ngo/matched-donations' },
    { label: 'Biogas - Waste Requests (/biogas/requests)', value: '/biogas/requests' },
    { label: 'Live Tracking (/tracking/1)', value: '/tracking/1' },
    { label: 'Impact Dashboard (/impact)', value: '/impact' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            PLATFORM COMMUNICATION & BROADCAST CENTER
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '0.3rem', color: '#111827' }}>
            Notification Center 🔔
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Dispatch targeted or platform-wide alerts to Donors, NGOs, and Biogas Plants using verified database records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => { fetchRecipients(); fetchHistory(); fetchStream(); }} 
            className="btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} /> Refresh Center
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {sendSuccessMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '1rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '700', fontSize: '0.95rem' }}>
          <CheckCircle2 size={20} />
          {sendSuccessMessage}
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('compose')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'compose' ? '800' : '600',
            background: activeTab === 'compose' ? '#16a34a' : 'transparent',
            color: activeTab === 'compose' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Send size={16} /> Compose Notification
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'history' ? '800' : '600',
            background: activeTab === 'history' ? '#16a34a' : 'transparent',
            color: activeTab === 'history' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <FileText size={16} /> Sent Notifications ({history.length})
        </button>

        <button
          onClick={() => setActiveTab('stream')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontWeight: activeTab === 'stream' ? '800' : '600',
            background: activeTab === 'stream' ? '#16a34a' : 'transparent',
            color: activeTab === 'stream' ? 'white' : '#4b5563',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Bell size={16} /> Activity Stream ({streamNotifications.length})
        </button>
      </div>

      {/* ========================================================
          TAB 1: COMPOSE NOTIFICATION
          ======================================================== */}
      {activeTab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main Form */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <form onSubmit={handleOpenPreview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Recipient Target Selector */}
              <div>
                <label className="form-label">TARGET RECIPIENTS:</label>
                <select
                  value={recipientType}
                  onChange={(e) => {
                    setRecipientType(e.target.value);
                    setSpecificUserId('');
                  }}
                  className="form-select"
                  style={{ fontWeight: '700' }}
                >
                  <option value="ALL_USERS">All Platform Users (Donors + NGOs + Biogas)</option>
                  <option value="ALL_DONORS">All Donors ({recipientsData.counts.totalDonors} registered)</option>
                  <option value="ALL_NGOS">All NGOs ({recipientsData.counts.totalNGOs} registered)</option>
                  <option value="ALL_BIOGAS">All Biogas Plants ({recipientsData.counts.totalBiogasPlants} registered)</option>
                  <option value="SPECIFIC_USER">Specific User / Organization</option>
                </select>
              </div>

              {/* Specific User Picker (if Specific User is selected) */}
              {recipientType === 'SPECIFIC_USER' && (
                <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <label className="form-label">SEARCH & SELECT SPECIFIC RECIPIENT:</label>
                  
                  <input
                    type="text"
                    placeholder="Search by name, organization, email, or role..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: '0.75rem' }}
                  />

                  {filteredSpecificUsers.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>
                      No eligible recipients match your search in the database.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem', background: 'white' }}>
                      {filteredSpecificUsers.map(u => {
                        const isSelected = String(u.user_id) === String(specificUserId);
                        return (
                          <div
                            key={`${u.role}-${u.user_id}`}
                            onClick={() => setSpecificUserId(u.user_id)}
                            style={{
                              padding: '0.6rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isSelected ? '#f0fdf4' : '#ffffff',
                              border: isSelected ? '1.5px solid #16a34a' : '1px solid #f3f4f6',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <strong style={{ color: '#111827', fontSize: '0.9rem', display: 'block' }}>
                                {u.displayOrg}
                              </strong>
                              <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                                Contact: {u.name} | {u.email}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span className={`badge ${u.role === 'NGO' ? 'badge-posted' : u.role === 'BIOGAS' ? 'badge-matched' : 'badge-accepted'}`} style={{ fontSize: '0.68rem' }}>
                                {u.role}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: u.status === 'Active' ? '#15803d' : '#ea580c', fontWeight: '700' }}>
                                {u.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedSpecificUser && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: '#dcfce7', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} /> Selected: <strong>{selectedSpecificUser.displayOrg}</strong> ({selectedSpecificUser.role})
                    </div>
                  )}
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="form-label">NOTIFICATION TITLE:</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Pickup Update / Platform Guidelines / Food Verification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Message Content */}
              <div>
                <label className="form-label">MESSAGE BODY:</label>
                <textarea
                  rows={4}
                  placeholder="Enter the full notification message to be delivered to recipient inboxes and devices..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Priority & Category Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">PRIORITY LEVEL:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="Important">Important Priority</option>
                    <option value="Urgent">Urgent / Critical Priority</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">CATEGORY:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Action Button / Route */}
              <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <label className="form-label">OPTIONAL ACTION BUTTON / LINK (OPTIONAL):</label>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                      BUTTON LABEL:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. View Donation / Review Match"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: '700', display: 'block', marginBottom: '0.3rem' }}>
                      INTERNAL APPLICATION ROUTE:
                    </span>
                    <select
                      value={actionRoute}
                      onChange={(e) => setActionRoute(e.target.value)}
                      className="form-select"
                    >
                      {presetRoutes.map(pr => (
                        <option key={pr.value} value={pr.value}>{pr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Trigger */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Eye size={18} /> Preview & Confirm Notification
                </button>
              </div>
            </form>
          </div>

          {/* Right Summary Sidebar Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={18} color="#16a34a" /> Target Audience Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Target Group:</span>
                  <strong style={{ color: '#111827' }}>
                    {recipientType.replace(/_/g, ' ')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Active Donors:</span>
                  <strong style={{ color: '#15803d' }}>{recipientsData.counts.totalDonors}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Verified NGOs:</span>
                  <strong style={{ color: '#0284c7' }}>{recipientsData.counts.totalNGOs}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Biogas Plants:</span>
                  <strong style={{ color: '#d97706' }}>{recipientsData.counts.totalBiogasPlants}</strong>
                </div>

                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '700' }}>TOTAL RECIPIENT REACH:</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#15803d', marginTop: '0.1rem' }}>
                    {getEstimatedRecipientCount()} Recipients
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', background: '#f9fafb', fontSize: '0.82rem', color: '#4b5563', lineHeight: '1.5' }}>
              <strong style={{ color: '#111827', display: 'block', marginBottom: '0.3rem' }}>🛡️ Security & Delivery Guarantee</strong>
              Notifications are stored in the database, broadcasted through WebSocket channels for live bell counters, and recorded in the immutable platform audit ledger.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: SENT NOTIFICATIONS HISTORY
          ======================================================== */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
              Sent Broadcast Ledger
            </h3>
            <button onClick={fetchHistory} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={13} /> Refresh History
            </button>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
              Loading sent notification history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#6b7280' }}>
              <Bell size={36} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
              <strong style={{ display: 'block', fontSize: '1.15rem', color: '#111827' }}>
                No notifications sent yet.
              </strong>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Broadcasts created by administrators will be tracked here with delivery statistics.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem' }}>Title & Category</th>
                  <th style={{ padding: '0.75rem' }}>Recipient Group</th>
                  <th style={{ padding: '0.75rem' }}>Reach</th>
                  <th style={{ padding: '0.75rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem' }}>Delivery / Read</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ color: '#111827', display: 'block' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontWeight: '700', color: '#15803d' }}>
                        {item.recipient_name || item.recipient_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '800', color: '#111827' }}>
                      {item.recipient_count} {item.recipient_count === 1 ? 'Recipient' : 'Recipients'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        background: item.priority === 'Urgent' ? '#fee2e2' : item.priority === 'Important' ? '#fef3c7' : '#f0fdf4',
                        color: item.priority === 'Urgent' ? '#dc2626' : item.priority === 'Important' ? '#d97706' : '#15803d'
                      }}>
                        {item.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>
                          ✓ {item.read_count || 0} Read
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                          / {item.unread_count || 0} Unread
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: REAL-TIME ACTIVITY STREAM
          ======================================================== */}
      {activeTab === 'stream' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
              Platform System Event Stream
            </h3>
            <button onClick={fetchStream} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              <RefreshCw size={13} /> Refresh Stream
            </button>
          </div>

          {streamNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
              <Bell size={36} color="#9ca3af" style={{ margin: '0 auto 0.75rem' }} />
              <strong style={{ display: 'block', fontSize: '1.15rem', color: '#111827' }}>
                No active notifications in stream.
              </strong>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {streamNotifications.map(sn => (
                <div key={sn.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ color: '#111827', fontSize: '0.95rem' }}>{sn.title}</strong>
                    <p style={{ color: '#4b5563', fontSize: '0.85rem', marginTop: '0.2rem' }}>{sn.message}</p>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{new Date(sn.created_at).toLocaleString()}</span>
                  </div>
                  <span className="badge badge-posted" style={{ fontSize: '0.7rem' }}>
                    {sn.type || 'IN_APP'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CONFIRMATION & PREVIEW MODAL BEFORE SENDING
          ======================================================== */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={20} color="#16a34a" /> Confirm Notification Dispatch
              </h3>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '1.25rem' }}>
              Please review the broadcast details before sending. Once sent, notifications will be delivered instantly to recipient devices and stored permanently in the audit ledger.
            </p>

            <div style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>TITLE:</span>
                <strong style={{ display: 'block', color: '#111827', fontSize: '1.05rem' }}>{title}</strong>
              </div>

              <div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>MESSAGE:</span>
                <p style={{ color: '#374151', margin: '0.2rem 0', lineHeight: '1.4' }}>{message}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>SEND TO:</span>
                  <strong style={{ display: 'block', color: '#15803d' }}>
                    {recipientType === 'SPECIFIC_USER' ? selectedSpecificUser?.displayOrg : recipientType.replace(/_/g, ' ')}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>RECIPIENTS COUNT:</span>
                  <strong style={{ display: 'block', color: '#111827' }}>
                    {getEstimatedRecipientCount()} Database Users
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>PRIORITY / CATEGORY:</span>
                  <strong style={{ display: 'block', color: '#111827' }}>
                    {priority} ({category})
                  </strong>
                </div>

                {actionLabel && (
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '700' }}>ACTION LINK:</span>
                    <span style={{ display: 'block', color: '#0284c7', fontWeight: '700' }}>
                      {actionLabel} ({actionRoute})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary"
                disabled={sending}
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Edit Notification
              </button>

              <button
                type="button"
                onClick={handleSendNotification}
                className="btn-primary"
                disabled={sending}
                style={{ padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {sending ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                {sending ? 'Dispatching...' : 'Confirm & Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SENT NOTIFICATION DETAIL MODAL
          ======================================================== */}
      {detailModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '650px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827' }}>
                Notification Dispatch Telemetry 📊
              </h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={20} />
              </button>
            </div>

            {detailLoading || !selectedDetail ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                Loading dispatch metrics...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>{selectedDetail.detail.title}</h4>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0.3rem', lineHeight: '1.4' }}>
                    {selectedDetail.detail.message}
                  </p>
                </div>

                {/* Delivery KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#15803d' }}>TOTAL REACH</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#166534' }}>
                      {selectedDetail.detail.recipient_count}
                    </div>
                  </div>

                  <div style={{ background: '#e0f2fe', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7' }}>READ / SEEN</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0369a1' }}>
                      {selectedDetail.detail.read_count}
                    </div>
                  </div>

                  <div style={{ background: '#fffbe6', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d97706' }}>PENDING / UNREAD</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#b45309' }}>
                      {selectedDetail.detail.unread_count}
                    </div>
                  </div>
                </div>

                {/* Recipient Users Breakdown */}
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.5rem', color: '#111827' }}>
                    Delivered User Accounts ({selectedDetail.recipients.length})
                  </h5>

                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>User / Org</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Role</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Read Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDetail.recipients.map((rec, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <strong>{rec.name}</strong> ({rec.email})
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>{rec.role}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{ fontWeight: '700', color: rec.is_read ? '#15803d' : '#ea580c' }}>
                                {rec.is_read ? '✓ Read' : 'Unread'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button onClick={() => setDetailModalOpen(false)} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                    Close Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./database/databaseConnection');
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const biogasRoutes = require('./routes/biogasRoutes');
const timerRoutes = require('./routes/timerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const fleetRoutes = require('./routes/fleetRoutes');
const impactRoutes = require('./routes/impactRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const timerService = require('./services/timerService');
const { setNotificationIO } = require('./services/notificationService');

const app = express();
const server = http.createServer(app);

const explicitOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (curl, mobile, etc.)
  if (explicitOrigins.includes(origin)) return true;
  // Allow any localhost or 127.0.0.1 port in development
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Return null, false for disallowed origins instead of throwing an unhandled Error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Initialize Socket.IO Server (Part 9)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('io', io);
setNotificationIO(io);

// Socket.IO Room Management & Event Handlers
io.on('connection', (socket) => {
  console.log('⚡ Client connected to Socket.IO real-time server:', socket.id);

  socket.on('join_donation_room', (donationId) => {
    socket.join(`donation_${donationId}`);
    console.log(`📡 Socket ${socket.id} joined donation room: donation_${donationId}`);
  });

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📡 Socket ${socket.id} joined user room: user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Mount REST API Routes (with singular and plural path aliases)
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/biogas', biogasRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/impact', impactRoutes);

app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api/admin', adminRoutes);

// Root Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SmartSurplus Ecosystem API',
    database: db.isConnected ? 'PostgreSQL Pool Active' : 'In-Memory Store Active',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend in Production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global 404 Handler for unhandled API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource or API route not found.' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize Background Food Safety Timer Service (Part 6)
timerService.startTimer(io);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${PORT} is busy. Freeing port and retrying...`);
      try {
        const { execSync } = require('child_process');
        const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
        const pids = output
          .split('\n')
          .map(line => line.trim().split(/\s+/).pop())
          .filter(pid => pid && pid !== '0' && !isNaN(pid) && parseInt(pid, 10) !== process.pid);
        [...new Set(pids)].forEach(pid => {
          try { execSync(`taskkill /F /PID ${pid}`); } catch (e) {}
        });
        setTimeout(() => {
          server.listen(PORT);
        }, 1200);
      } catch (e) {
        console.error(`Could not automatically free port ${PORT}:`, err.message);
      }
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log('==================================================');
    console.log(`🚀 SmartSurplus Ecosystem Server Running`);
    console.log(`📡 PORT: http://localhost:${PORT}`);
    console.log(`🌿 Socket.IO Real-Time Engine Active`);
    console.log('==================================================');
  });
}

module.exports = { app, server };

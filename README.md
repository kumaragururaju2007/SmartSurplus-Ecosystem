# SmartSurplus Ecosystem 🌿
> **AI-Assisted Surplus Food Redistribution & Circular Waste Management Platform**

SmartSurplus Ecosystem is a hackathon-ready platform designed to solve food waste and urban hunger simultaneously. It connects Food Donors, NGOs, Biogas Energy Plants, and Platform Admins into a unified zero-waste workflow.

---

## 🌟 Project Purpose & Core Workflow

### 1. Primary Path: Human Food Redistribution
```
Food Donor ➔ Create Surplus Listing ➔ Smart NGO Matching Engine ➔ Best Verified NGO ➔ Food Collected & Delivered
```

### 2. Secondary Path: Automatic Biogas Circular Energy Conversion
```
Food Listing ➔ Timer Expires (< Safe Collection Deadline) ➔ Automatic Redirection ➔ Nearest Biogas Plant ➔ Converted to Clean Biogas
```

---

## 🚀 Main Features

1. **Role-Based Access Control**: Secure JWT authentication for DONOR, NGO, BIOGAS, and ADMIN roles.
2. **Smart NGO Matching Engine**: 5-factor rule-based intelligent scoring system (`Distance 25%`, `Capacity 20%`, `Food Urgency 25%`, `Availability 15%`, `Response Rate 15%`).
3. **Food Safety Timers**: Category-specific collection windows (Cooked Gravy 2h, Cooked Dry 4h, Bakery 8h, Packaged 24h) with 30-minute warning alerts.
4. **Automatic Biogas Redirection**: Auto-redirects expired uncollected listings to the nearest suitable verified biogas plant using Haversine distance.
5. **Biogas Recovery Portal**: Full lifecycle management for biogas digestion facilities (Offered ➔ Accepted ➔ Pickup ➔ Collected ➔ Processed).
6. **OpenStreetMap Leaflet Live Route Tracking**: Reusable map visualization and tracking timeline from pickup to delivery.
7. **Socket.IO Real-Time Updates**: Multi-room real-time state synchronization without manual page refreshes.
8. **Multi-Channel Notifications**: Real-time In-App notification center with unread badge counter, Nodemailer Email, and SMS (with mock mode fallback).
9. **Impact & Corporate ESG Dashboard**: Verified environmental statistics (Food Rescued, Meals Supported, Waste Diverted, CO₂ Emissions Prevented) and printable ESG Impact Summary.
10. **Subscription & Stitch Sponsor Payment Integration**: Pricing tiers (`FREE`, `PRO MONTHLY ₹499`, `PRO YEARLY ₹4,999`) integrated with Stitch payment gateway.
11. **System Admin Portal**: Entity verification (NGO/Biogas approvals), user management (password hashes protected), and platform analytics.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), HTML5, Vanilla CSS (Glassmorphism & Emerald Green identity), Lucide React Icons, Leaflet.js / OpenStreetMap, Socket.IO Client.
- **Backend**: Node.js, Express.js, Socket.IO, Nodemailer, PostgreSQL `pg` pool driver (with zero-crash in-memory store fallback).
- **Database**: PostgreSQL (`smart_surplus`).
- **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing.

---

## 📁 Project Architecture & Folder Structure

```
SmartSurplus/
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Footer, Timer, DonationCard, Map, FoodCard
│   │   ├── pages/        # Dashboard, CreateDonation, MatchingResult, Biogas, Admin, Tracking, Impact, Subscription, Notifications
│   │   ├── services/     # authAPI, donationAPI, matchingAPI, ngoAPI, biogasAPI, notificationAPI, subscriptionAPI, paymentAPI, adminAPI
│   │   ├── styles/       # global.css, navbar.css, dashboard.css, donation.css, tracking.css, notifications.css, subscription.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── controllers/      # authController, donationController, ngoController, matchingController, biogasController, timerController, notificationController, impactController, subscriptionController, paymentController, adminController
│   ├── routes/           # REST API routes for all modules
│   ├── services/         # matchingService, timerService, notificationService, paymentService
│   ├── middleware/       # authentication.js (JWT & Role verification)
│   ├── database/         # databaseConnection.js (PostgreSQL pool + dev in-memory fallback)
│   ├── server.js         # Express server & Socket.IO initialization
│   └── package.json
├── database/
│   ├── createDatabase.sql
│   ├── createTables.sql
│   └── sampleData.sql
├── README.md
└── .env.example
```

---

## 🔐 Environment Variables (`.env.example`)

```ini
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=
DB_NAME=smart_surplus
DB_PORT=5432
JWT_SECRET=smartsurplus_super_secret_jwt_key_2026
EMAIL_USER=demo.smartsurplus@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
SMS_API_KEY=your_sms_gateway_api_key
SMS_SENDER_ID=SMARTSURPLUS
SMS_MODE=mock
PAYMENT_MODE=mock
STITCH_API_KEY=your_stitch_api_key
STITCH_SECRET=your_stitch_secret_key
STITCH_BASE_URL=https://api.stitch.money
```

---

## ⚡ How to Run the Project

### 1. Database Setup (Optional if running in PostgreSQL mode)
Execute the SQL files in order in your PostgreSQL server or run `npm run db:init`:
```bash
npm --prefix backend run db:init
```
Or manually using `psql`:
```bash
psql -U postgres -f database/createDatabase.sql
psql -U postgres -d smart_surplus -f database/createTables.sql
psql -U postgres -d smart_surplus -f database/sampleData.sql
```
*(Note: If PostgreSQL is offline, the backend automatically uses its pre-populated zero-crash in-memory store so hackathon demos run smoothly!)*

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 👥 Demo Test Accounts

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **DONOR** | `donor1@example.com` | `password123` | Create surplus listings, run matching, view tracking |
| **NGO** | `ngo1@example.com` | `password123` | View matched food requests, accept/reject |
| **BIOGAS** | `biogas1@example.com` | `password123` | View redirected food waste requests, process biogas |
| **ADMIN** | `admin@example.com` | `password123` | Entity verification (NGO/Biogas), platform analytics |

---

## 💡 How SmartSurplus Works (60-Second Hackathon Judge Pitch)

> "SmartSurplus does not simply connect food donors with NGOs. It intelligently determines the best destination for surplus food — prioritizing human consumption and redirecting uncollected food to biogas recovery before it becomes unmanaged waste."

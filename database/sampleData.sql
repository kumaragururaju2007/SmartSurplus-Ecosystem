-- SmartSurplus Clean Database Initialization (PostgreSQL)

-- 1. Truncate all tables cascading
TRUNCATE TABLE 
    gps_devices,
    trip_location_logs,
    trips,
    drivers,
    vehicles,
    admin_notifications,
    audit_logs,
    impact_records,
    payments,
    subscriptions,
    notifications,
    collections,
    biogas_matches,
    donation_matches,
    donations,
    organization_documents,
    distributions,
    ngo_requests,
    biogas_plants,
    ngos,
    donors,
    users
RESTART IDENTITY CASCADE;

-- 2. Insert Default Platform System Administrator
INSERT INTO users (id, name, email, phone, password, role, is_verified) VALUES
(1, 'Platform System Administrator', 'admin@gmail.com', '+919876543299', '$2a$10$c7IbIp7DBrya4r1k6LddpOPGdpiMcbExt3hh4Mue.7o22nrzUni/u', 'ADMIN', TRUE)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

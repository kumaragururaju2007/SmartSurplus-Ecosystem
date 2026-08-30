-- SmartSurplus Comprehensive Enterprise Database Schema Definition (PostgreSQL)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Donors Table
CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    business_type VARCHAR(100) DEFAULT 'Restaurant',
    fssai_number VARCHAR(50) DEFAULT NULL,
    fssai_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    is_fssai_verified BOOLEAN DEFAULT FALSE,
    is_business_verified BOOLEAN DEFAULT FALSE,
    is_location_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    verification_reason TEXT DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    verified_at TIMESTAMP DEFAULT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    pincode VARCHAR(20) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. NGOs Table (Enterprise Multi-Tier Verification Spec)
CREATE TABLE IF NOT EXISTS ngos (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    organization_name VARCHAR(150) NOT NULL,
    ngo_type VARCHAR(100) DEFAULT 'Trust',
    legal_registration_number VARCHAR(100) DEFAULT NULL,
    registration_number VARCHAR(100) DEFAULT NULL,
    registration_authority VARCHAR(150) DEFAULT NULL,
    registration_date VARCHAR(50) DEFAULT NULL,
    ngo_darpan_id VARCHAR(50) DEFAULT NULL,
    darpan_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    pan VARCHAR(30) DEFAULT NULL,
    tax_12a_12ab VARCHAR(50) DEFAULT NULL,
    tax_80g VARCHAR(50) DEFAULT NULL,
    fcra_number VARCHAR(50) DEFAULT NULL,
    fcra_status VARCHAR(50) DEFAULT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    designation VARCHAR(100) DEFAULT 'Authorized Representative',
    official_website VARCHAR(200) DEFAULT NULL,
    official_email VARCHAR(150) DEFAULT NULL,
    official_phone VARCHAR(30) DEFAULT NULL,
    year_established VARCHAR(10) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    pincode VARCHAR(20) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    food_capacity DECIMAL(10, 2) DEFAULT 0.00,
    max_distribution_capacity DECIMAL(10, 2) DEFAULT 0.00,
    meals_per_day INT DEFAULT 0,
    service_areas TEXT DEFAULT NULL,
    beneficiary_types TEXT DEFAULT NULL,
    donation_categories_required TEXT DEFAULT NULL,
    operating_days VARCHAR(100) DEFAULT NULL,
    operating_hours VARCHAR(100) DEFAULT NULL,
    emergency_support BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    verification_reason TEXT DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    verified_at TIMESTAMP DEFAULT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    response_rate DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3b. NGO Requests Table
CREATE TABLE IF NOT EXISTS ngo_requests (
    id SERIAL PRIMARY KEY,
    ngo_id INT NOT NULL,
    food_category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    quantity_unit VARCHAR(50) DEFAULT 'Meals',
    required_by TIMESTAMP NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    description TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 3c. NGO Distributions Table
CREATE TABLE IF NOT EXISTS distributions (
    id SERIAL PRIMARY KEY,
    ngo_id INT NOT NULL,
    donation_id INT DEFAULT NULL,
    distribution_date TIMESTAMP NOT NULL,
    quantity_received DECIMAL(10, 2) DEFAULT 0.00,
    quantity_distributed DECIMAL(10, 2) NOT NULL,
    beneficiaries_served INT NOT NULL,
    distribution_location VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) DEFAULT 'Cooked Food',
    notes TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 4. Biogas Plants Table (Enterprise GOBARdhan & MNRE Multi-Tier Verification Spec)
CREATE TABLE IF NOT EXISTS biogas_plants (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    plant_name VARCHAR(150) NOT NULL,
    plant_type VARCHAR(100) DEFAULT 'Biogas',
    operator_name VARCHAR(150) DEFAULT NULL,
    plant_registration_number VARCHAR(100) DEFAULT NULL,
    gobardhan_registration_number VARCHAR(100) DEFAULT NULL,
    gobardhan_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    mnre_application_id VARCHAR(100) DEFAULT NULL,
    mnre_programme VARCHAR(150) DEFAULT NULL,
    state_implementing_agency VARCHAR(150) DEFAULT NULL,
    commissioning_certificate_number VARCHAR(100) DEFAULT NULL,
    commissioning_date VARCHAR(50) DEFAULT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    designation VARCHAR(100) DEFAULT 'Plant Manager',
    operating_status VARCHAR(50) DEFAULT 'Operational',
    feedstock_capacity_daily DECIMAL(10, 2) DEFAULT 0.00,
    processing_capacity DECIMAL(10, 2) DEFAULT 0.00,
    capacity_unit VARCHAR(50) DEFAULT 'kg/day',
    biogas_production_capacity VARCHAR(100) DEFAULT NULL,
    cbg_production_capacity VARCHAR(100) DEFAULT NULL,
    power_generation_capacity VARCHAR(100) DEFAULT NULL,
    waste_processing_capacity VARCHAR(100) DEFAULT NULL,
    feedstock_types TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    pincode VARCHAR(20) DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    verification_reason TEXT DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    verified_at TIMESTAMP DEFAULT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4b. Organization Uploaded Verification Documents
CREATE TABLE IF NOT EXISTS organization_documents (
    id SERIAL PRIMARY KEY,
    organization_type VARCHAR(50) NOT NULL,
    organization_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT DEFAULT NULL,
    file_size VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'UPLOADED',
    rejection_reason TEXT DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    verified_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_id INT NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    food_category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    quantity_unit VARCHAR(50) DEFAULT 'Meals',
    description TEXT DEFAULT NULL,
    preparation_time TIMESTAMP NOT NULL,
    safe_until TIMESTAMP NOT NULL,
    pickup_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    quantity_received DECIMAL(10, 2) DEFAULT NULL,
    people_served_estimate INT DEFAULT NULL,
    people_served_actual INT DEFAULT NULL,
    people_served_type VARCHAR(20) DEFAULT 'ESTIMATED',
    impact_status VARCHAR(50) DEFAULT 'PENDING',
    impact_confirmed_by VARCHAR(150) DEFAULT NULL,
    impact_confirmed_at TIMESTAMP DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'POSTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE
);

-- 6. Donation Matches Table (NGO Matches)
CREATE TABLE IF NOT EXISTS donation_matches (
    id SERIAL PRIMARY KEY,
    donation_id INT NOT NULL,
    ngo_id INT NOT NULL,
    match_score DECIMAL(5, 2) NOT NULL,
    match_status VARCHAR(50) DEFAULT 'OFFERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
);

-- 7. Biogas Matches Table
CREATE TABLE IF NOT EXISTS biogas_matches (
    id SERIAL PRIMARY KEY,
    donation_id INT NOT NULL,
    biogas_plant_id INT NOT NULL,
    distance DECIMAL(8, 2) DEFAULT 0.00,
    match_score DECIMAL(5, 2) DEFAULT 90.00,
    match_status VARCHAR(50) DEFAULT 'OFFERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (biogas_plant_id) REFERENCES biogas_plants(id) ON DELETE CASCADE
);

-- 8. Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    donation_id INT UNIQUE NOT NULL,
    handler_type VARCHAR(50) NOT NULL,
    handler_id INT NOT NULL,
    current_status VARCHAR(50) DEFAULT 'ACCEPTED',
    completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    donation_id INT DEFAULT NULL,
    type VARCHAR(50) DEFAULT 'IN_APP',
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    plan_name VARCHAR(50) DEFAULT 'FREE',
    amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) DEFAULT 'STITCH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Impact Records Table
CREATE TABLE IF NOT EXISTS impact_records (
    id SERIAL PRIMARY KEY,
    donation_id INT UNIQUE NOT NULL,
    food_rescued_kg DECIMAL(10, 2) DEFAULT 0.00,
    meals_served INT DEFAULT 0,
    people_served_estimate INT DEFAULT NULL,
    people_served_actual INT DEFAULT NULL,
    people_served_type VARCHAR(20) DEFAULT 'ESTIMATED',
    impact_status VARCHAR(50) DEFAULT 'CONFIRMED',
    biogas_generated_m3 DECIMAL(10, 2) DEFAULT 0.00,
    waste_diverted_kg DECIMAL(10, 2) DEFAULT 0.00,
    co2_saved_kg DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- 13. Audit Logs Table (Admin Portal Control Center)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT DEFAULT NULL,
    admin_name VARCHAR(100) DEFAULT 'Platform Administrator',
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT DEFAULT NULL,
    target_name VARCHAR(150) DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    previous_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Admin Broadcast Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    sender_id INT DEFAULT 1,
    sender_name VARCHAR(100) DEFAULT 'Platform System Administrator',
    recipient_type VARCHAR(50) NOT NULL,
    recipient_id INT DEFAULT NULL,
    recipient_name VARCHAR(150) DEFAULT NULL,
    recipient_count INT DEFAULT 1,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General Announcement',
    priority VARCHAR(50) DEFAULT 'Normal',
    action_route VARCHAR(255) DEFAULT NULL,
    action_label VARCHAR(100) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'SENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Vehicles Table (NGO & Biogas Facility Fleets)
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    ngo_id INT DEFAULT NULL,
    biogas_plant_id INT DEFAULT NULL,
    handler_type VARCHAR(20) DEFAULT 'NGO',
    vehicle_number VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL DEFAULT 'Food Transport Van',
    vehicle_model VARCHAR(100) DEFAULT NULL,
    capacity VARCHAR(50) DEFAULT NULL,
    fuel_type VARCHAR(50) DEFAULT 'Diesel',
    gps_tracking_method VARCHAR(50) DEFAULT 'DRIVER_MOBILE_GPS',
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
    FOREIGN KEY (biogas_plant_id) REFERENCES biogas_plants(id) ON DELETE CASCADE
);

-- 16. Drivers Table (NGO & Biogas Drivers)
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    ngo_id INT DEFAULT NULL,
    biogas_plant_id INT DEFAULT NULL,
    handler_type VARCHAR(20) DEFAULT 'NGO',
    vehicle_id INT DEFAULT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(30) NOT NULL,
    license_number VARCHAR(50) DEFAULT NULL,
    employee_id VARCHAR(50) DEFAULT NULL,
    emergency_contact VARCHAR(30) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
    FOREIGN KEY (biogas_plant_id) REFERENCES biogas_plants(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- 17. Trips Table (Donation Food Rescue & Waste Transportation Trips)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    trip_code VARCHAR(50) UNIQUE NOT NULL,
    donation_id INT NOT NULL,
    ngo_id INT DEFAULT NULL,
    biogas_plant_id INT DEFAULT NULL,
    handler_type VARCHAR(20) DEFAULT 'NGO',
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8) DEFAULT NULL,
    pickup_lng DECIMAL(11, 8) DEFAULT NULL,
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10, 8) DEFAULT NULL,
    destination_lng DECIMAL(11, 8) DEFAULT NULL,
    tracking_method VARCHAR(50) DEFAULT 'DRIVER_MOBILE_GPS',
    current_lat DECIMAL(10, 8) DEFAULT NULL,
    current_lng DECIMAL(11, 8) DEFAULT NULL,
    current_accuracy DECIMAL(8, 2) DEFAULT NULL,
    current_speed DECIMAL(8, 2) DEFAULT NULL,
    current_heading DECIMAL(8, 2) DEFAULT NULL,
    last_gps_update TIMESTAMP DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'ASSIGNED',
    started_at TIMESTAMP DEFAULT NULL,
    completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
    FOREIGN KEY (biogas_plant_id) REFERENCES biogas_plants(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- 18. Trip Location Logs Table (Real GPS point telemetry history)
CREATE TABLE IF NOT EXISTS trip_location_logs (
    id SERIAL PRIMARY KEY,
    trip_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2) DEFAULT NULL,
    speed DECIMAL(8, 2) DEFAULT NULL,
    heading DECIMAL(8, 2) DEFAULT NULL,
    source VARCHAR(50) DEFAULT 'MOBILE_GPS',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 19. GPS IoT Devices Table
CREATE TABLE IF NOT EXISTS gps_devices (
    id SERIAL PRIMARY KEY,
    vehicle_id INT UNIQUE NOT NULL,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(100) DEFAULT NULL,
    imei VARCHAR(50) DEFAULT NULL,
    provider VARCHAR(100) DEFAULT 'SmartSurplus IoT',
    status VARCHAR(50) DEFAULT 'NOT_CONFIGURED',
    last_ping TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- 20. Driver Pairing Codes Table (Secure temporary 6-digit one-time pairing)
CREATE TABLE IF NOT EXISTS pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    trip_id INT DEFAULT NULL,
    handler_type VARCHAR(20) DEFAULT 'BIOGAS',
    handler_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

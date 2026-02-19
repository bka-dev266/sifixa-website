-- ============================================
-- SIFIXA BOOKING REDESIGN - DATABASE UPDATES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Customer Addresses Table
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    street_address VARCHAR(255) NOT NULL,
    apt_suite VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer 
    ON customer_addresses(customer_id);

-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own addresses" ON customer_addresses;
CREATE POLICY "Users manage own addresses" ON customer_addresses
    FOR ALL USING ((SELECT auth.uid()) = customer_id);

DROP POLICY IF EXISTS "Staff view all addresses" ON customer_addresses;
CREATE POLICY "Staff view all addresses" ON customer_addresses
    FOR SELECT USING (
        public.is_staff_user((SELECT auth.uid()))
    );


-- 2. Service Delivery Types Table
CREATE TABLE IF NOT EXISTS service_delivery_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_fee DECIMAL(10,2) DEFAULT 0,
    icon VARCHAR(50),
    estimated_time VARCHAR(50),
    requires_address BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- Seed service delivery types
INSERT INTO service_delivery_types (id, name, description, base_fee, icon, estimated_time, requires_address, display_order)
VALUES
    ('in_store', 'Visit Our Shop', 'Drop off at our location - no appointment needed', 0, 'Store', 'Same day', false, 1),
    ('mobile', 'We Come To You', 'Our technician visits your location', 25.00, 'MapPin', 'Same day', true, 2),
    ('pickup_delivery', 'Pickup & Delivery', 'We pick up your device and deliver it back', 15.00, 'Truck', '1-2 days', true, 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_fee = EXCLUDED.base_fee,
    icon = EXCLUDED.icon,
    estimated_time = EXCLUDED.estimated_time,
    requires_address = EXCLUDED.requires_address;


-- 3. Update appointments table with new columns
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS service_delivery_type VARCHAR(50) DEFAULT 'in_store';
    
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS service_address_id UUID;
    
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS service_address_json JSONB;

-- Add foreign key constraint if column was just created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_service_delivery_type_fkey'
    ) THEN
        ALTER TABLE appointments 
            ADD CONSTRAINT appointments_service_delivery_type_fkey 
            FOREIGN KEY (service_delivery_type) REFERENCES service_delivery_types(id);
    END IF;
EXCEPTION WHEN others THEN
    NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_service_address_id_fkey'
    ) THEN
        ALTER TABLE appointments 
            ADD CONSTRAINT appointments_service_address_id_fkey 
            FOREIGN KEY (service_address_id) REFERENCES customer_addresses(id);
    END IF;
EXCEPTION WHEN others THEN
    NULL;
END $$;


-- 4. Service Areas (for validating mobile service coverage)
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(10),
    service_delivery_type VARCHAR(50) REFERENCES service_delivery_types(id),
    additional_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(zip_code, service_delivery_type)
);

-- Seed some service areas (adjust for your actual coverage)
INSERT INTO service_areas (zip_code, city, state, service_delivery_type, is_active)
VALUES
    ('22630', 'Front Royal', 'VA', 'mobile', true),
    ('22630', 'Front Royal', 'VA', 'pickup_delivery', true),
    ('22601', 'Winchester', 'VA', 'mobile', true),
    ('22601', 'Winchester', 'VA', 'pickup_delivery', true),
    ('22602', 'Winchester', 'VA', 'mobile', true),
    ('22602', 'Winchester', 'VA', 'pickup_delivery', true)
ON CONFLICT DO NOTHING;


-- Success message
SELECT 'Booking redesign database updates applied!' as status;

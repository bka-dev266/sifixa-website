-- ====================================================
-- SIFIXA Repair Services Table
-- Run this in Supabase SQL Editor
-- ====================================================

-- ==================== REPAIR SERVICES TABLE ====================
CREATE TABLE IF NOT EXISTS repair_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service identification
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    
    -- Device categorization (flexible for future additions)
    device_type TEXT NOT NULL CHECK (device_type IN ('phone', 'tablet', 'computer', 'watch', 'console', 'desktop', 'other')),
    
    -- Pricing
    price_min NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_max NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_fixed NUMERIC(10,2), -- If set, use this instead of range
    
    -- Service details
    duration_estimate INT DEFAULT 60, -- Minutes
    warranty_days INT DEFAULT 30,
    
    -- Display
    icon TEXT DEFAULT 'Wrench',
    display_order INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by device type
CREATE INDEX IF NOT EXISTS idx_repair_services_device_type ON repair_services(device_type);
CREATE INDEX IF NOT EXISTS idx_repair_services_active ON repair_services(is_active);

-- RLS Policies
ALTER TABLE repair_services ENABLE ROW LEVEL SECURITY;

-- Public can read active services
DROP POLICY IF EXISTS "Public read repair_services" ON repair_services;
CREATE POLICY "Public read repair_services" ON repair_services 
FOR SELECT USING (is_active = true);

-- Staff can manage all services
DROP POLICY IF EXISTS "Staff manage repair_services" ON repair_services;
CREATE POLICY "Staff manage repair_services" ON repair_services 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at (uses existing function if available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS repair_services_updated_at ON repair_services;
        CREATE TRIGGER repair_services_updated_at
            BEFORE UPDATE ON repair_services
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==================== SEED DATA ====================
-- Phone Services
INSERT INTO repair_services (name, slug, description, device_type, price_min, price_max, duration_estimate, warranty_days, icon, display_order, is_popular) VALUES
('Screen Repair', 'phone-screen-repair', 'Fix cracked or damaged screens', 'phone', 79.00, 299.00, 45, 90, 'Smartphone', 1, true),
('Battery Replacement', 'phone-battery-replacement', 'Replace worn out battery', 'phone', 49.00, 89.00, 30, 90, 'Battery', 2, true),
('Charging Port Repair', 'phone-charging-port', 'Fix charging issues', 'phone', 59.00, 99.00, 45, 60, 'Plug', 3, false),
('Water Damage Repair', 'phone-water-damage', 'Recover water damaged devices', 'phone', 79.00, 199.00, 120, 30, 'Droplet', 4, false),
('Camera Repair', 'phone-camera-repair', 'Fix front or back camera', 'phone', 69.00, 149.00, 45, 60, 'Camera', 5, false),
('Speaker/Mic Repair', 'phone-speaker-mic', 'Fix audio issues', 'phone', 49.00, 99.00, 30, 60, 'Volume2', 6, false),
('Software Issues', 'phone-software', 'Fix software problems, updates, resets', 'phone', 39.00, 79.00, 60, 30, 'Settings', 7, false),
('Back Glass Repair', 'phone-back-glass', 'Replace cracked back glass', 'phone', 69.00, 149.00, 45, 60, 'Square', 8, false)
ON CONFLICT (slug) DO NOTHING;

-- Tablet Services
INSERT INTO repair_services (name, slug, description, device_type, price_min, price_max, duration_estimate, warranty_days, icon, display_order, is_popular) VALUES
('Screen Repair', 'tablet-screen-repair', 'Fix cracked or damaged screens', 'tablet', 99.00, 399.00, 60, 90, 'Tablet', 1, true),
('Battery Replacement', 'tablet-battery-replacement', 'Replace worn out battery', 'tablet', 69.00, 129.00, 45, 90, 'Battery', 2, true),
('Charging Port Repair', 'tablet-charging-port', 'Fix charging issues', 'tablet', 69.00, 119.00, 45, 60, 'Plug', 3, false),
('Software Issues', 'tablet-software', 'Fix software problems', 'tablet', 49.00, 99.00, 60, 30, 'Settings', 4, false)
ON CONFLICT (slug) DO NOTHING;

-- Computer (Laptop) Services
INSERT INTO repair_services (name, slug, description, device_type, price_min, price_max, duration_estimate, warranty_days, icon, display_order, is_popular) VALUES
('Screen Replacement', 'computer-screen', 'Replace damaged LCD/LED screen', 'computer', 149.00, 499.00, 90, 90, 'Monitor', 1, true),
('Battery Replacement', 'computer-battery', 'Replace worn out battery', 'computer', 79.00, 199.00, 30, 90, 'Battery', 2, true),
('Keyboard Replacement', 'computer-keyboard', 'Replace damaged keyboard', 'computer', 89.00, 249.00, 60, 60, 'Keyboard', 3, false),
('Hard Drive/SSD Upgrade', 'computer-storage', 'Upgrade or replace storage', 'computer', 99.00, 299.00, 45, 90, 'HardDrive', 4, false),
('RAM Upgrade', 'computer-ram', 'Upgrade memory', 'computer', 49.00, 149.00, 30, 90, 'Cpu', 5, false),
('Virus Removal', 'computer-virus', 'Remove malware and viruses', 'computer', 79.00, 149.00, 120, 30, 'Shield', 6, false),
('OS Installation', 'computer-os', 'Fresh OS installation', 'computer', 69.00, 129.00, 90, 30, 'Download', 7, false),
('Fan/Overheating Fix', 'computer-cooling', 'Fix overheating issues', 'computer', 69.00, 149.00, 60, 60, 'Fan', 8, false),
('DC Jack Repair', 'computer-dc-jack', 'Fix charging port', 'computer', 89.00, 179.00, 90, 60, 'Plug', 9, false)
ON CONFLICT (slug) DO NOTHING;

-- ==================== TIME SLOTS CAPACITY UPDATE ====================
-- Update time slots with correct capacity if they exist
UPDATE time_slots SET max_bookings = 2 WHERE name ILIKE '%morning%';
UPDATE time_slots SET max_bookings = 2 WHERE name ILIKE '%afternoon%';
UPDATE time_slots SET max_bookings = 1 WHERE name ILIKE '%evening%';

-- Done! Repair services table created with seed data.

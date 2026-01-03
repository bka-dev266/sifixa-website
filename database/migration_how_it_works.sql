-- =====================================================
-- Migration: How It Works dynamic content tables
-- Purpose: Enable dynamic tabs and steps for How It Works section
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table 1: Options (tabs)
CREATE TABLE IF NOT EXISTS landing_how_it_works_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Steps (nested under options)
CREATE TABLE IF NOT EXISTS landing_how_it_works_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID REFERENCES landing_how_it_works_options(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    icon TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE landing_how_it_works_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_how_it_works_steps ENABLE ROW LEVEL SECURITY;

-- Public read access for options
DROP POLICY IF EXISTS "Public read how_it_works_options" ON landing_how_it_works_options;
CREATE POLICY "Public read how_it_works_options" 
ON landing_how_it_works_options FOR SELECT 
USING (is_active = true);

-- Admin write access for options
DROP POLICY IF EXISTS "Admin write how_it_works_options" ON landing_how_it_works_options;
CREATE POLICY "Admin write how_it_works_options" 
ON landing_how_it_works_options FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Public read access for steps
DROP POLICY IF EXISTS "Public read how_it_works_steps" ON landing_how_it_works_steps;
CREATE POLICY "Public read how_it_works_steps" 
ON landing_how_it_works_steps FOR SELECT 
USING (is_active = true);

-- Admin write access for steps
DROP POLICY IF EXISTS "Admin write how_it_works_steps" ON landing_how_it_works_steps;
CREATE POLICY "Admin write how_it_works_steps" 
ON landing_how_it_works_steps FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Insert/Update section header
INSERT INTO landing_sections (section_key, title, subtitle, is_active, created_at, updated_at)
VALUES (
    'how_it_works',
    'How It Works',
    'Choose the service option that works best for you',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section_key) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    updated_at = NOW();

-- =====================================================
-- SEED DATA: Options
-- =====================================================

-- Clear existing data
DELETE FROM landing_how_it_works_steps;
DELETE FROM landing_how_it_works_options;

-- Insert Options
INSERT INTO landing_how_it_works_options (id, icon, title, description, display_order, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'MapPin', 'We Come To You', 'Our technician visits your location', 1, true),
    ('22222222-2222-2222-2222-222222222222', 'Store', 'Visit Our Shop', 'Walk in - no appointment needed', 2, true),
    ('33333333-3333-3333-3333-333333333333', 'Truck', 'Pickup & Delivery', 'We pick up and deliver back to you', 3, true);

-- =====================================================
-- SEED DATA: Steps for Option 1 - We Come To You
-- =====================================================
INSERT INTO landing_how_it_works_steps (option_id, step_number, icon, title, description, display_order, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 1, 'Calendar', 'Book Online', 'Schedule a convenient time', 1, true),
    ('11111111-1111-1111-1111-111111111111', 2, 'MapPin', 'We Arrive', 'Technician comes to your location', 2, true),
    ('11111111-1111-1111-1111-111111111111', 3, 'Wrench', 'Quick Repair', 'Fixed on the spot', 3, true),
    ('11111111-1111-1111-1111-111111111111', 4, 'CheckCircle', 'All Done!', 'Back to working perfectly', 4, true);

-- =====================================================
-- SEED DATA: Steps for Option 2 - Visit Our Shop
-- =====================================================
INSERT INTO landing_how_it_works_steps (option_id, step_number, icon, title, description, display_order, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222222', 1, 'Store', 'Walk In', 'Visit our convenient location', 1, true),
    ('22222222-2222-2222-2222-222222222222', 2, 'ClipboardCheck', 'Quick Assessment', 'Free diagnosis in minutes', 2, true),
    ('22222222-2222-2222-2222-222222222222', 3, 'Wrench', 'Expert Repair', 'Fixed while you wait', 3, true),
    ('22222222-2222-2222-2222-222222222222', 4, 'CheckCircle', 'All Done!', 'Back to working perfectly', 4, true);

-- =====================================================
-- SEED DATA: Steps for Option 3 - Pickup & Delivery
-- =====================================================
INSERT INTO landing_how_it_works_steps (option_id, step_number, icon, title, description, display_order, is_active)
VALUES
    ('33333333-3333-3333-3333-333333333333', 1, 'Calendar', 'Schedule Pickup', 'Book a convenient time', 1, true),
    ('33333333-3333-3333-3333-333333333333', 2, 'Truck', 'We Collect', 'Driver picks up your device', 2, true),
    ('33333333-3333-3333-3333-333333333333', 3, 'Wrench', 'We Repair', 'Fixed at our workshop', 3, true),
    ('33333333-3333-3333-3333-333333333333', 4, 'PackageCheck', 'Delivered Back', 'Returned to your door', 4, true);

-- Verify the data
SELECT 'Options' as type, o.title, o.icon, COUNT(s.id) as step_count
FROM landing_how_it_works_options o
LEFT JOIN landing_how_it_works_steps s ON s.option_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.title, o.icon
ORDER BY o.display_order;

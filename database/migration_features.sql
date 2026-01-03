-- =====================================================
-- Migration: Why Choose Us / Features dynamic content
-- Purpose: Enable dynamic feature cards for Why Choose Us section
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create landing_features table
CREATE TABLE IF NOT EXISTS landing_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE landing_features ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read landing_features" ON landing_features;
CREATE POLICY "Public read landing_features" 
ON landing_features FOR SELECT 
USING (is_active = true);

-- Admin write access
DROP POLICY IF EXISTS "Admin write landing_features" ON landing_features;
CREATE POLICY "Admin write landing_features" 
ON landing_features FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Insert/Update section header
INSERT INTO landing_sections (section_key, title, subtitle, is_active, created_at, updated_at)
VALUES (
    'why_choose_us',
    'Why Choose SIFIXA?',
    'The smartest way to repair your device',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section_key) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    updated_at = NOW();

-- =====================================================
-- SEED DATA: Features
-- =====================================================

-- Clear existing features
DELETE FROM landing_features;

-- Insert active features (displayed on page)
INSERT INTO landing_features (icon, title, description, display_order, is_active)
VALUES
    ('Clock', 'Fast Turnaround', 'Most repairs completed in under 30 minutes.', 1, true),
    ('ShieldCheck', 'Lifetime Warranty', 'We stand by our parts and labor with a lifetime warranty.', 2, true),
    ('Truck', 'We Come to You', 'Home, office, or coffee shop - we meet you anywhere.', 3, true),
    ('Wrench', 'Expert Technicians', 'Certified professionals with years of experience.', 4, true);

-- Insert additional inactive features (available in admin for future use)
INSERT INTO landing_features (icon, title, description, display_order, is_active)
VALUES
    ('DollarSign', 'Fair Pricing', 'Transparent quotes with no hidden fees.', 5, false),
    ('BadgeCheck', 'Genuine Parts', 'Only high-quality OEM and certified parts used.', 6, false);

-- Verify the data
SELECT icon, title, description, display_order, is_active 
FROM landing_features 
ORDER BY display_order;

SELECT section_key, title, subtitle 
FROM landing_sections 
WHERE section_key = 'why_choose_us';

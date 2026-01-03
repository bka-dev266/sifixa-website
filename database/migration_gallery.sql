-- =====================================================
-- Migration: Before & After Gallery dynamic content
-- Purpose: Enable dynamic gallery slideshow for Before & After section
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create landing_gallery table
CREATE TABLE IF NOT EXISTS landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    before_image TEXT NOT NULL,
    after_image TEXT NOT NULL,
    device_type TEXT DEFAULT 'phone',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read landing_gallery" ON landing_gallery;
CREATE POLICY "Public read landing_gallery" 
ON landing_gallery FOR SELECT 
USING (is_active = true);

-- Admin write access
DROP POLICY IF EXISTS "Admin write landing_gallery" ON landing_gallery;
CREATE POLICY "Admin write landing_gallery" 
ON landing_gallery FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- Insert/Update section header
INSERT INTO landing_sections (section_key, title, subtitle, is_active, created_at, updated_at)
VALUES (
    'gallery',
    'Before & After',
    'See the transformation - real repairs by our expert technicians',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section_key) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    updated_at = NOW();

-- =====================================================
-- SEED DATA: Gallery items
-- =====================================================

-- Clear existing gallery items
DELETE FROM landing_gallery;

-- Insert gallery items (use gallery/ paths - images should be in public/gallery/)
INSERT INTO landing_gallery (title, description, before_image, after_image, device_type, display_order, is_active)
VALUES
    ('iPhone Screen Repair', 'Shattered screen restored to brand new condition', 'phone-before.png', 'phone-after.png', 'phone', 1, true),
    ('MacBook Screen Replacement', 'Cracked display replaced with original parts', 'laptop-before.png', 'laptop-after.png', 'laptop', 2, true),
    ('Samsung Galaxy Screen Repair', 'Severely cracked display restored to perfect condition', 'samsung-before.png', 'samsung-after.png', 'phone', 3, true),
    ('iPad Screen Replacement', 'Damaged tablet screen replaced with premium parts', 'ipad-before.png', 'ipad-after.png', 'tablet', 4, true),
    ('iPhone Battery Replacement', 'Swollen battery replaced - 100% health restored', 'battery-before.png', 'battery-after.png', 'phone', 5, true);

-- Verify the data
SELECT title, device_type, display_order, is_active 
FROM landing_gallery 
ORDER BY display_order;

SELECT section_key, title, subtitle 
FROM landing_sections 
WHERE section_key = 'gallery';

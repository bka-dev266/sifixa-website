-- =====================================================
-- Migration: Add link_text to landing_services
-- Purpose: Enable custom CTA text for each service card
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add link_text column if missing
ALTER TABLE landing_services ADD COLUMN IF NOT EXISTS link_text TEXT DEFAULT 'Explore Services';

-- Insert/Update services_showcase section header
INSERT INTO landing_sections (section_key, title, subtitle, is_active, created_at, updated_at)
VALUES (
    'services_showcase',
    'Expert Repair Services',
    'We fix all major brands and devices with premium quality parts and certified technicians.',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section_key) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    updated_at = NOW();

-- Update existing services with link_text if null
UPDATE landing_services 
SET link_text = COALESCE(link_text, 'Explore Services')
WHERE link_text IS NULL;

-- Verify the changes
SELECT 'landing_services' as table_name, id, title, icon, link_text, display_order 
FROM landing_services 
WHERE is_active = true 
ORDER BY display_order;

SELECT 'landing_sections' as table_name, section_key, title, subtitle 
FROM landing_sections 
WHERE section_key = 'services_showcase';

-- =====================================================
-- Migration: Add new fields to landing_hero table
-- Purpose: Enable full dynamic content for Hero section
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add new columns for hero section content
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT 'Trusted by 2,500+ Happy Customers';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS highlight TEXT DEFAULT 'Done Right!';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT 'hero-repair.png';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS stat_rating TEXT DEFAULT '4.9';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS stat_avg_time TEXT DEFAULT '30 min';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS stat_warranty TEXT DEFAULT '90 Days';
ALTER TABLE landing_hero ADD COLUMN IF NOT EXISTS stat_repairs TEXT DEFAULT '15K+';

-- Update existing active record with default values (for any NULL fields)
UPDATE landing_hero SET
    badge_text = COALESCE(badge_text, 'Trusted by 2,500+ Happy Customers'),
    highlight = COALESCE(highlight, 'Done Right!'),
    hero_image = COALESCE(hero_image, 'hero-repair.png'),
    stat_rating = COALESCE(stat_rating, '4.9'),
    stat_avg_time = COALESCE(stat_avg_time, '30 min'),
    stat_warranty = COALESCE(stat_warranty, '90 Days'),
    stat_repairs = COALESCE(stat_repairs, '15K+'),
    updated_at = NOW()
WHERE is_active = true;

-- Verify the changes
SELECT 
    id,
    title,
    subtitle,
    badge_text,
    highlight,
    hero_image,
    cta_text,
    cta_link,
    secondary_cta_text,
    secondary_cta_link,
    stat_rating,
    stat_avg_time,
    stat_warranty,
    stat_repairs,
    is_active
FROM landing_hero
WHERE is_active = true;

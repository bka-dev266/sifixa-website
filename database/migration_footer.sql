-- =====================================================
-- Migration: Footer dynamic content tables
-- Purpose: Enable dynamic footer content (settings, links, social)
-- Run this in Supabase SQL Editor
-- =====================================================

-- ==================== SITE SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings" 
ON site_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin write site_settings" ON site_settings;
CREATE POLICY "Admin write site_settings" 
ON site_settings FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- ==================== SOCIAL LINKS TABLE ====================
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read social_links" ON social_links;
CREATE POLICY "Public read social_links" 
ON social_links FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admin write social_links" ON social_links;
CREATE POLICY "Admin write social_links" 
ON social_links FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- ==================== FOOTER LINKS TABLE ====================
CREATE TABLE IF NOT EXISTS footer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_key TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read footer_links" ON footer_links;
CREATE POLICY "Public read footer_links" 
ON footer_links FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Admin write footer_links" ON footer_links;
CREATE POLICY "Admin write footer_links" 
ON footer_links FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA: Site Settings
-- =====================================================

INSERT INTO site_settings (setting_key, setting_value)
VALUES
(
    'brand',
    '{"name": "SIFIXA", "tagline": "Premium Device Repair", "logo_icon": "Smartphone"}'::jsonb
),
(
    'contact',
    '{
        "address": "123 Tech Street, Harrisonburg, VA 22801",
        "phone": "(540) 123-4567",
        "supportEmail": "support@sifixa.com",
        "infoEmail": "info@sifixa.com",
        "hours": "Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM"
    }'::jsonb
),
(
    'copyright',
    '{"text": "© 2026 SIFIXA. All rights reserved."}'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- =====================================================
-- SEED DATA: Social Links
-- =====================================================

DELETE FROM social_links;

INSERT INTO social_links (platform, url, display_order, is_active)
VALUES
    ('facebook', 'https://facebook.com/sifixa', 1, true),
    ('twitter', 'https://twitter.com/sifixa', 2, true),
    ('instagram', 'https://instagram.com/sifixa', 3, true),
    ('linkedin', 'https://linkedin.com/company/sifixa', 4, true);

-- =====================================================
-- SEED DATA: Footer Links - Quick Links
-- =====================================================

DELETE FROM footer_links;

INSERT INTO footer_links (column_key, label, url, display_order, is_active)
VALUES
    ('quick_links', 'Home', '/', 1, true),
    ('quick_links', 'Services', '/services', 2, true),
    ('quick_links', 'Book Repair', '/booking', 3, true),
    ('quick_links', 'Track Order', '/track', 4, true),
    ('quick_links', 'Sell Device', '/sell', 5, true),
    ('quick_links', 'FAQ', '/faq', 6, true),
    ('quick_links', 'Contact', '/contact', 7, true);

-- =====================================================
-- SEED DATA: Footer Links - Services
-- =====================================================

INSERT INTO footer_links (column_key, label, url, display_order, is_active)
VALUES
    ('services', 'Screen Replacement', '/services', 1, true),
    ('services', 'Battery Replacement', '/services', 2, true),
    ('services', 'Water Damage Repair', '/services', 3, true),
    ('services', 'Software Issues', '/services', 4, true),
    ('services', 'Data Recovery', '/services', 5, true),
    ('services', 'Computer Repair', '/services', 6, true);

-- =====================================================
-- SEED DATA: Footer Links - Legal
-- =====================================================

INSERT INTO footer_links (column_key, label, url, display_order, is_active)
VALUES
    ('legal', 'Privacy Policy', '/privacy', 1, true),
    ('legal', 'Terms of Use', '/terms', 2, true),
    ('legal', 'Refund Policy', '/refund', 3, true),
    ('legal', 'Warranty Policy', '/warranty', 4, true),
    ('legal', 'Cookie Policy', '/cookies', 5, true);

-- Verify the data
SELECT 'site_settings' as table_name, setting_key FROM site_settings;
SELECT 'social_links' as table_name, platform, url FROM social_links ORDER BY display_order;
SELECT 'footer_links' as table_name, column_key, label, url FROM footer_links ORDER BY column_key, display_order;

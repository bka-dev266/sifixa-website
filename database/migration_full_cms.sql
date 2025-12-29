-- =====================================================
-- FULL WEBSITE CMS - Additional Tables Migration
-- Run this AFTER migration_landing_cms.sql
-- =====================================================

-- =====================================================
-- 1. SITE SETTINGS (Brand, Social Links, Contact)
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for landing_settings
ALTER TABLE landing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to settings" ON landing_settings FOR SELECT USING (true);
CREATE POLICY "Admin write access to settings" ON landing_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed site settings
INSERT INTO landing_settings (setting_key, setting_value) VALUES
('brand', '{"name": "SIFIXA", "tagline": "Premium Device Repair", "logo_url": null}'),
('social_links', '{"facebook": "#", "twitter": "#", "instagram": "#", "linkedin": "#"}'),
('contact', '{"address": "123 Repair Street, Tech City, TC 90210", "phone": "(555) 123-4567", "supportEmail": "support@sifixa.com", "infoEmail": "info@sifixa.com", "hours": "Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM"}'),
('services_header', '{"title": "Expert Repair Services", "subtitle": "We fix all major brands and devices with premium quality parts and certified technicians."}')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 2. PRICING CATEGORIES & ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    icon TEXT DEFAULT 'Smartphone',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landing_pricing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES landing_pricing(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for pricing
ALTER TABLE landing_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pricing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pricing" ON landing_pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write pricing" ON landing_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read pricing items" ON landing_pricing_items FOR SELECT USING (true);
CREATE POLICY "Admin write pricing items" ON landing_pricing_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed pricing data
INSERT INTO landing_pricing (id, category, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Phone Screen', 'Smartphone', 1),
('22222222-2222-2222-2222-222222222222', 'Phone Battery', 'Battery', 2),
('33333333-3333-3333-3333-333333333333', 'Tablet Repair', 'Tablet', 3),
('44444444-4444-4444-4444-444444444444', 'Laptop Repair', 'Laptop', 4),
('55555555-5555-5555-5555-555555555555', 'Desktop & PC', 'Monitor', 5),
('66666666-6666-6666-6666-666666666666', 'Data Recovery', 'HardDrive', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO landing_pricing_items (category_id, name, price, display_order) VALUES
-- Phone Screen
('11111111-1111-1111-1111-111111111111', 'iPhone Screen Repair', 'From $79', 1),
('11111111-1111-1111-1111-111111111111', 'Samsung Screen Repair', 'From $69', 2),
('11111111-1111-1111-1111-111111111111', 'Other Android Screen', 'From $59', 3),
-- Phone Battery
('22222222-2222-2222-2222-222222222222', 'iPhone Battery', 'From $49', 1),
('22222222-2222-2222-2222-222222222222', 'Samsung Battery', 'From $45', 2),
('22222222-2222-2222-2222-222222222222', 'Other Android Battery', 'From $39', 3),
-- Tablet
('33333333-3333-3333-3333-333333333333', 'iPad Screen Repair', 'From $129', 1),
('33333333-3333-3333-3333-333333333333', 'iPad Battery', 'From $79', 2),
('33333333-3333-3333-3333-333333333333', 'Samsung Tab Screen', 'From $99', 3),
-- Laptop
('44444444-4444-4444-4444-444444444444', 'Laptop Screen', 'From $149', 1),
('44444444-4444-4444-4444-444444444444', 'Laptop Battery', 'From $89', 2),
('44444444-4444-4444-4444-444444444444', 'Keyboard Replacement', 'From $99', 3),
-- Desktop
('55555555-5555-5555-5555-555555555555', 'OS Reinstall', 'From $49', 1),
('55555555-5555-5555-5555-555555555555', 'Virus Removal', 'From $59', 2),
('55555555-5555-5555-5555-555555555555', 'Hardware Upgrade', 'From $79', 3),
-- Data Recovery
('66666666-6666-6666-6666-666666666666', 'Basic Recovery', 'From $99', 1),
('66666666-6666-6666-6666-666666666666', 'Advanced Recovery', 'From $199', 2),
('66666666-6666-6666-6666-666666666666', 'SSD/HDD Failure', 'From $299', 3);

-- =====================================================
-- 3. GALLERY (Before/After)
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    before_image TEXT,
    after_image TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery" ON landing_gallery FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write gallery" ON landing_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed gallery
INSERT INTO landing_gallery (title, description, before_image, after_image, display_order) VALUES
('iPhone Screen Repair', 'Shattered screen restored to brand new condition', '/gallery/phone-before.png', '/gallery/phone-after.png', 1),
('MacBook Screen Replacement', 'Cracked MacBook display replaced with original panel', '/gallery/laptop-before.png', '/gallery/laptop-after.png', 2),
('iPad Digitizer Repair', 'Unresponsive touch screen fully restored', '/gallery/tablet-before.png', '/gallery/tablet-after.png', 3),
('iPhone Battery Replacement', 'Swollen battery replaced - 100% health restored', '/gallery/battery-before.png', '/gallery/battery-after.png', 4);

-- =====================================================
-- 4. LEGAL PAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_legal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE landing_legal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read legal" ON landing_legal FOR SELECT USING (true);
CREATE POLICY "Admin write legal" ON landing_legal FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed legal pages with placeholder content
INSERT INTO landing_legal (page_key, title, content) VALUES
('privacy', 'Privacy Policy', '## Privacy Policy

**Last Updated:** January 2025

### Information We Collect
We collect information you provide directly, including name, email, phone, and device information when booking repairs.

### How We Use Information
- To provide repair services
- To communicate about your orders
- To improve our services

### Contact Us
For privacy questions, contact privacy@sifixa.com'),

('terms', 'Terms of Use', '## Terms of Use

**Last Updated:** January 2025

### Service Agreement
By using SIFIXA services, you agree to these terms.

### Repair Services
- Estimates are provided before work begins
- We use quality replacement parts
- Warranty covers our workmanship

### Liability
We are not liable for pre-existing damage or data loss.'),

('refund', 'Refund Policy', '## Refund Policy

**Last Updated:** January 2025

### Refund Eligibility
- Refunds available within 30 days if repair fails
- No refund for physical damage after pickup
- Diagnostic fees are non-refundable

### Process
Contact support@sifixa.com to request a refund.'),

('warranty', 'Warranty Policy', '## Warranty Policy

**Last Updated:** January 2025

### Coverage
- Lifetime warranty on parts and labor
- Covers defects in replacement parts
- Covers our workmanship

### Exclusions
- Physical damage after repair
- Water damage after repair
- Unauthorized modifications'),

('cookies', 'Cookie Policy', '## Cookie Policy

**Last Updated:** January 2025

### What Are Cookies
Cookies are small files stored on your device to improve your experience.

### Cookies We Use
- Essential cookies for site function
- Analytics cookies to improve our service

### Managing Cookies
You can disable cookies in your browser settings.')
ON CONFLICT (page_key) DO NOTHING;

-- =====================================================
-- 5. WHY CHOOSE US FEATURES (add to sections)
-- =====================================================
INSERT INTO landing_sections (section_key, title, subtitle, content) VALUES
('why_choose_us', 'Why Choose SIFIXA?', 'The smartest way to repair your device', '{
  "features": [
    {"icon": "Clock", "title": "Fast Turnaround", "description": "Most repairs completed in under 30 minutes."},
    {"icon": "ShieldCheck", "title": "Lifetime Warranty", "description": "We stand by our parts and labor with a lifetime warranty."},
    {"icon": "Truck", "title": "We Come to You", "description": "Home, office, or coffee shop - we meet you anywhere."},
    {"icon": "Wrench", "title": "Expert Technicians", "description": "Certified professionals with years of experience."}
  ]
}')
ON CONFLICT (section_key) DO UPDATE SET content = EXCLUDED.content;

-- Add How It Works section
INSERT INTO landing_sections (section_key, title, subtitle, content) VALUES
('how_it_works', 'How It Works', 'Choose the service option that works best for you', '{}')
ON CONFLICT (section_key) DO NOTHING;

-- Add CTA sections
INSERT INTO landing_sections (section_key, title, subtitle, content) VALUES
('cta', 'Ready to get your device fixed?', 'Book a repair now and get your device back in perfect condition.', '{"primaryButtonText": "Book Repair Now", "primaryButtonLink": "/booking", "secondaryButtonText": "Contact Us", "secondaryButtonLink": "/contact"}'),
('sell_cta', 'Sell Your Old Device', 'Got an old phone, tablet, or laptop? Get instant cash! We offer the best prices for your used devices.', '{"buttonText": "Get a Quote", "buttonLink": "/sell"}')
ON CONFLICT (section_key) DO NOTHING;

SELECT 'Migration completed successfully!' as status;

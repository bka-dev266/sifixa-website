-- ====================================================
-- SIFIXA Landing Page CMS Tables
-- Run this in Supabase SQL Editor
-- ====================================================

-- ==================== LANDING HERO ====================
CREATE TABLE IF NOT EXISTS landing_hero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Professional Device Repair',
    subtitle TEXT DEFAULT 'Fast, reliable repairs for phones, tablets, and computers',
    cta_text TEXT DEFAULT 'Book Repair Now',
    cta_link TEXT DEFAULT '/booking',
    secondary_cta_text TEXT DEFAULT 'Track Repair',
    secondary_cta_link TEXT DEFAULT '/track',
    background_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LANDING SERVICES ====================
CREATE TABLE IF NOT EXISTS landing_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Smartphone',
    image TEXT,
    link TEXT DEFAULT '/services',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LANDING TESTIMONIALS ====================
CREATE TABLE IF NOT EXISTS landing_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_title TEXT,
    customer_avatar TEXT,
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    device_repaired TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LANDING FAQ ====================
CREATE TABLE IF NOT EXISTS landing_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== LANDING SECTIONS ====================
-- For flexible content blocks (How It Works, Why Choose Us, CTA sections)
CREATE TABLE IF NOT EXISTS landing_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL, -- 'how_it_works', 'why_choose_us', 'cta', 'sell_cta'
    title TEXT,
    subtitle TEXT,
    content JSONB DEFAULT '{}', -- Flexible JSON for section-specific data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RLS POLICIES ====================
-- Enable RLS on all tables
ALTER TABLE landing_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_sections ENABLE ROW LEVEL SECURITY;

-- Public read access (for landing page)
CREATE POLICY "Public read landing_hero" ON landing_hero FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read landing_services" ON landing_services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read landing_testimonials" ON landing_testimonials FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read landing_faq" ON landing_faq FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read landing_sections" ON landing_sections FOR SELECT TO anon, authenticated USING (is_active = true);

-- Admin write access (authenticated users can manage content)
CREATE POLICY "Admin write landing_hero" ON landing_hero FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write landing_services" ON landing_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write landing_testimonials" ON landing_testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write landing_faq" ON landing_faq FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write landing_sections" ON landing_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== SEED DEFAULT DATA ====================
-- Insert default hero
INSERT INTO landing_hero (title, subtitle, cta_text, cta_link, secondary_cta_text, secondary_cta_link)
VALUES (
    'Professional Device Repair You Can Trust',
    'Fast, reliable repairs for phones, tablets, and computers. Same-day service available with certified technicians.',
    'Book Repair Now',
    '/booking',
    'Track Repair',
    '/track'
) ON CONFLICT DO NOTHING;

-- Insert default services
INSERT INTO landing_services (title, description, icon, image, display_order) VALUES
('Smartphone Repair', 'Screen replacement, battery, charging port, camera and more for all major brands.', 'Smartphone', '/smartphone-repair.png', 1),
('Tablet Repair', 'iPad, Samsung Tab, and other tablet repairs with genuine parts and warranty.', 'Tablet', '/tablet-repair.png', 2),
('Computer Repair', 'Laptop screen, keyboard, battery, SSD upgrades, and software troubleshooting.', 'Laptop', '/computer-repair.png', 3)
ON CONFLICT DO NOTHING;

-- Insert default testimonials
INSERT INTO landing_testimonials (customer_name, customer_title, rating, content, device_repaired, display_order) VALUES
('Sarah Johnson', 'iPhone User', 5, 'Amazing service! They fixed my cracked iPhone screen in just 30 minutes. The quality is perfect and the price was very reasonable.', 'iPhone 14 Pro', 1),
('Michael Chen', 'MacBook Owner', 5, 'Professional and fast. My MacBook keyboard was replaced same day. Highly recommend their computer repair services!', 'MacBook Pro', 2),
('Emily Rodriguez', 'Samsung User', 5, 'Best repair shop in town! They saved my Galaxy with water damage when other shops said it was impossible.', 'Samsung Galaxy S23', 3)
ON CONFLICT DO NOTHING;

-- Insert default FAQ
INSERT INTO landing_faq (question, answer, category, display_order) VALUES
('How long does a typical repair take?', 'Most repairs are completed within 30-60 minutes. Complex repairs like water damage may take 24-48 hours for proper diagnosis and repair.', 'General', 1),
('Do you offer a warranty on repairs?', 'Yes! All our repairs come with a 90-day warranty covering parts and labor. Screen replacements include a 6-month warranty.', 'Warranty', 2),
('What payment methods do you accept?', 'We accept cash, all major credit cards, Apple Pay, Google Pay, and PayPal. We also offer financing for repairs over $200.', 'Payment', 3),
('Do you use original parts?', 'We offer both OEM (original) and high-quality aftermarket parts. You can choose based on your budget and preferences.', 'Parts', 4),
('Can I track my repair status?', 'Absolutely! After booking, you receive a tracking number. Use our Track Repair page to see real-time updates on your device.', 'Service', 5)
ON CONFLICT DO NOTHING;

-- Insert default sections
INSERT INTO landing_sections (section_key, title, subtitle, content) VALUES
('how_it_works', 'How It Works', 'Simple 4-step process to get your device repaired', '{
    "steps": [
        {"step": 1, "title": "Book Online", "description": "Schedule your repair in just 60 seconds", "icon": "Calendar"},
        {"step": 2, "title": "Drop Off", "description": "Bring your device to our store", "icon": "MapPin"},
        {"step": 3, "title": "We Repair", "description": "Expert technicians fix your device", "icon": "Wrench"},
        {"step": 4, "title": "Pick Up", "description": "Get your device back like new", "icon": "CheckCircle"}
    ]
}'),
('why_choose_us', 'Why Choose SIFIXA', 'We are committed to providing the best repair experience', '{
    "features": [
        {"title": "Certified Technicians", "description": "All our technicians are certified and have 5+ years experience", "icon": "Award"},
        {"title": "90-Day Warranty", "description": "Every repair is backed by our comprehensive warranty", "icon": "Shield"},
        {"title": "Same-Day Service", "description": "Most repairs completed while you wait", "icon": "Clock"},
        {"title": "Best Prices", "description": "Competitive pricing with no hidden fees", "icon": "DollarSign"}
    ]
}'),
('cta', 'Ready to Get Your Device Fixed?', 'Book a repair now and get your device back in perfect condition.', '{
    "primaryButtonText": "Book Repair Now",
    "primaryButtonLink": "/booking",
    "secondaryButtonText": "Contact Us",
    "secondaryButtonLink": "/contact"
}'),
('sell_cta', 'Sell Your Old Device', 'Got an old phone, tablet, or laptop? Get instant cash! We offer the best prices for your used devices.', '{
    "buttonText": "Get a Quote",
    "buttonLink": "/sell"
}')
ON CONFLICT (section_key) DO NOTHING;

-- Done! Landing page CMS tables created with default data.

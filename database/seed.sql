-- ====================================================
-- SIFIXA DATABASE SEED DATA
-- Part 2: All Initial Data
-- Run this AFTER the SCHEMA file
-- ====================================================

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (id, name, is_staff, permissions) VALUES
(1, 'admin', true, '{"all": true}'),
(2, 'manager', true, '{"manage_staff": true, "manage_inventory": true, "view_reports": true}'),
(3, 'technician', true, '{"repair_tickets": true, "inventory_use": true}'),
(4, 'cashier', true, '{"pos": true, "register": true}'),
(5, 'support', true, '{"customers": true, "messages": true}'),
(6, 'customer', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TAX RATES
-- ============================================================

INSERT INTO tax_rates (id, name, rate, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'VA Sales Tax', 0.0530, true),
('22222222-2222-2222-2222-222222222222', 'No Tax', 0.0000, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORE & SETTINGS
-- ============================================================

INSERT INTO stores (id, name, address1, city, state, zip, phone, email) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SIFIXA Main Store', '123 Tech Street', 'Harrisonburg', 'VA', '22801', '(540) 123-4567', 'main@sifixa.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_settings (store_id, default_tax_rate_id, timezone, currency_code, receipt_header, receipt_footer) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'America/New_York', 'USD', 'SIFIXA - Professional Device Repair', 'Thank you for choosing SIFIXA! Lifetime warranty on all repairs.')
ON CONFLICT (store_id) DO NOTHING;

-- ============================================================
-- REGISTER
-- ============================================================

INSERT INTO registers (id, store_id, name, is_active) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Register', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STOCK LOCATION
-- ============================================================

INSERT INTO stock_locations (id, store_id, name, location_type, is_active) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Inventory', 'shelf', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TIME SLOTS
-- ============================================================

INSERT INTO time_slots (id, store_id, name, start_time, end_time, max_bookings, is_active) VALUES
('80000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning', '09:00', '12:00', 3, true),
('80000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Afternoon', '12:00', '16:00', 3, true),
('80000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Evening', '16:00', '20:00', 3, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RETURN & VOID REASONS
-- ============================================================

INSERT INTO return_reasons (id, name, requires_note, is_active) VALUES
('72000000-0000-0000-0000-000000000001', 'Defective Product', false, true),
('72000000-0000-0000-0000-000000000002', 'Wrong Item', false, true),
('72000000-0000-0000-0000-000000000003', 'Changed Mind', false, true),
('72000000-0000-0000-0000-000000000004', 'Not as Described', true, true),
('72000000-0000-0000-0000-000000000005', 'Other', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO void_reasons (id, name, requires_note, is_active) VALUES
('73000000-0000-0000-0000-000000000001', 'Customer Canceled', false, true),
('73000000-0000-0000-0000-000000000002', 'Pricing Error', true, true),
('73000000-0000-0000-0000-000000000003', 'Duplicate Transaction', false, true),
('73000000-0000-0000-0000-000000000004', 'Other', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ITEM CATEGORIES
-- ============================================================

INSERT INTO item_categories (id, name, parent_id, sort_order) VALUES
('40000000-0000-0000-0000-000000000001', 'Services', NULL, 1),
('40000000-0000-0000-0000-000000000002', 'Products', NULL, 2),
('40000000-0000-0000-0000-000000000003', 'Parts', NULL, 3),
('40000000-0000-0000-0000-000000000011', 'Phone Repairs', '40000000-0000-0000-0000-000000000001', 1),
('40000000-0000-0000-0000-000000000012', 'Computer Repairs', '40000000-0000-0000-0000-000000000001', 2),
('40000000-0000-0000-0000-000000000013', 'Software Services', '40000000-0000-0000-0000-000000000001', 3),
('40000000-0000-0000-0000-000000000021', 'Cases', '40000000-0000-0000-0000-000000000002', 1),
('40000000-0000-0000-0000-000000000022', 'Screen Protectors', '40000000-0000-0000-0000-000000000002', 2),
('40000000-0000-0000-0000-000000000023', 'Chargers & Cables', '40000000-0000-0000-0000-000000000002', 3),
('40000000-0000-0000-0000-000000000031', 'Screens', '40000000-0000-0000-0000-000000000003', 1),
('40000000-0000-0000-0000-000000000032', 'Batteries', '40000000-0000-0000-0000-000000000003', 2),
('40000000-0000-0000-0000-000000000033', 'Components', '40000000-0000-0000-0000-000000000003', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ITEMS (Services, Products, Parts)
-- ============================================================

INSERT INTO items (id, item_type, sku, name, description, category_id, is_taxable, is_active, track_inventory) VALUES
-- Services
('50000000-0000-0000-0000-000000000001', 'service', 'SVC-IPSCR', 'iPhone Screen Replacement', 'Replace cracked iPhone screens', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000002', 'service', 'SVC-SSCR', 'Samsung Screen Replacement', 'Replace broken Samsung screens', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000003', 'service', 'SVC-IPBAT', 'iPhone Battery Replacement', 'New battery for iPhones', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000004', 'service', 'SVC-CHARGE', 'Charging Port Repair', 'Fix damaged charging ports', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000005', 'service', 'SVC-CAMERA', 'Camera Replacement', 'Front or rear camera replacement', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000010', 'service', 'SVC-MBSCR', 'MacBook Screen Replacement', 'Replace MacBook displays', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000011', 'service', 'SVC-MBBAT', 'MacBook Battery Replacement', 'New MacBook battery', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000012', 'service', 'SVC-SSD', 'SSD Upgrade & Installation', 'Upgrade to SSD storage', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000013', 'service', 'SVC-KEYBOARD', 'Keyboard Replacement', 'Laptop keyboard replacement', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000014', 'service', 'SVC-VIRUS', 'Virus & Malware Removal', 'Complete virus removal', '40000000-0000-0000-0000-000000000013', true, true, false),
('50000000-0000-0000-0000-000000000015', 'service', 'SVC-DIAG', 'Diagnostic Service', 'Complete device diagnosis', '40000000-0000-0000-0000-000000000013', true, true, false),
('50000000-0000-0000-0000-000000000016', 'service', 'SVC-DATA', 'Data Recovery', 'Recover data from damaged devices', '40000000-0000-0000-0000-000000000013', true, true, false),
-- Products
('50000000-0000-0000-0000-000000000020', 'product', 'CASE-IP15C', 'iPhone 15 Pro Case - Clear', 'Crystal clear case', '40000000-0000-0000-0000-000000000021', true, true, true),
('50000000-0000-0000-0000-000000000021', 'product', 'CASE-IP14B', 'iPhone 14 Case - Black', 'Slim matte black case', '40000000-0000-0000-0000-000000000021', true, true, true),
('50000000-0000-0000-0000-000000000022', 'product', 'SP-IP15', 'iPhone 15 Screen Protector', 'Tempered glass 2-pack', '40000000-0000-0000-0000-000000000022', true, true, true),
('50000000-0000-0000-0000-000000000023', 'product', 'CHG-20W', 'USB-C Fast Charger 20W', 'Quick charge compatible', '40000000-0000-0000-0000-000000000023', true, true, true),
('50000000-0000-0000-0000-000000000024', 'product', 'CABLE-LC', 'Lightning Cable 6ft', 'MFi certified cable', '40000000-0000-0000-0000-000000000023', true, true, true),
-- Parts
('50000000-0000-0000-0000-000000000030', 'part', 'PRT-IP15SCR', 'iPhone 15 Screen Assembly', 'OEM quality screen', '40000000-0000-0000-0000-000000000031', true, true, true),
('50000000-0000-0000-0000-000000000031', 'part', 'PRT-IP14SCR', 'iPhone 14 Screen Assembly', 'OEM quality screen', '40000000-0000-0000-0000-000000000031', true, true, true),
('50000000-0000-0000-0000-000000000032', 'part', 'PRT-S24SCR', 'Samsung S24 Screen Assembly', 'AMOLED display', '40000000-0000-0000-0000-000000000031', true, true, true),
('50000000-0000-0000-0000-000000000034', 'part', 'PRT-IP15BAT', 'iPhone 15 Battery', 'High capacity battery', '40000000-0000-0000-0000-000000000032', true, true, true),
('50000000-0000-0000-0000-000000000035', 'part', 'PRT-MBPBAT', 'MacBook Pro Battery', '2023 model compatible', '40000000-0000-0000-0000-000000000032', true, true, true),
('50000000-0000-0000-0000-000000000036', 'part', 'PRT-IP15CHG', 'iPhone 15 Charging Port', 'USB-C flex cable', '40000000-0000-0000-0000-000000000033', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ITEM PRICES
-- ============================================================

INSERT INTO item_prices (item_id, price, effective_from) VALUES
-- Services
('50000000-0000-0000-0000-000000000001', 149.00, NOW()),
('50000000-0000-0000-0000-000000000002', 129.00, NOW()),
('50000000-0000-0000-0000-000000000003', 79.00, NOW()),
('50000000-0000-0000-0000-000000000004', 69.00, NOW()),
('50000000-0000-0000-0000-000000000005', 89.00, NOW()),
('50000000-0000-0000-0000-000000000010', 299.00, NOW()),
('50000000-0000-0000-0000-000000000011', 149.00, NOW()),
('50000000-0000-0000-0000-000000000012', 99.00, NOW()),
('50000000-0000-0000-0000-000000000013', 129.00, NOW()),
('50000000-0000-0000-0000-000000000014', 79.00, NOW()),
('50000000-0000-0000-0000-000000000015', 29.00, NOW()),
('50000000-0000-0000-0000-000000000016', 149.00, NOW()),
-- Products
('50000000-0000-0000-0000-000000000020', 24.99, NOW()),
('50000000-0000-0000-0000-000000000021', 19.99, NOW()),
('50000000-0000-0000-0000-000000000022', 14.99, NOW()),
('50000000-0000-0000-0000-000000000023', 24.99, NOW()),
('50000000-0000-0000-0000-000000000024', 12.99, NOW()),
-- Parts
('50000000-0000-0000-0000-000000000030', 85.00, NOW()),
('50000000-0000-0000-0000-000000000031', 75.00, NOW()),
('50000000-0000-0000-0000-000000000032', 115.00, NOW()),
('50000000-0000-0000-0000-000000000034', 35.00, NOW()),
('50000000-0000-0000-0000-000000000035', 95.00, NOW()),
('50000000-0000-0000-0000-000000000036', 25.00, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- ITEM COSTS
-- ============================================================

INSERT INTO item_costs (item_id, cost, effective_from) VALUES
('50000000-0000-0000-0000-000000000020', 8.00, NOW()),
('50000000-0000-0000-0000-000000000021', 6.00, NOW()),
('50000000-0000-0000-0000-000000000022', 3.00, NOW()),
('50000000-0000-0000-0000-000000000023', 8.00, NOW()),
('50000000-0000-0000-0000-000000000024', 3.00, NOW()),
('50000000-0000-0000-0000-000000000030', 45.00, NOW()),
('50000000-0000-0000-0000-000000000031', 40.00, NOW()),
('50000000-0000-0000-0000-000000000032', 75.00, NOW()),
('50000000-0000-0000-0000-000000000034', 20.00, NOW()),
('50000000-0000-0000-0000-000000000035', 65.00, NOW()),
('50000000-0000-0000-0000-000000000036', 15.00, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- STOCK LEVELS
-- ============================================================

INSERT INTO stock_levels (location_id, item_id, qty_on_hand) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000020', 25),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000021', 30),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000022', 50),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000023', 35),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000024', 45),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000030', 10),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000031', 12),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000032', 8),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000034', 15),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000035', 5),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000036', 20)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING HERO
-- ============================================================

INSERT INTO landing_hero (title, subtitle, cta_text, cta_link, secondary_cta_text, secondary_cta_link)
VALUES (
    'Professional Device Repair You Can Trust',
    'Fast, reliable repairs for phones, tablets, and computers. Same-day service available with certified technicians.',
    'Book Repair Now',
    '/booking',
    'Track Repair',
    '/track'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING SERVICES
-- ============================================================

INSERT INTO landing_services (title, description, icon, image, display_order) VALUES
('Smartphone Repair', 'Screen replacement, battery, charging port, camera and more for all major brands.', 'Smartphone', 'smartphone-repair.png', 1),
('Tablet Repair', 'iPad, Samsung Tab, and other tablet repairs with genuine parts and warranty.', 'Tablet', 'tablet-repair.png', 2),
('Computer Repair', 'Laptop screen, keyboard, battery, SSD upgrades, and software troubleshooting.', 'Laptop', 'computer-repair.png', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING TESTIMONIALS
-- ============================================================

INSERT INTO landing_testimonials (customer_name, customer_title, rating, content, device_repaired, display_order) VALUES
('Sarah Johnson', 'iPhone User', 5, 'Amazing service! They fixed my cracked iPhone screen in just 30 minutes. The quality is perfect and the price was very reasonable.', 'iPhone 14 Pro', 1),
('Michael Chen', 'MacBook Owner', 5, 'Professional and fast. My MacBook keyboard was replaced same day. Highly recommend their computer repair services!', 'MacBook Pro', 2),
('Emily Rodriguez', 'Samsung User', 5, 'Best repair shop in town! They saved my Galaxy with water damage when other shops said it was impossible.', 'Samsung Galaxy S23', 3),
('David Kim', 'iPad User', 5, 'Excellent experience from start to finish. My iPad screen looks brand new and they even cleaned the whole device!', 'iPad Pro', 4),
('Jennifer Martinez', 'Google Pixel User', 5, 'Fast turnaround and fair pricing. Fixed my Pixel battery in under an hour. Will definitely come back!', 'Google Pixel 7', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING FAQ
-- ============================================================

INSERT INTO landing_faq (question, answer, category, display_order) VALUES
('How long does a typical repair take?', 'Most common repairs like screen replacements and battery changes are completed within 30-60 minutes. More complex repairs may take 1-2 business days.', 'General', 1),
('Do you offer a warranty on repairs?', 'Yes! All our repairs come with a lifetime warranty on parts and labor. If anything goes wrong with our repair work, we will fix it for free.', 'Warranty', 2),
('What payment methods do you accept?', 'We accept all major credit cards, debit cards, Apple Pay, Google Pay, and cash. Payment is due when you pick up your repaired device.', 'Payment', 3),
('Do you use original parts?', 'We use high-quality OEM-grade parts that meet or exceed original specifications. For Apple devices, we also offer genuine Apple parts at a premium.', 'Parts', 4),
('Can I get a quote before the repair?', 'Absolutely! We provide free diagnostics and quotes. Just bring in your device or use our online booking system for an instant estimate.', 'Pricing', 5),
('Do you offer mail-in repairs?', 'Yes, we offer mail-in repair services. Simply request a shipping label through our website, send us your device, and we will repair and ship it back.', 'Services', 6),
('Is my data safe during repair?', 'We take data privacy seriously. Our technicians are trained to protect your data, and we never access personal files unless required for diagnostics with your permission.', 'Privacy', 7),
('Do you repair water-damaged devices?', 'Yes, we specialize in water damage repair. Success rates depend on the extent of damage and how quickly you bring in the device. We recommend not attempting to charge a wet device.', 'Services', 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING SECTIONS
-- ============================================================

INSERT INTO landing_sections (section_key, title, subtitle, content) VALUES
('why_choose_us', 'Why Choose SIFIXA?', 'The smartest way to repair your device', '{
    "features": [
        {"icon": "Clock", "title": "Fast Turnaround", "description": "Most repairs completed in under 30 minutes."},
        {"icon": "ShieldCheck", "title": "Lifetime Warranty", "description": "We stand by our parts and labor with a lifetime warranty."},
        {"icon": "Truck", "title": "We Come to You", "description": "Home, office, or coffee shop - we meet you anywhere."},
        {"icon": "Wrench", "title": "Expert Technicians", "description": "Certified professionals with years of experience."}
    ]
}'::jsonb),
('how_it_works', 'How It Works', 'Choose the service option that works best for you', '{
    "steps": [
        {"number": 1, "title": "Book Online", "description": "Schedule your repair in 60 seconds"},
        {"number": 2, "title": "Drop Off or We Pick Up", "description": "Visit our store or we come to you"},
        {"number": 3, "title": "Expert Repair", "description": "Our certified techs fix your device"},
        {"number": 4, "title": "Pick Up or Delivery", "description": "Get your device back good as new"}
    ]
}'::jsonb),
('cta', 'Ready to get your device fixed?', 'Book a repair now and get your device back in perfect condition.', '{
    "primaryButtonText": "Book Repair Now",
    "primaryButtonLink": "/booking",
    "secondaryButtonText": "Contact Us",
    "secondaryButtonLink": "/contact"
}'::jsonb),
('sell_cta', 'Sell Your Old Device', 'Get instant cash for your used phones, tablets, and laptops.', '{
    "buttonText": "Get a Quote",
    "buttonLink": "/sell"
}'::jsonb),
('brands', 'Brands We Repair', 'We service all major brands', '{
    "brands": ["Apple", "Samsung", "Google", "OnePlus", "Motorola", "LG", "Dell", "HP", "Lenovo", "ASUS"]
}'::jsonb)
ON CONFLICT (section_key) DO UPDATE SET 
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    content = EXCLUDED.content;

-- ============================================================
-- LANDING SETTINGS
-- ============================================================

INSERT INTO landing_settings (setting_key, setting_value) VALUES
('brand', '{"name": "SIFIXA", "tagline": "Premium Device Repair", "logo_url": null}'::jsonb),
('social_links', '{"facebook": "https://facebook.com/sifixa", "twitter": "https://twitter.com/sifixa", "instagram": "https://instagram.com/sifixa", "linkedin": "https://linkedin.com/company/sifixa"}'::jsonb),
('contact', '{"address": "123 Tech Street, Harrisonburg, VA 22801", "phone": "(540) 123-4567", "supportEmail": "support@sifixa.com", "infoEmail": "info@sifixa.com", "hours": "Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM"}'::jsonb),
('services_header', '{"title": "Expert Repair Services", "subtitle": "We fix all major brands and devices with premium quality parts and certified technicians."}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- LANDING PRICING
-- ============================================================

INSERT INTO landing_pricing (id, category, icon, display_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Phone Screen', 'Smartphone', 1),
('22222222-2222-2222-2222-222222222222', 'Phone Battery', 'Battery', 2),
('33333333-3333-3333-3333-333333333333', 'Tablet Repair', 'Tablet', 3),
('44444444-4444-4444-4444-444444444444', 'Laptop Repair', 'Laptop', 4),
('55555555-5555-5555-5555-555555555555', 'Data Recovery', 'HardDrive', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO landing_pricing_items (category_id, name, price, display_order) VALUES
-- Phone Screen
('11111111-1111-1111-1111-111111111111', 'iPhone 15/Pro/Max Screen', 'From $149', 1),
('11111111-1111-1111-1111-111111111111', 'iPhone 14/13/12 Screen', 'From $99', 2),
('11111111-1111-1111-1111-111111111111', 'Samsung Galaxy S24/S23', 'From $129', 3),
('11111111-1111-1111-1111-111111111111', 'Other Android Screen', 'From $69', 4),
-- Phone Battery
('22222222-2222-2222-2222-222222222222', 'iPhone Battery', 'From $49', 1),
('22222222-2222-2222-2222-222222222222', 'Samsung Battery', 'From $45', 2),
('22222222-2222-2222-2222-222222222222', 'Other Android Battery', 'From $39', 3),
-- Tablet
('33333333-3333-3333-3333-333333333333', 'iPad Screen Repair', 'From $129', 1),
('33333333-3333-3333-3333-333333333333', 'iPad Battery', 'From $79', 2),
('33333333-3333-3333-3333-333333333333', 'Samsung Tab Screen', 'From $99', 3),
-- Laptop
('44444444-4444-4444-4444-444444444444', 'MacBook Screen', 'From $299', 1),
('44444444-4444-4444-4444-444444444444', 'MacBook Battery', 'From $149', 2),
('44444444-4444-4444-4444-444444444444', 'Windows Laptop Screen', 'From $149', 3),
('44444444-4444-4444-4444-444444444444', 'SSD Upgrade', 'From $99', 4),
-- Data Recovery
('55555555-5555-5555-5555-555555555555', 'Basic Recovery', 'From $99', 1),
('55555555-5555-5555-5555-555555555555', 'Advanced Recovery', 'From $199', 2),
('55555555-5555-5555-5555-555555555555', 'SSD/HDD Failure', 'From $299', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LANDING GALLERY
-- ============================================================

INSERT INTO landing_gallery (title, before_image, after_image, description, device_type, display_order) VALUES
('iPhone 14 Pro Screen Repair', 'gallery/iphone-before-1.jpg', 'gallery/iphone-after-1.jpg', 'Severely cracked screen replaced with OEM quality display. 45 minute repair.', 'phone', 1),
('MacBook Pro Water Damage', 'gallery/macbook-before-1.jpg', 'gallery/macbook-after-1.jpg', 'Complete water damage restoration including keyboard and logic board repair.', 'laptop', 2),
('Samsung S23 Battery Replacement', 'gallery/samsung-before-1.jpg', 'gallery/samsung-after-1.jpg', 'Swollen battery safely replaced. Device back to full health.', 'phone', 3),
('iPad Pro Screen Repair', 'gallery/ipad-before-1.jpg', 'gallery/ipad-after-1.jpg', 'Shattered glass replaced with original Apple display.', 'tablet', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- LEGAL PAGES
-- ============================================================

INSERT INTO legal_pages (page_key, title, content) VALUES
('privacy', 'Privacy Policy', '## Privacy Policy

**Last Updated:** January 2025

### Information We Collect
We collect information you provide directly to us, including:
- Name, email address, and phone number
- Device information and repair history
- Payment information (processed securely through our payment provider)

### How We Use Your Information
- To provide repair services and communicate about your orders
- To send appointment reminders and status updates
- To improve our services and customer experience
- To comply with legal obligations

### Data Security
We implement industry-standard security measures to protect your personal information. Payment data is encrypted and processed through PCI-compliant systems.

### Your Rights
You have the right to access, correct, or delete your personal information. Contact us at privacy@sifixa.com for any privacy-related requests.

### Contact Us
For privacy questions, contact privacy@sifixa.com'),

('terms', 'Terms of Service', '## Terms of Service

**Last Updated:** January 2025

### Service Agreement
By using SIFIXA repair services, you agree to these terms and conditions.

### Repair Services
- We provide estimates before beginning work
- Repair times are estimates and may vary
- We use quality OEM-grade replacement parts
- Warranty covers our workmanship and parts

### Customer Responsibilities
- Back up your data before repair (we are not responsible for data loss)
- Provide accurate device information
- Pick up devices within 30 days of completion

### Liability Limitations
- We are not liable for pre-existing damage or defects
- Maximum liability is limited to the repair cost
- We are not responsible for data loss during repair

### Payment Terms
- Payment is due upon completion of service
- We accept major credit cards, debit cards, and cash
- All sales are final unless covered by warranty'),

('warranty', 'Warranty Policy', '## Warranty Policy

**Last Updated:** January 2025

### Coverage
All repairs performed by SIFIXA include a **Lifetime Warranty** covering:
- Defects in replacement parts we install
- Issues with our workmanship
- Parts failure under normal use

### What is NOT Covered
- Physical damage after repair (drops, impacts, liquid damage)
- Damage from unauthorized modifications
- Normal wear and tear
- Software issues unrelated to our repair
- Devices with tampered warranty stickers

### How to Claim Warranty
1. Contact us with your repair ticket number
2. Bring the device to our store or request mail-in service
3. Our technicians will diagnose the issue
4. If covered, we will repair at no additional cost

### Warranty Transfer
Warranty is tied to the device, not the owner, and transfers if you sell the device.')
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- MESSAGE TEMPLATES
-- ============================================================

INSERT INTO message_templates (id, name, template_type, subject, body, channels, is_active) VALUES
('90000000-0000-0000-0000-000000000001', 'Repair Ready', 'repair_ready', 'Your Repair is Ready!', 'Hi {{customer_name}}, great news! Your {{device}} repair is complete and ready for pickup at SIFIXA. Our store hours are Mon-Sat 9AM-8PM, Sun 10AM-6PM. See you soon!', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000002', 'Status Update', 'status_update', 'Repair Status Update', 'Hi {{customer_name}}, your {{device}} repair status has been updated to: {{status}}. Track your repair anytime at sifixa.com/track using code: {{tracking_number}}', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000003', 'Booking Confirmation', 'booking_confirm', 'Booking Confirmed - SIFIXA', 'Hi {{customer_name}}, your repair appointment is confirmed for {{date}} at {{time}}. Your tracking number is: {{tracking_number}}. Please bring your device and any accessories. See you soon!', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000004', 'Appointment Reminder', 'reminder', 'Reminder: Your Repair Appointment Tomorrow', 'Hi {{customer_name}}, this is a reminder that your repair appointment is tomorrow ({{date}}) at {{time}}. Please bring your {{device}} to SIFIXA Main Store. Questions? Call (540) 123-4567.', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000005', 'Approval Needed', 'approval_needed', 'Approval Needed for Your Repair', 'Hi {{customer_name}}, during diagnosis of your {{device}}, we found additional repairs needed. Please log in to your account or call us at (540) 123-4567 to review and approve the updated estimate.', ARRAY['email', 'sms'], true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CUSTOMER TAGS
-- ============================================================

INSERT INTO customer_tags (id, name, color) VALUES
('10000000-0000-0000-0000-000000000001', 'VIP', '#f59e0b'),
('10000000-0000-0000-0000-000000000002', 'Business', '#3b82f6'),
('10000000-0000-0000-0000-000000000003', 'Wholesale', '#10b981'),
('10000000-0000-0000-0000-000000000004', 'Student', '#8b5cf6'),
('10000000-0000-0000-0000-000000000005', 'Repeat Customer', '#ec4899')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE!
-- ============================================================
SELECT 
    '✅ SIFIXA Seed Data Loaded Successfully!' as status,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM stores) as stores,
    (SELECT COUNT(*) FROM items) as items,
    (SELECT COUNT(*) FROM landing_services) as landing_services,
    (SELECT COUNT(*) FROM landing_testimonials) as testimonials,
    (SELECT COUNT(*) FROM landing_faq) as faq_items,
    (SELECT COUNT(*) FROM landing_pricing) as pricing_categories,
    (SELECT COUNT(*) FROM message_templates) as message_templates;
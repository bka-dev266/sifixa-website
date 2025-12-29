-- ====================================================
-- SIFIXA Complete Database Seed Data
-- Run AFTER advanced_setup.sql
-- Populates ALL tables with comprehensive sample data
-- ====================================================

-- ==================== ROLES ====================
INSERT INTO roles (id, name, is_staff, permissions) VALUES
(1, 'admin', true, '{"all": true}'),
(2, 'manager', true, '{"manage_staff": true, "manage_inventory": true, "view_reports": true}'),
(3, 'technician', true, '{"repair_tickets": true, "inventory_use": true}'),
(4, 'cashier', true, '{"pos": true, "register": true}'),
(5, 'support', true, '{"customers": true, "messages": true}'),
(6, 'customer', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- ==================== TAX RATES ====================
INSERT INTO tax_rates (id, name, rate, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'VA Sales Tax', 0.0530, true),
('22222222-2222-2222-2222-222222222222', 'No Tax', 0.0000, true)
ON CONFLICT (id) DO NOTHING;

-- ==================== STORES ====================
INSERT INTO stores (id, name, address1, city, state, zip, phone, email) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SIFIXA Main Store', '123 Tech Street', 'Harrisonburg', 'VA', '22801', '(540) 123-4567', 'main@sifixa.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_settings (store_id, default_tax_rate_id, timezone, currency_code, receipt_header, receipt_footer) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'America/New_York', 'USD', 'SIFIXA - Professional Device Repair', 'Thank you for choosing SIFIXA! 90-day warranty on all repairs.')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO store_tax_map (store_id, tax_rate_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- ==================== REGISTERS & STOCK LOCATIONS ====================
INSERT INTO registers (id, store_id, name, is_active) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Register 1', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Register 2', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_locations (id, store_id, name, is_default) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Floor', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Back Room', false),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Repair Bench', false)
ON CONFLICT (id) DO NOTHING;

-- ==================== CUSTOMER TAGS & CUSTOMERS ====================
INSERT INTO customer_tags (id, name, color) VALUES
('10000000-0000-0000-0000-000000000001', 'VIP', '#f59e0b'),
('10000000-0000-0000-0000-000000000002', 'Business', '#3b82f6'),
('10000000-0000-0000-0000-000000000003', 'Repeat', '#10b981'),
('10000000-0000-0000-0000-000000000004', 'Walk-in', '#6b7280')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, first_name, last_name, email, phone, address1, city, state, zip, notes) VALUES
('20000000-0000-0000-0000-000000000001', 'Alice', 'Brown', 'alice@example.com', '555-0101', '100 Oak St', 'Harrisonburg', 'VA', '22801', 'Preferred customer'),
('20000000-0000-0000-0000-000000000002', 'Bob', 'Wilson', 'bob@example.com', '555-0102', '200 Elm St', 'Harrisonburg', 'VA', '22801', 'Business account'),
('20000000-0000-0000-0000-000000000003', 'Carol', 'Davis', 'carol@example.com', '555-0103', '300 Pine St', 'Staunton', 'VA', '24401', 'Referred by Bob'),
('20000000-0000-0000-0000-000000000004', 'David', 'Lee', 'david@example.com', '555-0104', '400 Maple Ave', 'Charlottesville', 'VA', '22902', NULL),
('20000000-0000-0000-0000-000000000005', 'Emma', 'Martinez', 'emma@example.com', '555-0105', '500 Cedar Ln', 'Harrisonburg', 'VA', '22801', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_tag_map (customer_id, tag_id) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ==================== DEVICES ====================
INSERT INTO devices (id, customer_id, device_type, brand, model, color, serial_number, imei) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'phone', 'Apple', 'iPhone 13', 'Blue', 'C39K3HQ0M9', '351234567890123'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'laptop', 'Apple', 'MacBook Air M2', 'Space Gray', 'C02F14BGQ6LW', NULL),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'laptop', 'Dell', 'XPS 15', 'Silver', 'DELL9876543', NULL),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'phone', 'Samsung', 'Galaxy S24', 'Black', 'R58R30ABCDE', '359876543210987'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'tablet', 'Apple', 'iPad Pro 12.9', 'Silver', 'DMPWC12345', NULL)
ON CONFLICT (id) DO NOTHING;

-- ==================== ITEM CATEGORIES ====================
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

-- ==================== ITEMS (Services, Products, Parts, Fees) ====================
INSERT INTO items (id, item_type, sku, name, description, category_id, is_taxable, is_active, track_inventory) VALUES
-- Services
('50000000-0000-0000-0000-000000000001', 'service', 'SVC-IPSCR', 'iPhone Screen Replacement', 'Replace cracked iPhone screens', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000002', 'service', 'SVC-SSCR', 'Samsung Screen Replacement', 'Replace broken Samsung screens', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000003', 'service', 'SVC-IPBAT', 'iPhone Battery Replacement', 'New battery for iPhones', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000004', 'service', 'SVC-CHARGE', 'Charging Port Repair', 'Fix damaged charging ports', '40000000-0000-0000-0000-000000000011', true, true, false),
('50000000-0000-0000-0000-000000000010', 'service', 'SVC-MBSCR', 'MacBook Screen Replacement', 'Replace MacBook displays', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000011', 'service', 'SVC-MBBAT', 'MacBook Battery Replacement', 'New MacBook battery', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000012', 'service', 'SVC-SSD', 'SSD Upgrade & Installation', 'Upgrade to SSD storage', '40000000-0000-0000-0000-000000000012', true, true, false),
('50000000-0000-0000-0000-000000000014', 'service', 'SVC-VIRUS', 'Virus & Malware Removal', 'Complete virus removal', '40000000-0000-0000-0000-000000000013', true, true, false),
('50000000-0000-0000-0000-000000000015', 'service', 'SVC-DIAG', 'Diagnostic Service', 'Complete device diagnosis', '40000000-0000-0000-0000-000000000013', true, true, false),
-- Products
('50000000-0000-0000-0000-000000000020', 'product', 'CASE-IP15C', 'iPhone 15 Pro Case - Clear', 'Crystal clear case', '40000000-0000-0000-0000-000000000021', true, true, true),
('50000000-0000-0000-0000-000000000021', 'product', 'CASE-IP14B', 'iPhone 14 Case - Black', 'Slim matte black case', '40000000-0000-0000-0000-000000000021', true, true, true),
('50000000-0000-0000-0000-000000000022', 'product', 'SP-IP15', 'iPhone 15 Screen Protector', 'Tempered glass 2-pack', '40000000-0000-0000-0000-000000000022', true, true, true),
('50000000-0000-0000-0000-000000000023', 'product', 'CHG-20W', 'USB-C Fast Charger 20W', 'Quick charge compatible', '40000000-0000-0000-0000-000000000023', true, true, true),
('50000000-0000-0000-0000-000000000024', 'product', 'CBL-USC6', 'USB-C Cable 6ft', 'Fast charging cable', '40000000-0000-0000-0000-000000000023', true, true, true),
-- Parts
('50000000-0000-0000-0000-000000000030', 'part', 'PRT-IP13SCR', 'iPhone 13 Screen Assembly', 'OEM quality screen', '40000000-0000-0000-0000-000000000031', false, true, true),
('50000000-0000-0000-0000-000000000031', 'part', 'PRT-IP14SCR', 'iPhone 14 Screen Assembly', 'OEM quality screen', '40000000-0000-0000-0000-000000000031', false, true, true),
('50000000-0000-0000-0000-000000000032', 'part', 'PRT-IP15SCR', 'iPhone 15 Screen Assembly', 'OEM quality screen', '40000000-0000-0000-0000-000000000031', false, true, true),
('50000000-0000-0000-0000-000000000034', 'part', 'PRT-IPBAT', 'iPhone Battery Universal', 'High capacity battery', '40000000-0000-0000-0000-000000000032', false, true, true),
('50000000-0000-0000-0000-000000000035', 'part', 'PRT-MBBAT', 'MacBook Air Battery', 'Replacement battery M1/M2', '40000000-0000-0000-0000-000000000032', false, true, true),
('50000000-0000-0000-0000-000000000036', 'part', 'PRT-SSD256', 'SSD 256GB NVMe', 'Fast NVMe storage', '40000000-0000-0000-0000-000000000033', false, true, true),
-- Fees
('50000000-0000-0000-0000-000000000040', 'fee', 'FEE-RUSH', 'Rush Service Fee', 'Priority same-day', '40000000-0000-0000-0000-000000000001', true, true, false),
('50000000-0000-0000-0000-000000000041', 'fee', 'FEE-PICKUP', 'Device Pickup Fee', 'We come to you', '40000000-0000-0000-0000-000000000001', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- ==================== ITEM PRICES ====================
INSERT INTO item_prices (item_id, price, effective_from) VALUES
('50000000-0000-0000-0000-000000000001', 149.00, NOW()),
('50000000-0000-0000-0000-000000000002', 169.00, NOW()),
('50000000-0000-0000-0000-000000000003', 69.00, NOW()),
('50000000-0000-0000-0000-000000000004', 79.00, NOW()),
('50000000-0000-0000-0000-000000000010', 449.00, NOW()),
('50000000-0000-0000-0000-000000000011', 189.00, NOW()),
('50000000-0000-0000-0000-000000000012', 149.00, NOW()),
('50000000-0000-0000-0000-000000000014', 79.00, NOW()),
('50000000-0000-0000-0000-000000000015', 39.00, NOW()),
('50000000-0000-0000-0000-000000000020', 24.99, NOW()),
('50000000-0000-0000-0000-000000000021', 19.99, NOW()),
('50000000-0000-0000-0000-000000000022', 14.99, NOW()),
('50000000-0000-0000-0000-000000000023', 24.99, NOW()),
('50000000-0000-0000-0000-000000000024', 12.99, NOW()),
('50000000-0000-0000-0000-000000000030', 85.00, NOW()),
('50000000-0000-0000-0000-000000000031', 95.00, NOW()),
('50000000-0000-0000-0000-000000000032', 115.00, NOW()),
('50000000-0000-0000-0000-000000000034', 35.00, NOW()),
('50000000-0000-0000-0000-000000000035', 95.00, NOW()),
('50000000-0000-0000-0000-000000000036', 55.00, NOW()),
('50000000-0000-0000-0000-000000000040', 29.00, NOW()),
('50000000-0000-0000-0000-000000000041', 25.00, NOW())
ON CONFLICT DO NOTHING;

-- ==================== ITEM COSTS ====================
INSERT INTO item_costs (item_id, cost, effective_from) VALUES
('50000000-0000-0000-0000-000000000020', 8.00, NOW()),
('50000000-0000-0000-0000-000000000021', 6.00, NOW()),
('50000000-0000-0000-0000-000000000022', 3.00, NOW()),
('50000000-0000-0000-0000-000000000023', 8.00, NOW()),
('50000000-0000-0000-0000-000000000024', 3.00, NOW()),
('50000000-0000-0000-0000-000000000030', 45.00, NOW()),
('50000000-0000-0000-0000-000000000031', 55.00, NOW()),
('50000000-0000-0000-0000-000000000032', 75.00, NOW()),
('50000000-0000-0000-0000-000000000034', 20.00, NOW()),
('50000000-0000-0000-0000-000000000035', 65.00, NOW()),
('50000000-0000-0000-0000-000000000036', 40.00, NOW())
ON CONFLICT DO NOTHING;

-- ==================== ITEM BARCODES ====================
INSERT INTO item_barcodes (id, item_id, barcode) VALUES
('b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000020', '012345678901'),
('b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000021', '012345678902'),
('b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000022', '012345678903'),
('b0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000023', '012345678904'),
('b0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000024', '012345678905')
ON CONFLICT (id) DO NOTHING;

-- ==================== STOCK LEVELS ====================
INSERT INTO stock_levels (location_id, item_id, qty_on_hand) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000020', 25),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000021', 30),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000022', 50),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000023', 35),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '50000000-0000-0000-0000-000000000024', 45),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000030', 8),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000031', 6),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000032', 3),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000034', 15),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000035', 2),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '50000000-0000-0000-0000-000000000036', 7)
ON CONFLICT DO NOTHING;

-- ==================== SUPPLIERS ====================
INSERT INTO suppliers (id, name, contact_name, email, phone, address, notes) VALUES
('60000000-0000-0000-0000-000000000001', 'TechParts Inc', 'Mike Johnson', 'orders@techparts.com', '800-555-0001', '1000 Industrial Blvd, Los Angeles, CA', 'Primary screen supplier'),
('60000000-0000-0000-0000-000000000002', 'MobileFixPro', 'Sarah Chen', 'supply@mobilefixpro.com', '800-555-0002', '2000 Tech Way, San Jose, CA', 'Samsung parts'),
('60000000-0000-0000-0000-000000000003', 'BatteryWorld', 'Tom Lee', 'wholesale@batteryworld.com', '800-555-0003', '3000 Power Dr, Austin, TX', 'Battery supplier')
ON CONFLICT (id) DO NOTHING;

-- ==================== DISCOUNTS & COUPONS ====================
INSERT INTO discounts (id, name, discount_type, value, is_active) VALUES
('70000000-0000-0000-0000-000000000001', '10% Off', 'percent', 10.00, true),
('70000000-0000-0000-0000-000000000002', '15% Off', 'percent', 15.00, true),
('70000000-0000-0000-0000-000000000003', '$10 Off', 'fixed', 10.00, true),
('70000000-0000-0000-0000-000000000004', '$25 Off', 'fixed', 25.00, true),
('70000000-0000-0000-0000-000000000005', 'VIP 20% Off', 'percent', 20.00, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (id, code, discount_id, max_uses, times_used, is_active, valid_from, valid_to) VALUES
('71000000-0000-0000-0000-000000000001', 'WELCOME10', '70000000-0000-0000-0000-000000000001', 100, 5, true, NOW(), NOW() + INTERVAL '90 days'),
('71000000-0000-0000-0000-000000000002', 'HOLIDAY25', '70000000-0000-0000-0000-000000000004', 50, 12, true, NOW(), NOW() + INTERVAL '30 days'),
('71000000-0000-0000-0000-000000000003', 'VIP2024', '70000000-0000-0000-0000-000000000005', NULL, 3, true, NOW(), NOW() + INTERVAL '365 days')
ON CONFLICT (id) DO NOTHING;

-- ==================== RETURN & VOID REASONS ====================
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

-- ==================== TIME SLOTS ====================
INSERT INTO time_slots (id, store_id, name, start_time, end_time, max_bookings, is_active) VALUES
('80000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Morning', '09:00', '12:00', 3, true),
('80000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Afternoon', '12:00', '16:00', 3, true),
('80000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Evening', '16:00', '20:00', 3, true)
ON CONFLICT (id) DO NOTHING;

-- ==================== APPOINTMENTS ====================
INSERT INTO appointments (id, customer_id, device_id, time_slot_id, scheduled_date, status, notes) VALUES
('a1000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', 'confirmed', 'Screen replacement'),
('a1000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '2 days', 'scheduled', 'Battery diagnostics'),
('a1000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '3 days', 'scheduled', 'Water damage check')
ON CONFLICT (id) DO NOTHING;

-- ==================== MESSAGE TEMPLATES ====================
INSERT INTO message_templates (id, name, template_type, subject, body, channels, is_active) VALUES
('90000000-0000-0000-0000-000000000001', 'Repair Ready', 'repair_ready', 'Your Repair is Ready!', 'Hi {{customer_name}}, your {{device}} repair is complete and ready for pickup.', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000002', 'Status Update', 'status_update', 'Repair Status Update', 'Hi {{customer_name}}, your {{device}} repair is now {{status}}.', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000003', 'Appointment Reminder', 'reminder', 'Appointment Reminder', 'Reminder: You have an appointment for {{date}} at {{time}}.', ARRAY['email', 'sms'], true),
('90000000-0000-0000-0000-000000000004', 'Quote Provided', 'quote', 'Repair Quote', 'Your {{device}} repair cost will be ${{amount}}.', ARRAY['email', 'sms'], true)
ON CONFLICT (id) DO NOTHING;

-- ==================== NOTIFICATION EVENTS ====================
INSERT INTO notification_events (id, customer_id, type, title, message, is_read) VALUES
('a1100000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'promo', 'Holiday Sale!', '25% off all screen repairs. Use code HOLIDAY25.', false),
('a1100000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'system', 'Welcome!', 'Thank you for creating an account.', true),
('a1100000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'reminder', 'Appointment', 'You have an appointment tomorrow.', false)
ON CONFLICT (id) DO NOTHING;

-- ==================== DAILY METRICS ====================
INSERT INTO daily_metrics (date, store_id, pos_sales_total, repair_revenue_total, tax_collected, discount_total, refund_total, tickets_opened, tickets_closed, appointments_scheduled) VALUES
(CURRENT_DATE - INTERVAL '7 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 345.50, 890.00, 65.45, 25.00, 0, 4, 3, 5),
(CURRENT_DATE - INTERVAL '6 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 220.75, 1250.00, 77.89, 50.00, 14.99, 6, 4, 3),
(CURRENT_DATE - INTERVAL '5 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 178.25, 680.00, 45.47, 0, 0, 3, 5, 4),
(CURRENT_DATE - INTERVAL '4 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 456.00, 1100.00, 82.43, 30.00, 0, 5, 3, 6),
(CURRENT_DATE - INTERVAL '3 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 289.99, 950.00, 65.70, 15.00, 24.99, 4, 4, 4),
(CURRENT_DATE - INTERVAL '2 days', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 512.50, 1450.00, 103.90, 45.00, 0, 7, 5, 7),
(CURRENT_DATE - INTERVAL '1 day', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 378.25, 1180.00, 82.53, 20.00, 0, 5, 6, 5)
ON CONFLICT (date) DO NOTHING;

-- ==================== WEBSITE CONTENT ====================
INSERT INTO website_content (content_key, content_data) VALUES 
('site_config', '{"hero":{"title":"Expert Device Repair","subtitle":"Done Right","description":"Professional repair services for phones, tablets, and computers."},"contact":{"phone":"(540) 123-4567","email":"info@sifixa.com","address":"123 Tech Street, Harrisonburg, VA 22801","hours":"Mon-Sat: 9AM-8PM"},"footer":{"companyName":"SIFIXA","tagline":"Professional Device Repair","copyright":"© 2024 SIFIXA. All rights reserved."}}'::jsonb)
ON CONFLICT (content_key) DO UPDATE SET content_data = EXCLUDED.content_data;

-- ==================== NOTE ====================
-- Tables requiring profiles (Supabase Auth users):
-- profiles, user_roles, register_shifts, cash_drawer_events,
-- purchase_orders, purchase_order_items, goods_receipts, goods_receipt_items,
-- stock_movements, repair_tickets, ticket_*, warranties, invoices,
-- invoice_items, sales_orders, sales_order_items, payments, refunds,
-- conversations, messages, audit_log
-- These will be populated after creating users in Supabase Auth.

SELECT 'Seed data inserted successfully!' as status;

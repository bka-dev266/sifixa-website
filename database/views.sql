-- ====================================================
-- SIFIXA Database Views
-- Easy-to-query views for frontend
-- Run this in Supabase SQL Editor
-- ====================================================

-- ==================== BOOKINGS VIEW ====================
-- Joins all booking/appointment related tables for easy queries
DROP VIEW IF EXISTS bookings_view;

CREATE VIEW bookings_view AS
SELECT 
    -- Appointment/Booking info
    a.id as booking_id,
    a.tracking_number,
    a.scheduled_date,
    a.scheduled_start,
    a.scheduled_end,
    a.status,
    a.notes,
    a.created_at,
    a.updated_at,
    
    -- Customer info (flattened)
    c.id as customer_id,
    c.first_name,
    c.last_name,
    COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    
    -- Device info (flattened)
    d.id as device_id,
    d.device_type,
    d.brand as device_brand,
    d.model as device_model,
    COALESCE(d.brand, '') || ' ' || COALESCE(d.model, '') as device_name,
    d.color as device_color,
    d.serial_number,
    d.imei,
    
    -- Time slot info
    ts.id as time_slot_id,
    ts.name as time_slot_name,
    ts.start_time as slot_start_time,
    ts.end_time as slot_end_time,
    
    -- Store info
    s.id as store_id,
    s.name as store_name,
    s.phone as store_phone

FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN devices d ON a.device_id = d.id
LEFT JOIN time_slots ts ON a.time_slot_id = ts.id
LEFT JOIN stores s ON a.store_id = s.id
WHERE c.deleted_at IS NULL;

-- ==================== CUSTOMERS VIEW ====================
-- Customer with booking stats
DROP VIEW IF EXISTS customers_view;

CREATE VIEW customers_view AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as full_name,
    c.email,
    c.phone,
    c.address1,
    c.address2,
    c.city,
    c.state,
    c.zip,
    c.notes,
    c.user_id,
    c.created_at,
    c.updated_at,
    COUNT(a.id) as total_bookings,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_bookings,
    MAX(a.scheduled_date) as last_visit
FROM customers c
LEFT JOIN appointments a ON c.id = a.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- ==================== INVENTORY VIEW ====================
-- Parts/products with stock levels
DROP VIEW IF EXISTS inventory_view;

CREATE VIEW inventory_view AS
SELECT 
    i.id as item_id,
    i.item_type,
    i.sku,
    i.name,
    i.description,
    i.is_taxable,
    i.is_active,
    i.track_inventory,
    i.created_at,
    -- Latest price
    (SELECT price FROM item_prices WHERE item_id = i.id ORDER BY effective_from DESC LIMIT 1) as current_price,
    -- Latest cost
    (SELECT cost FROM item_costs WHERE item_id = i.id ORDER BY effective_from DESC LIMIT 1) as current_cost,
    -- Total stock across all locations
    COALESCE(SUM(sl.qty_on_hand), 0) as total_stock,
    -- Category
    ic.name as category_name
FROM items i
LEFT JOIN stock_levels sl ON i.id = sl.item_id
LEFT JOIN item_categories ic ON i.category_id = ic.id
WHERE i.deleted_at IS NULL
GROUP BY i.id, ic.name;

-- ==================== REPAIR TICKETS VIEW ====================
-- Full repair ticket info with customer, device, services
DROP VIEW IF EXISTS tickets_view;

CREATE VIEW tickets_view AS
SELECT 
    rt.id as ticket_id,
    rt.ticket_number,
    rt.status,
    rt.priority,
    rt.opened_at,
    rt.closed_at,
    rt.updated_at,
    
    -- Customer
    c.id as customer_id,
    COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    
    -- Device
    d.id as device_id,
    d.device_type,
    COALESCE(d.brand, '') || ' ' || COALESCE(d.model, '') as device_name,
    
    -- Appointment link
    rt.appointment_id,
    
    -- Created by
    p.full_name as created_by_name

FROM repair_tickets rt
LEFT JOIN customers c ON rt.customer_id = c.id
LEFT JOIN devices d ON rt.device_id = d.id
LEFT JOIN profiles p ON rt.created_by = p.id
WHERE rt.deleted_at IS NULL;

-- ==================== SALES VIEW ====================
-- Sales orders with customer and totals
DROP VIEW IF EXISTS sales_view;

CREATE VIEW sales_view AS
SELECT 
    so.id as order_id,
    so.order_number,
    so.status,
    so.opened_at,
    so.closed_at,
    so.subtotal,
    so.tax_total,
    so.discount_total,
    so.total,
    so.notes,
    
    -- Customer
    c.id as customer_id,
    COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '') as customer_name,
    c.phone as customer_phone,
    
    -- Cashier
    p.full_name as cashier_name,
    
    -- Register/Store
    r.name as register_name,
    s.name as store_name

FROM sales_orders so
LEFT JOIN customers c ON so.customer_id = c.id
LEFT JOIN profiles p ON so.cashier_id = p.id
LEFT JOIN registers r ON so.register_id = r.id
LEFT JOIN stores s ON r.store_id = s.id
WHERE so.deleted_at IS NULL;

-- ==================== GRANT SELECT ON VIEWS ====================
-- Allow authenticated users to query views
GRANT SELECT ON bookings_view TO authenticated;
GRANT SELECT ON customers_view TO authenticated;
GRANT SELECT ON inventory_view TO authenticated;
GRANT SELECT ON tickets_view TO authenticated;
GRANT SELECT ON sales_view TO authenticated;

-- Allow anon for public booking lookups
GRANT SELECT ON bookings_view TO anon;

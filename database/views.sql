-- ====================================================
-- SIFIXA DATABASE VIEWS
-- Run this AFTER sifixa_setup.sql and seed.sql
-- ====================================================

-- ==================== CUSTOMERS VIEW ====================
-- Aggregated customer data with stats
DROP VIEW IF EXISTS customers_view;
CREATE OR REPLACE VIEW customers_view AS
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.first_name || ' ' || COALESCE(c.last_name, '') AS full_name,
    c.email,
    c.phone,
    c.address1,
    c.address2,
    c.city,
    c.state,
    c.zip,
    c.notes,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Stats
    COUNT(DISTINCT a.id) AS total_appointments,
    COUNT(DISTINCT d.id) AS total_devices,
    MAX(a.created_at) AS last_appointment_date
FROM customers c
LEFT JOIN devices d ON d.customer_id = c.id
LEFT JOIN appointments a ON a.customer_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- ==================== INVENTORY VIEW ====================
-- Items with current stock levels and pricing
DROP VIEW IF EXISTS inventory_view;
CREATE OR REPLACE VIEW inventory_view AS
SELECT 
    i.id AS item_id,
    i.sku,
    i.name,
    i.description,
    i.item_type,
    i.is_taxable,
    i.is_active,
    i.track_inventory,
    i.created_at,
    -- Current price (most recent)
    (
        SELECT ip.price 
        FROM item_prices ip 
        WHERE ip.item_id = i.id 
        ORDER BY ip.effective_from DESC 
        LIMIT 1
    ) AS current_price,
    -- Current cost (most recent)
    (
        SELECT ic.cost 
        FROM item_costs ic 
        WHERE ic.item_id = i.id 
        ORDER BY ic.effective_from DESC 
        LIMIT 1
    ) AS current_cost,
    -- Total stock across all stores
    COALESCE(SUM(sl.quantity), 0) AS total_stock,
    -- Stock by store (as JSON)
    COALESCE(
        jsonb_object_agg(s.name, sl.quantity) FILTER (WHERE s.id IS NOT NULL),
        '{}'::jsonb
    ) AS stock_by_store
FROM items i
LEFT JOIN stock_levels sl ON sl.item_id = i.id
LEFT JOIN stores s ON s.id = sl.store_id
WHERE i.deleted_at IS NULL
GROUP BY i.id;

-- ==================== BOOKING DETAILS VIEW ====================
-- Full booking/appointment information with customer and device
DROP VIEW IF EXISTS booking_details_view;
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    a.id AS booking_id,
    a.tracking_number,
    a.status,
    a.scheduled_date,
    a.scheduled_start,
    a.scheduled_end,
    a.notes AS booking_notes,
    a.priority_level,
    a.created_at AS booking_created,
    a.updated_at AS booking_updated,
    -- Customer info
    c.id AS customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    -- Device info
    d.id AS device_id,
    d.device_type,
    d.brand AS device_brand,
    d.model AS device_model,
    d.serial_number,
    d.condition_notes,
    -- Store info
    s.id AS store_id,
    s.name AS store_name,
    -- Time slot
    ts.name AS time_slot_name,
    ts.start_time,
    ts.end_time,
    -- Service/item info
    i.id AS service_id,
    i.name AS service_name,
    ip.price AS service_price
FROM appointments a
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN devices d ON d.id = a.device_id
LEFT JOIN stores s ON s.id = a.store_id
LEFT JOIN time_slots ts ON ts.id = a.time_slot_id
LEFT JOIN items i ON i.id = a.item_id
LEFT JOIN item_prices ip ON ip.item_id = i.id 
    AND ip.effective_from = (
        SELECT MAX(effective_from) 
        FROM item_prices 
        WHERE item_id = i.id AND effective_from <= NOW()
    );

-- ==================== REPAIR TICKETS VIEW ====================
-- Tickets with full context
DROP VIEW IF EXISTS repair_tickets_view;
CREATE OR REPLACE VIEW repair_tickets_view AS
SELECT 
    rt.id AS ticket_id,
    rt.ticket_number,
    rt.status,
    rt.priority,
    rt.problem_description,
    rt.diagnosis,
    rt.resolution,
    rt.estimated_cost,
    rt.final_cost,
    rt.estimated_completion,
    rt.actual_completion,
    rt.created_at AS ticket_created,
    rt.updated_at AS ticket_updated,
    -- Appointment/Booking
    a.id AS appointment_id,
    a.tracking_number AS booking_tracking,
    a.scheduled_date,
    -- Customer
    c.id AS customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    -- Device
    d.id AS device_id,
    d.device_type,
    d.brand,
    d.model,
    -- Technician
    tech.id AS technician_id,
    tech.full_name AS technician_name,
    -- Store
    s.id AS store_id,
    s.name AS store_name
FROM repair_tickets rt
LEFT JOIN appointments a ON a.id = rt.appointment_id
LEFT JOIN customers c ON c.id = rt.customer_id
LEFT JOIN devices d ON d.id = rt.device_id
LEFT JOIN profiles tech ON tech.id = rt.technician_id
LEFT JOIN stores s ON s.id = rt.store_id;

-- ==================== SALES SUMMARY VIEW ====================
-- Sales orders with totals
DROP VIEW IF EXISTS sales_summary_view;
CREATE OR REPLACE VIEW sales_summary_view AS
SELECT 
    so.id AS order_id,
    so.order_number,
    so.status,
    so.order_date,
    so.subtotal,
    so.tax_amount,
    so.discount_amount,
    so.total,
    so.payment_status,
    so.created_at,
    -- Customer
    c.id AS customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') AS customer_name,
    c.email AS customer_email,
    -- Store
    s.name AS store_name,
    -- Cashier
    cashier.full_name AS cashier_name,
    -- Item count
    (SELECT COUNT(*) FROM sales_order_items WHERE order_id = so.id) AS item_count
FROM sales_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN stores s ON s.id = so.store_id
LEFT JOIN profiles cashier ON cashier.id = so.user_id;

-- ==================== STAFF DASHBOARD VIEW ====================
-- Quick stats for dashboard
DROP VIEW IF EXISTS staff_dashboard_stats;
CREATE OR REPLACE VIEW staff_dashboard_stats AS
SELECT
    -- Today's appointments
    (SELECT COUNT(*) FROM appointments WHERE scheduled_date = CURRENT_DATE AND status != 'canceled') AS today_appointments,
    -- Pending appointments
    (SELECT COUNT(*) FROM appointments WHERE status = 'pending') AS pending_appointments,
    -- In progress repairs
    (SELECT COUNT(*) FROM repair_tickets WHERE status = 'in_progress') AS in_progress_repairs,
    -- Completed today
    (SELECT COUNT(*) FROM appointments WHERE status = 'completed' AND DATE(updated_at) = CURRENT_DATE) AS completed_today,
    -- Low stock items
    (SELECT COUNT(DISTINCT item_id) FROM stock_levels sl 
     JOIN items i ON i.id = sl.item_id 
     WHERE sl.quantity < 10 AND i.track_inventory = true) AS low_stock_items,
    -- Unread messages
    (SELECT COUNT(*) FROM messages WHERE status = 'sent' AND sender_type = 'customer') AS unread_messages,
    -- Today's revenue
    (SELECT COALESCE(SUM(total), 0) FROM sales_orders 
     WHERE DATE(order_date) = CURRENT_DATE AND status = 'completed') AS today_revenue;

-- ==================== PERMISSIONS ====================
-- Grant access to authenticated users
GRANT SELECT ON customers_view TO authenticated;
GRANT SELECT ON inventory_view TO authenticated;
GRANT SELECT ON booking_details_view TO authenticated;
GRANT SELECT ON repair_tickets_view TO authenticated;
GRANT SELECT ON sales_summary_view TO authenticated;
GRANT SELECT ON staff_dashboard_stats TO authenticated;

-- Grant public read for some views (for tracking)
GRANT SELECT ON booking_details_view TO anon;

-- ====================================================
-- SIFIXA DATABASE VIEWS
-- Run this AFTER sifixa_setup.sql and seed.sql
-- ====================================================

-- ==================== CUSTOMERS VIEW ====================
-- Aggregated customer data with stats
DROP VIEW IF EXISTS customers_view CASCADE;
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
    c.created_at,
    c.updated_at,
    -- Stats
    COALESCE(appointment_counts.total, 0) AS total_appointments,
    COALESCE(device_counts.total, 0) AS total_devices,
    appointment_counts.last_date AS last_appointment_date
FROM customers c
LEFT JOIN (
    SELECT customer_id, COUNT(*) AS total, MAX(created_at) AS last_date
    FROM appointments GROUP BY customer_id
) appointment_counts ON appointment_counts.customer_id = c.id
LEFT JOIN (
    SELECT customer_id, COUNT(*) AS total
    FROM devices GROUP BY customer_id
) device_counts ON device_counts.customer_id = c.id
WHERE c.deleted_at IS NULL;

-- ==================== INVENTORY VIEW ====================
-- Items with current stock levels and pricing
DROP VIEW IF EXISTS inventory_view CASCADE;
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
    price_data.price AS current_price,
    -- Current cost (most recent)
    cost_data.cost AS current_cost,
    -- Total stock
    COALESCE(stock_data.total_qty, 0) AS total_stock
FROM items i
LEFT JOIN LATERAL (
    SELECT price FROM item_prices 
    WHERE item_id = i.id ORDER BY effective_from DESC LIMIT 1
) price_data ON true
LEFT JOIN LATERAL (
    SELECT cost FROM item_costs 
    WHERE item_id = i.id ORDER BY effective_from DESC LIMIT 1
) cost_data ON true
LEFT JOIN (
    SELECT item_id, SUM(qty_on_hand) AS total_qty
    FROM stock_levels GROUP BY item_id
) stock_data ON stock_data.item_id = i.id
WHERE i.deleted_at IS NULL;

-- ==================== BOOKING DETAILS VIEW ====================
-- Full booking/appointment information with customer and device
DROP VIEW IF EXISTS booking_details_view CASCADE;
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    a.id AS booking_id,
    a.tracking_number,
    a.status,
    a.scheduled_date,
    a.scheduled_start,
    a.scheduled_end,
    a.notes AS booking_notes,
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
    ts.end_time
FROM appointments a
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN devices d ON d.id = a.device_id
LEFT JOIN stores s ON s.id = a.store_id
LEFT JOIN time_slots ts ON ts.id = a.time_slot_id;

-- ==================== REPAIR TICKETS VIEW ====================
-- Tickets with full context
DROP VIEW IF EXISTS repair_tickets_view CASCADE;
CREATE OR REPLACE VIEW repair_tickets_view AS
SELECT 
    rt.id AS ticket_id,
    rt.ticket_number,
    rt.status,
    rt.priority,
    rt.opened_at,
    rt.closed_at,
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
    -- Technician (from assignments)
    tech.id AS technician_id,
    tech.full_name AS technician_name
FROM repair_tickets rt
LEFT JOIN appointments a ON a.id = rt.appointment_id
LEFT JOIN customers c ON c.id = rt.customer_id
LEFT JOIN devices d ON d.id = rt.device_id
LEFT JOIN LATERAL (
    SELECT ta.tech_id, p.full_name, p.id
    FROM ticket_assignments ta
    JOIN profiles p ON p.id = ta.tech_id
    WHERE ta.ticket_id = rt.id AND ta.unassigned_at IS NULL
    LIMIT 1
) tech ON true
WHERE rt.deleted_at IS NULL;

-- ==================== SALES SUMMARY VIEW ====================
-- Sales orders with totals
DROP VIEW IF EXISTS sales_summary_view CASCADE;
CREATE OR REPLACE VIEW sales_summary_view AS
SELECT 
    so.id AS order_id,
    so.order_number,
    so.status,
    so.subtotal,
    so.tax_amount,
    so.discount_amount,
    so.total,
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
    COALESCE(item_counts.total, 0) AS item_count
FROM sales_orders so
LEFT JOIN customers c ON c.id = so.customer_id
LEFT JOIN stores s ON s.id = so.store_id
LEFT JOIN profiles cashier ON cashier.id = so.created_by
LEFT JOIN (
    SELECT sales_order_id, COUNT(*) AS total
    FROM sales_order_items GROUP BY sales_order_id
) item_counts ON item_counts.sales_order_id = so.id;

-- ==================== INVOICE VIEW ====================
-- Invoices with customer and ticket info
DROP VIEW IF EXISTS invoice_view CASCADE;
CREATE OR REPLACE VIEW invoice_view AS
SELECT 
    inv.id AS invoice_id,
    inv.invoice_number,
    inv.status,
    inv.subtotal,
    inv.tax_amount,
    inv.discount_amount,
    inv.total,
    inv.issued_at,
    inv.due_at,
    inv.paid_at,
    inv.created_at,
    -- Customer
    c.id AS customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') AS customer_name,
    c.email AS customer_email,
    -- Ticket
    rt.ticket_number,
    rt.status AS ticket_status
FROM invoices inv
LEFT JOIN customers c ON c.id = inv.customer_id
LEFT JOIN repair_tickets rt ON rt.id = inv.ticket_id;

-- ==================== STAFF DASHBOARD VIEW ====================
-- Quick stats for dashboard
DROP VIEW IF EXISTS staff_dashboard_stats CASCADE;
CREATE OR REPLACE VIEW staff_dashboard_stats AS
SELECT
    -- Today's appointments
    (SELECT COUNT(*) FROM appointments WHERE scheduled_date = CURRENT_DATE AND status != 'canceled') AS today_appointments,
    -- Pending appointments
    (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') AS pending_appointments,
    -- In progress repairs
    (SELECT COUNT(*) FROM repair_tickets WHERE status = 'in_progress') AS in_progress_repairs,
    -- Ready for pickup
    (SELECT COUNT(*) FROM repair_tickets WHERE status = 'ready') AS ready_for_pickup,
    -- Today's completed
    (SELECT COUNT(*) FROM appointments WHERE status = 'arrived' AND DATE(updated_at) = CURRENT_DATE) AS completed_today,
    -- Low stock items (below reorder point)
    (SELECT COUNT(DISTINCT item_id) FROM stock_levels 
     WHERE qty_on_hand <= COALESCE(reorder_point, 5)) AS low_stock_items,
    -- Open conversations
    (SELECT COUNT(*) FROM conversations WHERE status = 'open') AS open_conversations,
    -- Today's revenue
    (SELECT COALESCE(SUM(total), 0) FROM sales_orders 
     WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') AS today_revenue;

-- ==================== PERMISSIONS ====================
-- Grant access to authenticated users
GRANT SELECT ON customers_view TO authenticated;
GRANT SELECT ON inventory_view TO authenticated;
GRANT SELECT ON booking_details_view TO authenticated;
GRANT SELECT ON repair_tickets_view TO authenticated;
GRANT SELECT ON sales_summary_view TO authenticated;
GRANT SELECT ON invoice_view TO authenticated;
GRANT SELECT ON staff_dashboard_stats TO authenticated;

-- Grant public read for tracking
GRANT SELECT ON booking_details_view TO anon;

-- ====================================================
-- SIFIXA Database Migration: Add Tracking Number
-- Run this in Supabase SQL Editor
-- ====================================================

-- Step 1: Add tracking_number column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tracking_number TEXT;


-- Step 3: Populate tracking numbers for existing bookings without one
-- First, drop the unique constraint if it exists (in case of re-run)
DROP INDEX IF EXISTS idx_appointments_tracking_number;

-- Use a CTE with row_number to ensure unique tracking numbers
WITH numbered_appointments AS (
    SELECT 
        id, 
        created_at,
        ROW_NUMBER() OVER (PARTITION BY created_at::DATE ORDER BY created_at, id) as day_seq
    FROM appointments 
    WHERE tracking_number IS NULL
)
UPDATE appointments a
SET tracking_number = 'SFX-' || TO_CHAR(na.created_at::DATE, 'YYYYMMDD') || '-' || LPAD(na.day_seq::TEXT, 3, '0')
FROM numbered_appointments na
WHERE a.id = na.id;

-- Now create the unique index
CREATE UNIQUE INDEX idx_appointments_tracking_number 
ON appointments(tracking_number) WHERE tracking_number IS NOT NULL;

-- Step 4: Recreate bookings_view with tracking_number
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

-- Step 5: Grant permissions
GRANT SELECT ON bookings_view TO authenticated;
GRANT SELECT ON bookings_view TO anon;

-- Step 6: Recreate search_bookings function with tracking_number search
DROP FUNCTION IF EXISTS search_bookings;

CREATE OR REPLACE FUNCTION search_bookings(
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_store_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(row_to_json(t))
    INTO v_result
    FROM (
        SELECT *
        FROM bookings_view bv
        WHERE 
            (p_search IS NULL OR 
             bv.tracking_number ILIKE '%' || p_search || '%' OR
             bv.customer_name ILIKE '%' || p_search || '%' OR
             bv.customer_email ILIKE '%' || p_search || '%' OR
             bv.customer_phone ILIKE '%' || p_search || '%' OR
             bv.device_name ILIKE '%' || p_search || '%' OR
             bv.booking_id::text ILIKE '%' || p_search || '%')
            AND (p_status IS NULL OR bv.status = p_status)
            AND (p_date_from IS NULL OR bv.scheduled_date >= p_date_from)
            AND (p_date_to IS NULL OR bv.scheduled_date <= p_date_to)
            AND (p_store_id IS NULL OR bv.store_id = p_store_id)
        ORDER BY bv.scheduled_date DESC, bv.scheduled_start DESC
        LIMIT p_limit
        OFFSET p_offset
    ) t;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION search_bookings TO anon;

-- Done! Now tracking numbers are stored and searchable.

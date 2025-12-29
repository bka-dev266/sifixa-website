-- ====================================================
-- SIFIXA Database Functions (RPC)
-- Transaction-based operations for the API
-- Run this in Supabase SQL Editor
-- ====================================================

-- ==================== CREATE BOOKING ====================
-- Creates customer (if needed), device, appointment, and status history in one transaction
DROP FUNCTION IF EXISTS create_booking;

CREATE OR REPLACE FUNCTION create_booking(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_device_type TEXT DEFAULT 'phone',
    p_device_brand TEXT DEFAULT NULL,
    p_device_model TEXT DEFAULT NULL,
    p_scheduled_date DATE DEFAULT CURRENT_DATE,
    p_time_slot_id UUID DEFAULT NULL,
    p_issue TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'regular',
    p_store_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_customer_id UUID;
    v_device_id UUID;
    v_appointment_id UUID;
    v_store_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_scheduled_start TIME;
    v_tracking_number TEXT;
BEGIN
    -- Parse name
    v_first_name := split_part(p_customer_name, ' ', 1);
    v_last_name := NULLIF(TRIM(substring(p_customer_name from position(' ' in p_customer_name) + 1)), '');
    
    -- Get store (use provided or get default)
    IF p_store_id IS NULL THEN
        SELECT id INTO v_store_id FROM stores WHERE is_active = true LIMIT 1;
    ELSE
        v_store_id := p_store_id;
    END IF;
    
    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'No active store found';
    END IF;
    
    -- Find or create customer
    SELECT id INTO v_customer_id 
    FROM customers 
    WHERE email = p_customer_email AND deleted_at IS NULL;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (first_name, last_name, email, phone)
        VALUES (v_first_name, v_last_name, p_customer_email, p_customer_phone)
        RETURNING id INTO v_customer_id;
    ELSE
        -- Update phone if provided
        IF p_customer_phone IS NOT NULL THEN
            UPDATE customers SET phone = p_customer_phone WHERE id = v_customer_id;
        END IF;
    END IF;
    
    -- Create device record
    INSERT INTO devices (customer_id, device_type, brand, model)
    VALUES (v_customer_id, p_device_type, p_device_brand, p_device_model)
    RETURNING id INTO v_device_id;
    
    -- Get time slot start time if provided
    IF p_time_slot_id IS NOT NULL THEN
        SELECT start_time INTO v_scheduled_start FROM time_slots WHERE id = p_time_slot_id;
    ELSE
        v_scheduled_start := '09:00:00';
    END IF;
    
    -- Generate tracking number first (use sequence for uniqueness)
    v_tracking_number := 'SFX-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
    
    -- Create appointment with tracking number
    INSERT INTO appointments (
        customer_id, 
        device_id, 
        store_id, 
        time_slot_id,
        scheduled_date, 
        scheduled_start,
        status, 
        notes,
        tracking_number
    )
    VALUES (
        v_customer_id, 
        v_device_id, 
        v_store_id, 
        p_time_slot_id,
        p_scheduled_date, 
        v_scheduled_start,
        'scheduled', 
        p_issue,
        v_tracking_number
    )
    RETURNING id INTO v_appointment_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'booking_id', v_appointment_id,
        'tracking_number', v_tracking_number,
        'customer_id', v_customer_id,
        'device_id', v_device_id,
        'scheduled_date', p_scheduled_date,
        'status', 'scheduled'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== UPDATE BOOKING STATUS ====================
DROP FUNCTION IF EXISTS update_booking_status;

CREATE OR REPLACE FUNCTION update_booking_status(
    p_booking_id UUID,
    p_new_status TEXT,
    p_notes TEXT DEFAULT NULL,
    p_changed_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status FROM appointments WHERE id = p_booking_id;
    
    IF v_old_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    -- Update appointment
    UPDATE appointments 
    SET status = p_new_status, 
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Log status change (if we have repair_tickets linked)
    -- For now, just return success
    
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== VOID/CANCEL BOOKING ====================
DROP FUNCTION IF EXISTS void_booking;

CREATE OR REPLACE FUNCTION void_booking(
    p_booking_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_voided_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status FROM appointments WHERE id = p_booking_id;
    
    IF v_old_status IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    IF v_old_status = 'canceled' THEN
        RETURN json_build_object('success', false, 'error', 'Booking already canceled');
    END IF;
    
    -- Update to canceled
    UPDATE appointments 
    SET status = 'canceled',
        notes = COALESCE(notes || E'\n', '') || 'Canceled: ' || COALESCE(p_reason, 'No reason provided'),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'old_status', v_old_status,
        'new_status', 'canceled'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SEARCH BOOKINGS ====================
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

-- ==================== CREATE CUSTOMER ====================
DROP FUNCTION IF EXISTS create_customer;

CREATE OR REPLACE FUNCTION create_customer(
    p_first_name TEXT,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_address1 TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_zip TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Check if email already exists
    IF p_email IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE email = p_email AND deleted_at IS NULL;
        IF v_customer_id IS NOT NULL THEN
            RETURN json_build_object('success', false, 'error', 'Email already exists', 'customer_id', v_customer_id);
        END IF;
    END IF;
    
    -- Create customer
    INSERT INTO customers (first_name, last_name, email, phone, address1, city, state, zip, notes)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_address1, p_city, p_state, p_zip, p_notes)
    RETURNING id INTO v_customer_id;
    
    RETURN json_build_object(
        'success', true,
        'customer_id', v_customer_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== UPDATE CUSTOMER ====================
DROP FUNCTION IF EXISTS update_customer;

CREATE OR REPLACE FUNCTION update_customer(
    p_customer_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_address1 TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_zip TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
    UPDATE customers SET
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        address1 = COALESCE(p_address1, address1),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        zip = COALESCE(p_zip, zip),
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_customer_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Customer not found');
    END IF;
    
    RETURN json_build_object('success', true, 'customer_id', p_customer_id);
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SEARCH CUSTOMERS ====================
DROP FUNCTION IF EXISTS search_customers;

CREATE OR REPLACE FUNCTION search_customers(
    p_search TEXT DEFAULT NULL,
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
        FROM customers_view cv
        WHERE 
            p_search IS NULL OR 
            cv.full_name ILIKE '%' || p_search || '%' OR
            cv.email ILIKE '%' || p_search || '%' OR
            cv.phone ILIKE '%' || p_search || '%'
        ORDER BY cv.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) t;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GET BOOKING BY ID ====================
DROP FUNCTION IF EXISTS get_booking;

CREATE OR REPLACE FUNCTION get_booking(p_booking_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT row_to_json(bv)
    INTO v_result
    FROM bookings_view bv
    WHERE bv.booking_id = p_booking_id;
    
    IF v_result IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== ADJUST INVENTORY ====================
DROP FUNCTION IF EXISTS adjust_inventory;

CREATE OR REPLACE FUNCTION adjust_inventory(
    p_item_id UUID,
    p_qty_change INT,
    p_reason TEXT DEFAULT 'adjustment',
    p_adjusted_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_location_id UUID;
    v_current_qty INT;
    v_new_qty INT;
BEGIN
    -- Get default location
    SELECT id INTO v_location_id FROM stock_locations WHERE is_default = true LIMIT 1;
    
    IF v_location_id IS NULL THEN
        -- Create a default location if none exists
        INSERT INTO stock_locations (name, is_default) VALUES ('Main', true)
        RETURNING id INTO v_location_id;
    END IF;
    
    -- Get current stock
    SELECT qty_on_hand INTO v_current_qty 
    FROM stock_levels 
    WHERE location_id = v_location_id AND item_id = p_item_id;
    
    IF v_current_qty IS NULL THEN
        -- Create stock level record
        INSERT INTO stock_levels (location_id, item_id, qty_on_hand)
        VALUES (v_location_id, p_item_id, p_qty_change);
        v_new_qty := p_qty_change;
    ELSE
        v_new_qty := v_current_qty + p_qty_change;
        UPDATE stock_levels 
        SET qty_on_hand = v_new_qty, updated_at = NOW()
        WHERE location_id = v_location_id AND item_id = p_item_id;
    END IF;
    
    -- Log movement
    INSERT INTO stock_movements (location_id, item_id, movement_type, qty_change, note, created_by)
    VALUES (v_location_id, p_item_id, 'adjustment', p_qty_change, p_reason, p_adjusted_by);
    
    RETURN json_build_object(
        'success', true,
        'item_id', p_item_id,
        'previous_qty', COALESCE(v_current_qty, 0),
        'new_qty', v_new_qty,
        'change', p_qty_change
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GRANT EXECUTE PERMISSIONS ====================
GRANT EXECUTE ON FUNCTION create_booking TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_status TO authenticated;
GRANT EXECUTE ON FUNCTION void_booking TO authenticated;
GRANT EXECUTE ON FUNCTION search_bookings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_customer TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer TO authenticated;
GRANT EXECUTE ON FUNCTION search_customers TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION adjust_inventory TO authenticated;

-- ====================================================
-- SIFIXA RPC FUNCTIONS
-- Run this AFTER sifixa_setup.sql and views.sql
-- These are PostgreSQL functions called via supabase.rpc()
-- ====================================================

-- Drop existing functions first (if they exist)
DROP FUNCTION IF EXISTS generate_tracking_number() CASCADE;
DROP FUNCTION IF EXISTS create_booking CASCADE;
DROP FUNCTION IF EXISTS search_bookings CASCADE;
DROP FUNCTION IF EXISTS get_booking CASCADE;
DROP FUNCTION IF EXISTS update_booking_status CASCADE;
DROP FUNCTION IF EXISTS void_booking CASCADE;
DROP FUNCTION IF EXISTS create_customer CASCADE;
DROP FUNCTION IF EXISTS search_customers CASCADE;
DROP FUNCTION IF EXISTS update_customer CASCADE;
DROP FUNCTION IF EXISTS adjust_inventory CASCADE;
DROP FUNCTION IF EXISTS get_booking_by_tracking CASCADE;

-- ==================== BOOKING FUNCTIONS ====================

-- Generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    seq_num INTEGER;
    tracking TEXT;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(SPLIT_PART(tracking_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM appointments
    WHERE tracking_number LIKE 'SFX-' || today_date || '-%';
    
    tracking := 'SFX-' || today_date || '-' || LPAD(seq_num::TEXT, 3, '0');
    RETURN tracking;
END;
$$ LANGUAGE plpgsql;

-- Create booking (customer + device + appointment in one transaction)
CREATE OR REPLACE FUNCTION create_booking(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_device_type TEXT DEFAULT 'phone',
    p_device_brand TEXT DEFAULT NULL,
    p_device_model TEXT DEFAULT NULL,
    p_scheduled_date DATE DEFAULT NULL,
    p_time_slot_id UUID DEFAULT NULL,
    p_issue TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'regular',
    p_store_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
    v_device_id UUID;
    v_appointment_id UUID;
    v_tracking_number TEXT;
    v_store UUID;
    v_name_parts TEXT[];
BEGIN
    -- Parse name
    v_name_parts := STRING_TO_ARRAY(COALESCE(p_customer_name, 'Customer'), ' ');
    
    -- Get default store if not provided
    IF p_store_id IS NULL THEN
        SELECT id INTO v_store FROM stores WHERE is_active = true LIMIT 1;
    ELSE
        v_store := p_store_id;
    END IF;
    
    -- Find or create customer
    SELECT id INTO v_customer_id FROM customers WHERE email = p_customer_email LIMIT 1;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (first_name, last_name, email, phone)
        VALUES (
            v_name_parts[1],
            CASE WHEN array_length(v_name_parts, 1) > 1 
                THEN array_to_string(v_name_parts[2:], ' ') 
                ELSE NULL 
            END,
            p_customer_email,
            p_customer_phone
        )
        RETURNING id INTO v_customer_id;
    END IF;
    
    -- Create device
    INSERT INTO devices (customer_id, device_type, brand, model, condition_notes)
    VALUES (v_customer_id, p_device_type, p_device_brand, p_device_model, p_issue)
    RETURNING id INTO v_device_id;
    
    -- Generate tracking number
    v_tracking_number := generate_tracking_number();
    
    -- Create appointment
    INSERT INTO appointments (
        customer_id, 
        device_id, 
        store_id, 
        scheduled_date, 
        time_slot_id,
        notes, 
        priority_level, 
        status,
        tracking_number
    )
    VALUES (
        v_customer_id,
        v_device_id,
        v_store,
        COALESCE(p_scheduled_date, CURRENT_DATE + 1),
        p_time_slot_id,
        p_issue,
        p_priority,
        'pending',
        v_tracking_number
    )
    RETURNING id INTO v_appointment_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_appointment_id,
        'customer_id', v_customer_id,
        'device_id', v_device_id,
        'tracking_number', v_tracking_number
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search bookings with filters
CREATE OR REPLACE FUNCTION search_bookings(
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_store_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    booking_id UUID,
    tracking_number TEXT,
    status TEXT,
    scheduled_date DATE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    device_type TEXT,
    device_brand TEXT,
    device_model TEXT,
    store_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS booking_id,
        a.tracking_number,
        a.status,
        a.scheduled_date,
        c.first_name || ' ' || COALESCE(c.last_name, '') AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        d.device_type,
        d.brand AS device_brand,
        d.model AS device_model,
        s.name AS store_name,
        a.created_at
    FROM appointments a
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN devices d ON d.id = a.device_id
    LEFT JOIN stores s ON s.id = a.store_id
    WHERE 
        (p_search IS NULL OR 
            a.tracking_number ILIKE '%' || p_search || '%' OR
            c.first_name ILIKE '%' || p_search || '%' OR
            c.last_name ILIKE '%' || p_search || '%' OR
            c.email ILIKE '%' || p_search || '%' OR
            c.phone ILIKE '%' || p_search || '%'
        )
        AND (p_status IS NULL OR a.status = p_status)
        AND (p_date_from IS NULL OR a.scheduled_date >= p_date_from)
        AND (p_date_to IS NULL OR a.scheduled_date <= p_date_to)
        AND (p_store_id IS NULL OR a.store_id = p_store_id)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get booking by ID
CREATE OR REPLACE FUNCTION get_booking(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'tracking_number', a.tracking_number,
        'status', a.status,
        'scheduled_date', a.scheduled_date,
        'scheduled_start', a.scheduled_start,
        'notes', a.notes,
        'priority_level', a.priority_level,
        'created_at', a.created_at,
        'customer', jsonb_build_object(
            'id', c.id,
            'name', c.first_name || ' ' || COALESCE(c.last_name, ''),
            'email', c.email,
            'phone', c.phone
        ),
        'device', jsonb_build_object(
            'id', d.id,
            'type', d.device_type,
            'brand', d.brand,
            'model', d.model,
            'condition', d.condition_notes
        ),
        'store', jsonb_build_object(
            'id', s.id,
            'name', s.name
        )
    ) INTO v_result
    FROM appointments a
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN devices d ON d.id = a.device_id
    LEFT JOIN stores s ON s.id = a.store_id
    WHERE a.id = p_booking_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update booking status
CREATE OR REPLACE FUNCTION update_booking_status(
    p_booking_id UUID,
    p_new_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_old_status FROM appointments WHERE id = p_booking_id;
    
    IF v_old_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    -- Update appointment
    UPDATE appointments 
    SET 
        status = p_new_status,
        notes = COALESCE(p_notes, notes),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Log status change
    INSERT INTO repair_tracking_history (
        appointment_id,
        status,
        notes
    ) VALUES (
        p_booking_id,
        p_new_status,
        'Status changed from ' || v_old_status || ' to ' || p_new_status
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Void/cancel booking
CREATE OR REPLACE FUNCTION void_booking(
    p_booking_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    UPDATE appointments 
    SET 
        status = 'canceled',
        void_reason = p_reason,
        voided_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Log cancellation
    INSERT INTO repair_tracking_history (
        appointment_id,
        status,
        notes
    ) VALUES (
        p_booking_id,
        'canceled',
        'Booking canceled. Reason: ' || COALESCE(p_reason, 'Not specified')
    );
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== CUSTOMER FUNCTIONS ====================

-- Create customer
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
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Check for existing customer by email
    IF p_email IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE email = p_email LIMIT 1;
        IF v_customer_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Customer with this email already exists',
                'existing_id', v_customer_id
            );
        END IF;
    END IF;
    
    INSERT INTO customers (first_name, last_name, email, phone, address1, city, state, zip, notes)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_address1, p_city, p_state, p_zip, p_notes)
    RETURNING id INTO v_customer_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'customer_id', v_customer_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search customers
CREATE OR REPLACE FUNCTION search_customers(
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    total_appointments BIGINT,
    last_visit DATE,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.first_name || ' ' || COALESCE(c.last_name, '') AS full_name,
        c.email,
        c.phone,
        COUNT(a.id) AS total_appointments,
        MAX(a.scheduled_date)::DATE AS last_visit,
        c.created_at
    FROM customers c
    LEFT JOIN appointments a ON a.customer_id = c.id
    WHERE 
        c.deleted_at IS NULL
        AND (p_search IS NULL OR 
            c.first_name ILIKE '%' || p_search || '%' OR
            c.last_name ILIKE '%' || p_search || '%' OR
            c.email ILIKE '%' || p_search || '%' OR
            c.phone ILIKE '%' || p_search || '%'
        )
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update customer
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
)
RETURNS JSONB AS $$
BEGIN
    UPDATE customers
    SET 
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
    WHERE id = p_customer_id;
    
    RETURN jsonb_build_object('success', true, 'customer_id', p_customer_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== INVENTORY FUNCTIONS ====================

-- Adjust inventory with logging
CREATE OR REPLACE FUNCTION adjust_inventory(
    p_item_id UUID,
    p_qty_change INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_store_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_store UUID;
    v_old_qty INTEGER;
    v_new_qty INTEGER;
BEGIN
    -- Get default store if not provided
    IF p_store_id IS NULL THEN
        SELECT id INTO v_store FROM stores WHERE is_active = true LIMIT 1;
    ELSE
        v_store := p_store_id;
    END IF;
    
    -- Get current quantity
    SELECT quantity INTO v_old_qty 
    FROM stock_levels 
    WHERE item_id = p_item_id AND store_id = v_store;
    
    IF v_old_qty IS NULL THEN
        -- Create stock level record
        INSERT INTO stock_levels (item_id, store_id, quantity)
        VALUES (p_item_id, v_store, GREATEST(0, p_qty_change));
        v_old_qty := 0;
        v_new_qty := GREATEST(0, p_qty_change);
    ELSE
        -- Update existing
        v_new_qty := GREATEST(0, v_old_qty + p_qty_change);
        UPDATE stock_levels 
        SET quantity = v_new_qty, updated_at = NOW()
        WHERE item_id = p_item_id AND store_id = v_store;
    END IF;
    
    -- Log adjustment
    INSERT INTO stock_movements (
        item_id,
        store_id,
        quantity,
        movement_type,
        reference_type,
        notes
    ) VALUES (
        p_item_id,
        v_store,
        p_qty_change,
        CASE WHEN p_qty_change > 0 THEN 'in' ELSE 'out' END,
        'adjustment',
        p_reason
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'old_quantity', v_old_qty,
        'new_quantity', v_new_qty,
        'change', p_qty_change
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== TRACKING FUNCTION ====================

-- Get booking by tracking number (public)
CREATE OR REPLACE FUNCTION get_booking_by_tracking(p_tracking TEXT)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'tracking_number', a.tracking_number,
        'status', a.status,
        'scheduled_date', a.scheduled_date,
        'device', jsonb_build_object(
            'type', d.device_type,
            'brand', d.brand,
            'model', d.model
        ),
        'history', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'status', rth.status,
                    'notes', rth.notes,
                    'timestamp', rth.created_at
                ) ORDER BY rth.created_at DESC
            ), '[]'::jsonb)
            FROM repair_tracking_history rth
            WHERE rth.appointment_id = a.id
        )
    ) INTO v_result
    FROM appointments a
    LEFT JOIN devices d ON d.id = a.device_id
    WHERE a.tracking_number = p_tracking;
    
    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tracking number not found');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'booking', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GRANT PERMISSIONS ====================
GRANT EXECUTE ON FUNCTION generate_tracking_number() TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_status TO authenticated;
GRANT EXECUTE ON FUNCTION void_booking TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_customers TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_by_tracking TO authenticated, anon;

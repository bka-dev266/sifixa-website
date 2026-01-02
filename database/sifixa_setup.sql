-- ====================================================
-- SIFIXA DATABASE SCHEMA
-- Part 1: Tables, Indexes, Triggers, RLS & Policies
-- Run this FIRST, then run SEED file
-- ====================================================

-- ============================================================
-- EXTENSIONS & HELPER FUNCTIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- PART 1: IDENTITY & ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_staff BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id SMALLINT REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================
-- PART 2: STORES & REGISTERS
-- ============================================================

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate NUMERIC(6,4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_settings (
    store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
    default_tax_rate_id UUID REFERENCES tax_rates(id),
    timezone TEXT DEFAULT 'America/New_York',
    currency_code TEXT DEFAULT 'USD',
    receipt_header TEXT,
    receipt_footer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_tax_map (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    tax_rate_id UUID REFERENCES tax_rates(id) ON DELETE CASCADE,
    PRIMARY KEY (store_id, tax_rate_id)
);

CREATE TABLE IF NOT EXISTS registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS register_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_id UUID NOT NULL REFERENCES registers(id),
    opened_by UUID NOT NULL REFERENCES profiles(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_by UUID REFERENCES profiles(id),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(10,2) DEFAULT 0,
    closing_cash NUMERIC(10,2),
    expected_cash NUMERIC(10,2),
    cash_difference NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_drawer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_shift_id UUID NOT NULL REFERENCES register_shifts(id),
    event_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    note TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_event_type CHECK (event_type IN ('drop', 'payout', 'add_cash', 'correction'))
);

-- ============================================================
-- PART 3: CUSTOMERS & DEVICES
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address1 TEXT,
    address2 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_tag_map (
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, tag_id)
);

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    serial_number TEXT,
    imei TEXT,
    passcode_provided BOOLEAN DEFAULT false,
    condition_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_device_type CHECK (device_type IN ('phone', 'tablet', 'laptop', 'desktop', 'watch', 'console', 'other'))
);

-- ============================================================
-- PART 4: CATALOG (Items)
-- ============================================================

CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES item_categories(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type TEXT NOT NULL,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES item_categories(id),
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    track_inventory BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_item_type CHECK (item_type IN ('service', 'product', 'part', 'fee'))
);

CREATE TABLE IF NOT EXISTS item_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_price_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TABLE IF NOT EXISTS item_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    cost NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_price_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    customer_tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE,
    override_price NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS item_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL
);

-- ============================================================
-- PART 5: INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address1 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    location_type TEXT DEFAULT 'shelf',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_location_type CHECK (location_type IN ('shelf', 'back_room', 'display', 'repair_bench', 'transit'))
);

CREATE TABLE IF NOT EXISTS stock_levels (
    location_id UUID REFERENCES stock_locations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    qty_on_hand INT DEFAULT 0,
    qty_reserved INT DEFAULT 0,
    reorder_point INT,
    reorder_qty INT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (location_id, item_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id),
    from_location_id UUID REFERENCES stock_locations(id),
    to_location_id UUID REFERENCES stock_locations(id),
    qty INT NOT NULL,
    movement_type TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_movement_type CHECK (movement_type IN ('receive', 'sell', 'transfer', 'adjust', 'return', 'use_in_repair'))
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    status TEXT DEFAULT 'draft',
    ordered_at TIMESTAMPTZ,
    expected_at DATE,
    received_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_po_status CHECK (status IN ('draft', 'sent', 'partial', 'received', 'canceled'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty_ordered INT NOT NULL,
    qty_received INT DEFAULT 0,
    unit_cost NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID REFERENCES purchase_orders(id),
    location_id UUID NOT NULL REFERENCES stock_locations(id),
    received_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty_received INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_location_id UUID NOT NULL REFERENCES stock_locations(id),
    to_location_id UUID NOT NULL REFERENCES stock_locations(id),
    status TEXT DEFAULT 'pending',
    initiated_by UUID NOT NULL REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_transfer_status CHECK (status IN ('pending', 'in_transit', 'completed', 'canceled'))
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty INT NOT NULL CHECK (qty > 0)
);

-- ============================================================
-- PART 6: DISCOUNTS & COUPONS
-- ============================================================

CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percent', 'fixed'))
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_id UUID REFERENCES discounts(id),
    max_uses INT,
    times_used INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    requires_note BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS void_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    requires_note BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- PART 7: TIME SLOTS & APPOINTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    device_id UUID REFERENCES devices(id),
    time_slot_id UUID REFERENCES time_slots(id),
    store_id UUID REFERENCES stores(id),
    tracking_number TEXT UNIQUE,
    scheduled_date DATE NOT NULL,
    scheduled_start TIME,
    scheduled_end TIME,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_appointment_status CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'no_show', 'canceled'))
);

-- ============================================================
-- PART 8: REPAIR TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS repair_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    device_id UUID REFERENCES devices(id),
    appointment_id UUID REFERENCES appointments(id),
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'regular',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    deleted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_ticket_status CHECK (status IN (
        'new', 'diagnosing', 'awaiting_approval', 'in_progress', 
        'on_hold', 'ready', 'picked_up', 'canceled'
    ))
);

CREATE TABLE IF NOT EXISTS ticket_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    tech_id UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    message TEXT,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'before',
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_photo_type CHECK (photo_type IN ('before', 'during', 'after'))
);

CREATE TABLE IF NOT EXISTS ticket_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    tech_id UUID NOT NULL REFERENCES profiles(id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 9: WARRANTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    device_id UUID REFERENCES devices(id),
    warranty_type TEXT DEFAULT 'standard',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_warranty_type CHECK (warranty_type IN ('standard', 'extended', 'lifetime')),
    CONSTRAINT valid_warranty_status CHECK (status IN ('active', 'claimed', 'expired', 'voided'))
);

-- ============================================================
-- PART 10: INVOICING
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    ticket_id UUID REFERENCES repair_tickets(id),
    status TEXT DEFAULT 'draft',
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    issued_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'issued', 'paid', 'partial', 'overdue', 'void'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    ticket_line_item_id UUID REFERENCES ticket_line_items(id),
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    tax_rate NUMERIC(6,4) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 11: POS SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id),
    register_id UUID REFERENCES registers(id),
    shift_id UUID REFERENCES register_shifts(id),
    customer_id UUID REFERENCES customers(id),
    status TEXT DEFAULT 'open',
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES profiles(id),
    void_reason_id UUID REFERENCES void_reasons(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_order_status CHECK (status IN ('open', 'completed', 'voided', 'refunded'))
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    qty INT DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    tax_rate NUMERIC(6,4) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    refunded_qty INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES discounts(id),
    coupon_id UUID REFERENCES coupons(id),
    discount_type TEXT NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL,
    amount_applied NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 12: PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID REFERENCES sales_orders(id),
    invoice_id UUID REFERENCES invoices(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'completed',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'check', 'other')),
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID REFERENCES sales_orders(id),
    invoice_id UUID REFERENCES invoices(id),
    payment_id UUID REFERENCES payments(id),
    amount NUMERIC(10,2) NOT NULL,
    reason_id UUID REFERENCES return_reasons(id),
    notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES sales_order_items(id),
    qty INT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    restock BOOLEAN DEFAULT false
);

-- ============================================================
-- PART 13: MESSAGING
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    subject TEXT,
    status TEXT DEFAULT 'open',
    assigned_to UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_conversation_status CHECK (status IN ('open', 'pending', 'resolved', 'closed'))
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    sender_id UUID,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_sender_type CHECK (sender_type IN ('customer', 'staff', 'system'))
);

CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_channel CHECK (channel IN ('email', 'sms', 'push', 'in_app'))
);

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    template_type TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    channels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 14: REPORTING & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_metrics (
    date DATE PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    pos_sales_total NUMERIC(10,2) DEFAULT 0,
    repair_revenue_total NUMERIC(10,2) DEFAULT 0,
    tax_collected NUMERIC(10,2) DEFAULT 0,
    discount_total NUMERIC(10,2) DEFAULT 0,
    refund_total NUMERIC(10,2) DEFAULT 0,
    tickets_opened INT DEFAULT 0,
    tickets_closed INT DEFAULT 0,
    appointments_scheduled INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_key TEXT UNIQUE NOT NULL,
    content_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 15: LANDING PAGE CMS TABLES
-- ============================================================

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

CREATE TABLE IF NOT EXISTS landing_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    content JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    before_image TEXT,
    after_image TEXT,
    description TEXT,
    device_type TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 16: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_item_prices_lookup ON item_prices(item_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON repair_tickets(status, opened_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at);

-- ============================================================
-- PART 17: TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repair_tickets_updated_at ON repair_tickets;
CREATE TRIGGER update_repair_tickets_updated_at BEFORE UPDATE ON repair_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 18: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE register_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 19: RLS POLICIES
-- ============================================================

-- Helper function
CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.is_staff = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Public read policies
DROP POLICY IF EXISTS "Public read landing_hero" ON landing_hero;
CREATE POLICY "Public read landing_hero" ON landing_hero FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read landing_services" ON landing_services;
CREATE POLICY "Public read landing_services" ON landing_services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read landing_testimonials" ON landing_testimonials;
CREATE POLICY "Public read landing_testimonials" ON landing_testimonials FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read landing_faq" ON landing_faq;
CREATE POLICY "Public read landing_faq" ON landing_faq FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read landing_sections" ON landing_sections;
CREATE POLICY "Public read landing_sections" ON landing_sections FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read landing_settings" ON landing_settings;
CREATE POLICY "Public read landing_settings" ON landing_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read landing_pricing" ON landing_pricing;
CREATE POLICY "Public read landing_pricing" ON landing_pricing FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read landing_pricing_items" ON landing_pricing_items;
CREATE POLICY "Public read landing_pricing_items" ON landing_pricing_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read legal_pages" ON legal_pages;
CREATE POLICY "Public read legal_pages" ON legal_pages FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read items" ON items;
CREATE POLICY "Public read items" ON items FOR SELECT USING (is_active = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public read item_prices" ON item_prices;
CREATE POLICY "Public read item_prices" ON item_prices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read item_categories" ON item_categories;
CREATE POLICY "Public read item_categories" ON item_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read roles" ON roles;
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read stores" ON stores;
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (is_active = true);

-- Admin write policies
DROP POLICY IF EXISTS "Admin write landing_hero" ON landing_hero;
CREATE POLICY "Admin write landing_hero" ON landing_hero FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_services" ON landing_services;
CREATE POLICY "Admin write landing_services" ON landing_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_testimonials" ON landing_testimonials;
CREATE POLICY "Admin write landing_testimonials" ON landing_testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_faq" ON landing_faq;
CREATE POLICY "Admin write landing_faq" ON landing_faq FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_sections" ON landing_sections;
CREATE POLICY "Admin write landing_sections" ON landing_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_settings" ON landing_settings;
CREATE POLICY "Admin write landing_settings" ON landing_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_pricing" ON landing_pricing;
CREATE POLICY "Admin write landing_pricing" ON landing_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write landing_pricing_items" ON landing_pricing_items;
CREATE POLICY "Admin write landing_pricing_items" ON landing_pricing_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Customer policies
DROP POLICY IF EXISTS "Public insert customers" ON customers;
CREATE POLICY "Public insert customers" ON customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers view own data" ON customers;
CREATE POLICY "Customers view own data" ON customers FOR SELECT USING (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Staff full access customers" ON customers;
CREATE POLICY "Staff full access customers" ON customers FOR ALL USING (is_staff());

-- Device policies
DROP POLICY IF EXISTS "Public insert devices" ON devices;
CREATE POLICY "Public insert devices" ON devices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "View own devices" ON devices;
CREATE POLICY "View own devices" ON devices FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR is_staff()
);

-- Appointment policies
DROP POLICY IF EXISTS "Public insert appointments" ON appointments;
CREATE POLICY "Public insert appointments" ON appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "View own appointments" ON appointments;
CREATE POLICY "View own appointments" ON appointments FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR is_staff()
);

DROP POLICY IF EXISTS "Staff manage appointments" ON appointments;
CREATE POLICY "Staff manage appointments" ON appointments FOR ALL USING (is_staff());

-- Staff full access policies
DROP POLICY IF EXISTS "Staff full access profiles" ON profiles;
CREATE POLICY "Staff full access profiles" ON profiles FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access user_roles" ON user_roles;
CREATE POLICY "Staff full access user_roles" ON user_roles FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access stores" ON stores;
CREATE POLICY "Staff full access stores" ON stores FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access store_settings" ON store_settings;
CREATE POLICY "Staff full access store_settings" ON store_settings FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access registers" ON registers;
CREATE POLICY "Staff full access registers" ON registers FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access register_shifts" ON register_shifts;
CREATE POLICY "Staff full access register_shifts" ON register_shifts FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access items" ON items;
CREATE POLICY "Staff full access items" ON items FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access item_prices" ON item_prices;
CREATE POLICY "Staff full access item_prices" ON item_prices FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access item_categories" ON item_categories;
CREATE POLICY "Staff full access item_categories" ON item_categories FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access devices" ON devices;
CREATE POLICY "Staff full access devices" ON devices FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access repair_tickets" ON repair_tickets;
CREATE POLICY "Staff full access repair_tickets" ON repair_tickets FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access invoices" ON invoices;
CREATE POLICY "Staff full access invoices" ON invoices FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access sales_orders" ON sales_orders;
CREATE POLICY "Staff full access sales_orders" ON sales_orders FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Staff full access payments" ON payments;
CREATE POLICY "Staff full access payments" ON payments FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "Public read landing_gallery" ON landing_gallery;
CREATE POLICY "Public read landing_gallery" ON landing_gallery FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin write landing_gallery" ON landing_gallery;
CREATE POLICY "Admin write landing_gallery" ON landing_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================================
-- DONE!
-- ============================================================
SELECT '✅ SIFIXA Schema Created Successfully! Now run SEED file.' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;
-- ====================================================
-- SIFIXA Advanced Database Schema
-- Professional POS + Repair Shop System
-- Supabase Auth Integration (profiles → auth.users)
-- ====================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== HELPER FUNCTIONS ====================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================
-- SECTION 1: IDENTITY & ROLES
-- ====================================================

-- Roles with is_staff flag for RLS
CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_staff BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles linked to Supabase Auth
CREATE TABLE profiles (
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

-- User-role assignments (many-to-many)
CREATE TABLE user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id SMALLINT REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ====================================================
-- SECTION 2: STORES & REGISTERS
-- ====================================================

CREATE TABLE stores (
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

CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    rate NUMERIC(6,4) NOT NULL, -- e.g., 0.0530 for 5.3%
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_settings (
    store_id UUID PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
    default_tax_rate_id UUID REFERENCES tax_rates(id),
    timezone TEXT DEFAULT 'America/New_York',
    currency_code TEXT DEFAULT 'USD',
    receipt_header TEXT,
    receipt_footer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_tax_map (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    tax_rate_id UUID REFERENCES tax_rates(id) ON DELETE CASCADE,
    PRIMARY KEY (store_id, tax_rate_id)
);

CREATE TABLE registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE register_shifts (
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

CREATE TABLE cash_drawer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_shift_id UUID NOT NULL REFERENCES register_shifts(id),
    event_type TEXT NOT NULL, -- drop, payout, add_cash, correction
    amount NUMERIC(10,2) NOT NULL,
    note TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_event_type CHECK (event_type IN ('drop', 'payout', 'add_cash', 'correction'))
);

-- ====================================================
-- SECTION 3: CUSTOMERS & DEVICES
-- ====================================================

CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id), -- nullable: customer may or may not have login
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

CREATE TABLE customer_tag_map (
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, tag_id)
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL, -- phone, tablet, laptop, desktop, other
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

-- ====================================================
-- SECTION 4: UNIFIED CATALOG (Items)
-- ====================================================

CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES item_categories(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type TEXT NOT NULL, -- service, product, part, fee
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES item_categories(id),
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    track_inventory BOOLEAN DEFAULT false, -- true for products/parts
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_item_type CHECK (item_type IN ('service', 'product', 'part', 'fee'))
);

CREATE TABLE item_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_price_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX idx_item_prices_lookup ON item_prices(item_id, effective_from DESC);

CREATE TABLE item_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    cost NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_cost_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX idx_item_costs_lookup ON item_costs(item_id, effective_from DESC);

CREATE TABLE item_price_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL, -- store, customer
    scope_id UUID NOT NULL, -- store_id or customer_id
    price NUMERIC(10,2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_scope_type CHECK (scope_type IN ('store', 'customer'))
);

CREATE TABLE item_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    barcode TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 5: INVENTORY
-- ====================================================

CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL, -- Front Desk, Back Room, Shelf A3
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_levels (
    location_id UUID REFERENCES stock_locations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    qty_on_hand INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (location_id, item_id)
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status TEXT DEFAULT 'draft', -- draft, sent, partially_received, received, canceled
    ordered_at TIMESTAMPTZ,
    expected_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_po_status CHECK (status IN ('draft', 'sent', 'partially_received', 'received', 'canceled'))
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty_ordered INT NOT NULL CHECK (qty_ordered > 0),
    unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    qty_received INT DEFAULT 0
);

CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    received_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT
);

CREATE TABLE goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty_received INT NOT NULL CHECK (qty_received > 0),
    unit_cost NUMERIC(10,2) NOT NULL
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES stock_locations(id),
    item_id UUID NOT NULL REFERENCES items(id),
    movement_type TEXT NOT NULL,
    -- purchase_received, sale, repair_use, transfer_in, transfer_out, adjustment, return, refund
    qty_change INT NOT NULL CHECK (qty_change != 0),
    unit_cost NUMERIC(10,2), -- cost at movement time for valuation
    ref_type TEXT, -- sale, ticket, po, refund, transfer, manual
    ref_id UUID,
    created_by UUID REFERENCES profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_movement_type CHECK (movement_type IN (
        'purchase_received', 'sale', 'repair_use', 'transfer_in', 
        'transfer_out', 'adjustment', 'return', 'refund'
    ))
);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, created_at);
CREATE INDEX idx_stock_movements_ref ON stock_movements(ref_type, ref_id);

CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_location_id UUID NOT NULL REFERENCES stock_locations(id),
    to_location_id UUID NOT NULL REFERENCES stock_locations(id),
    status TEXT DEFAULT 'pending', -- pending, in_transit, completed, canceled
    created_by UUID NOT NULL REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_transfer_status CHECK (status IN ('pending', 'in_transit', 'completed', 'canceled'))
);

CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty INT NOT NULL CHECK (qty > 0)
);

-- ====================================================
-- SECTION 6: DISCOUNTS & COUPONS
-- ====================================================

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- percent, fixed
    value NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percent', 'fixed'))
);

CREATE TABLE coupons (
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

CREATE TABLE return_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    requires_note BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE void_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    requires_note BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- ====================================================
-- SECTION 7: TIME SLOTS & APPOINTMENTS
-- ====================================================

CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    device_id UUID REFERENCES devices(id),
    time_slot_id UUID REFERENCES time_slots(id),
    scheduled_date DATE NOT NULL,
    scheduled_start TIME,
    scheduled_end TIME,
    status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, arrived, no_show, canceled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_appointment_status CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'no_show', 'canceled'))
);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_date, status);

-- ====================================================
-- SECTION 8: REPAIR TICKETS
-- ====================================================

CREATE TABLE repair_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    device_id UUID REFERENCES devices(id),
    appointment_id UUID REFERENCES appointments(id),
    status TEXT DEFAULT 'new',
    -- new, diagnosing, awaiting_approval, in_progress, on_hold, ready, picked_up, canceled
    priority TEXT DEFAULT 'regular', -- regular, premium, pro
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
CREATE INDEX idx_tickets_status ON repair_tickets(status, opened_at);

CREATE TABLE ticket_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    tech_id UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ
);

CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    message TEXT,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true, -- internal vs customer-visible
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    service_item_id UUID NOT NULL REFERENCES items(id),
    qty INT DEFAULT 1 CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_parts_used (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    part_item_id UUID NOT NULL REFERENCES items(id),
    qty INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL, -- what you charge
    cost_at_use NUMERIC(10,2), -- your cost (for COGS)
    used_at TIMESTAMPTZ DEFAULT NOW(),
    used_by UUID REFERENCES profiles(id)
);
CREATE INDEX idx_ticket_parts_item ON ticket_parts_used(part_item_id);

CREATE TABLE ticket_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES repair_tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT, -- image, document, video
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 9: WARRANTIES
-- ====================================================

CREATE TABLE warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES repair_tickets(id),
    expires_at DATE NOT NULL,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_warranty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_ticket_id UUID NOT NULL REFERENCES repair_tickets(id),
    claim_ticket_id UUID NOT NULL REFERENCES repair_tickets(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 10: INVOICING
-- ====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    ticket_id UUID UNIQUE REFERENCES repair_tickets(id), -- max 1 invoice per ticket
    status TEXT DEFAULT 'draft',
    -- draft, sent, unpaid, partially_paid, paid, void, refunded
    issued_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_total NUMERIC(10,2) DEFAULT 0,
    discount_total NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_invoice_status CHECK (status IN (
        'draft', 'sent', 'unpaid', 'partially_paid', 'paid', 'void', 'refunded'
    ))
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    qty INT DEFAULT 1 CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL
);

-- ====================================================
-- SECTION 11: POS SALES
-- ====================================================

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    register_id UUID NOT NULL REFERENCES registers(id),
    customer_id UUID REFERENCES customers(id),
    ticket_id UUID REFERENCES repair_tickets(id), -- links repair checkout
    status TEXT DEFAULT 'open', -- open, completed, voided, refunded, partially_refunded
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    cashier_id UUID NOT NULL REFERENCES profiles(id),
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_total NUMERIC(10,2) DEFAULT 0,
    discount_total NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_order_status CHECK (status IN (
        'open', 'completed', 'voided', 'refunded', 'partially_refunded'
    ))
);
CREATE INDEX idx_sales_orders_closed ON sales_orders(closed_at, status);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    qty INT NOT NULL CHECK (qty > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10,2) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    cost_at_sale NUMERIC(10,2), -- for COGS calculation
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sales_order_items_item ON sales_order_items(item_id);

CREATE TABLE sales_order_item_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE CASCADE,
    tax_rate_id UUID NOT NULL REFERENCES tax_rates(id),
    tax_amount NUMERIC(10,2) NOT NULL
);

CREATE TABLE sales_order_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES discounts(id),
    coupon_id UUID REFERENCES coupons(id),
    applied_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 12: PAYMENTS & REFUNDS
-- ====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_type TEXT NOT NULL, -- sales_order, invoice
    ref_id UUID NOT NULL,
    register_shift_id UUID REFERENCES register_shifts(id),
    payment_type TEXT NOT NULL, -- cash, card, apple_pay, google_pay, zelle, check, other
    amount NUMERIC(10,2) NOT NULL, -- positive = payment, negative = refund
    provider TEXT, -- stripe, square, manual
    provider_txn_id TEXT,
    status TEXT DEFAULT 'succeeded', -- pending, succeeded, failed
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_payment_type CHECK (payment_type IN (
        'cash', 'card', 'apple_pay', 'google_pay', 'zelle', 'check', 'store_credit', 'other'
    )),
    CONSTRAINT valid_ref_type CHECK (ref_type IN ('sales_order', 'invoice'))
);
CREATE INDEX idx_payments_paid ON payments(paid_at, payment_type);
CREATE INDEX idx_payments_ref ON payments(ref_type, ref_id);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
    reason_id UUID REFERENCES return_reasons(id),
    reason_text TEXT,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax_refunded NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refund_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id),
    qty_returned INT NOT NULL CHECK (qty_returned > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    discount_refunded NUMERIC(10,2) DEFAULT 0,
    tax_refunded NUMERIC(10,2) DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    restock BOOLEAN DEFAULT true -- whether to add back to inventory
);

-- ====================================================
-- SECTION 13: MESSAGING
-- ====================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    ticket_id UUID REFERENCES repair_tickets(id),
    subject TEXT,
    status TEXT DEFAULT 'open', -- open, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- customer, staff
    sender_id UUID, -- profiles.id for staff, customers.id for customer
    channel TEXT DEFAULT 'in_app', -- sms, email, in_app
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- queued, sent, delivered, read, failed
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_sender_type CHECK (sender_type IN ('customer', 'staff'))
);

CREATE TABLE notification_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    ticket_id UUID REFERENCES repair_tickets(id),
    type TEXT NOT NULL, -- repair, promo, reminder, system
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_type TEXT, -- repair_ready, quote, reminder, etc.
    subject TEXT,
    body TEXT NOT NULL,
    channels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 14: REPORTING & AUDIT
-- ====================================================

CREATE TABLE daily_metrics (
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

CREATE TABLE audit_log (
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
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, created_at);

-- ====================================================
-- SECTION 15: CONFIG
-- ====================================================

CREATE TABLE website_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_key TEXT UNIQUE NOT NULL,
    content_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- SECTION 16: TRIGGERS FOR updated_at
-- ====================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_tickets_updated_at BEFORE UPDATE ON repair_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_website_content_updated_at BEFORE UPDATE ON website_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- SECTION 17: ROW LEVEL SECURITY
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_tax_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE register_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE void_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_item_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- RLS POLICIES
-- ====================================================

-- Helper function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.is_staff = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff policies (full access for all staff roles)
-- Apply to all operational tables

CREATE POLICY "Staff full access" ON profiles FOR ALL USING (is_staff() OR id = auth.uid());
CREATE POLICY "Staff full access" ON roles FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON user_roles FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stores FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON store_settings FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON store_tax_map FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON registers FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON register_shifts FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON cash_drawer_events FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON tax_rates FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON customer_tags FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON customers FOR ALL USING (is_staff() OR user_id = auth.uid());
CREATE POLICY "Staff full access" ON customer_tag_map FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON devices FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON item_categories FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON item_prices FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON item_costs FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON item_price_overrides FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON item_barcodes FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stock_locations FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stock_levels FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stock_movements FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stock_transfers FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON stock_transfer_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON suppliers FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON purchase_orders FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON purchase_order_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON goods_receipts FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON goods_receipt_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON discounts FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON coupons FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON coupon_redemptions FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON return_reasons FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON void_reasons FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON time_slots FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON appointments FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON repair_tickets FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_assignments FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_status_history FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_notes FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_services FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_parts_used FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_files FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON warranties FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON ticket_warranty_claims FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON invoices FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON invoice_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON sales_orders FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON sales_order_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON sales_order_item_taxes FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON sales_order_discounts FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON payments FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON refunds FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON refund_items FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON conversations FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON messages FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON notification_events FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON message_templates FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON daily_metrics FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON audit_log FOR ALL USING (is_staff());
CREATE POLICY "Staff full access" ON website_content FOR ALL USING (is_staff());

-- Customer self-access policies (read own data)
CREATE POLICY "Customers view own devices" ON devices 
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers view own tickets" ON repair_tickets 
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers view own invoices" ON invoices 
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers view own appointments" ON appointments 
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "Customers view own notifications" ON notification_events 
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Public read access for items (for storefront)
CREATE POLICY "Public read active items" ON items 
    FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Public read item prices" ON item_prices 
    FOR SELECT USING (true);

CREATE POLICY "Public read categories" ON item_categories 
    FOR SELECT USING (true);

-- ====================================================
-- SUCCESS MESSAGE
-- ====================================================
SELECT 'Advanced schema created successfully! 55+ tables ready.' as status;

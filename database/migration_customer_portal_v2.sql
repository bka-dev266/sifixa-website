-- ====================================================
-- SIFIXA Customer Portal Database Migration V2
-- Additional tables for customer portal features
-- Run this in Supabase SQL Editor AFTER migration_customer_portal.sql
-- ====================================================

-- ============== CUSTOMER FAVORITES ==============
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_id UUID, -- References repair_services if exists
    service_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, service_name)
);

CREATE INDEX IF NOT EXISTS idx_favorites_customer ON customer_favorites(customer_id);

-- RLS Policies
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can manage own favorites" ON customer_favorites;
CREATE POLICY "Customers can manage own favorites" ON customer_favorites
    FOR ALL USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));


-- ============== CUSTOMER PAYMENT METHODS ==============
CREATE TABLE IF NOT EXISTS customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    card_type VARCHAR(20) NOT NULL, -- visa, mastercard, amex, discover
    last_four VARCHAR(4) NOT NULL,
    expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER NOT NULL,
    cardholder_name VARCHAR(255),
    is_default BOOLEAN DEFAULT false,
    billing_zip VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_customer ON customer_payment_methods(customer_id);

-- RLS Policies
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can manage own payment methods" ON customer_payment_methods;
CREATE POLICY "Customers can manage own payment methods" ON customer_payment_methods
    FOR ALL USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));


-- ============== CUSTOMER CHAT HISTORY ==============
CREATE TABLE IF NOT EXISTS customer_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer, agent, system
    sender_name VARCHAR(255),
    agent_id UUID REFERENCES profiles(id),
    attachment_url TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_customer ON customer_chat_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON customer_chat_history(created_at DESC);

-- RLS Policies
ALTER TABLE customer_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own chat history" ON customer_chat_history;
CREATE POLICY "Customers can view own chat history" ON customer_chat_history
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Customers can send messages" ON customer_chat_history;
CREATE POLICY "Customers can send messages" ON customer_chat_history
    FOR INSERT WITH CHECK (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Staff can update chat" ON customer_chat_history;
CREATE POLICY "Staff can update chat" ON customer_chat_history
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));


-- ============== TRIGGER: Update payment_methods timestamp ==============
CREATE OR REPLACE FUNCTION update_payment_method_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_method_timestamp ON customer_payment_methods;
CREATE TRIGGER trigger_update_payment_method_timestamp
    BEFORE UPDATE ON customer_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_method_timestamp();


-- ============== GRANT PERMISSIONS ==============
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_chat_history TO authenticated;


-- ============== SEED DATA: Sample favorites (optional) ==============
-- INSERT INTO customer_favorites (customer_id, service_name, service_type) VALUES
--     ('your-customer-uuid', 'Screen Replacement', 'repair'),
--     ('your-customer-uuid', 'Battery Replacement', 'repair')
-- ON CONFLICT DO NOTHING;

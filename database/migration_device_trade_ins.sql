-- ====================================================
-- DEVICE TRADE-INS TABLE MIGRATION
-- Creates a dedicated table for sell/trade-in device requests
-- ====================================================

-- Create the device_trade_ins table
CREATE TABLE IF NOT EXISTS device_trade_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Device Information
    device_type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    storage TEXT,
    battery_health INT CHECK (battery_health >= 0 AND battery_health <= 100),
    
    -- Condition
    condition TEXT NOT NULL,
    condition_notes TEXT,
    
    -- Pricing
    estimated_price NUMERIC(10,2),
    final_offer NUMERIC(10,2),
    
    -- Contact Info (stored for reference even if customer exists)
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    
    -- Constraints
    CONSTRAINT valid_trade_in_device_type CHECK (device_type IN ('phone', 'tablet', 'laptop', 'watch', 'other')),
    CONSTRAINT valid_trade_in_condition CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    CONSTRAINT valid_trade_in_status CHECK (status IN ('pending', 'reviewing', 'offer_sent', 'accepted', 'rejected', 'completed', 'canceled'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_trade_ins_customer ON device_trade_ins(customer_id);
CREATE INDEX IF NOT EXISTS idx_device_trade_ins_status ON device_trade_ins(status);
CREATE INDEX IF NOT EXISTS idx_device_trade_ins_created ON device_trade_ins(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_device_trade_ins_updated_at ON device_trade_ins;
CREATE TRIGGER update_device_trade_ins_updated_at
    BEFORE UPDATE ON device_trade_ins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE device_trade_ins ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert trade-in requests
DROP POLICY IF EXISTS "Anyone can create trade-in requests" ON device_trade_ins;
CREATE POLICY "Anyone can create trade-in requests"
    ON device_trade_ins FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Policy: Staff can view all trade-ins
DROP POLICY IF EXISTS "Staff can view all trade-ins" ON device_trade_ins;
CREATE POLICY "Staff can view all trade-ins"
    ON device_trade_ins FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.is_staff = true
        )
    );

-- Policy: Customers can view their own trade-ins
DROP POLICY IF EXISTS "Customers can view own trade-ins" ON device_trade_ins;
CREATE POLICY "Customers can view own trade-ins"
    ON device_trade_ins FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );

-- Policy: Staff can update trade-ins
DROP POLICY IF EXISTS "Staff can update trade-ins" ON device_trade_ins;
CREATE POLICY "Staff can update trade-ins"
    ON device_trade_ins FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.is_staff = true
        )
    );

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE device_trade_ins IS 'Stores device trade-in/sell requests from customers';
COMMENT ON COLUMN device_trade_ins.battery_health IS 'Battery health percentage (0-100), optional';
COMMENT ON COLUMN device_trade_ins.estimated_price IS 'Auto-calculated estimate shown to customer';
COMMENT ON COLUMN device_trade_ins.final_offer IS 'Final offer amount after staff review';

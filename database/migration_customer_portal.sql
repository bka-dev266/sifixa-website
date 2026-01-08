-- ====================================================
-- SIFIXA Customer Portal Database Migration
-- Creates tables for customer portal features
-- Run this in Supabase SQL Editor
-- ====================================================

-- ============== CUSTOMER NOTIFICATIONS ==============
CREATE TABLE IF NOT EXISTS customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, alert
    read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON customer_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON customer_notifications(customer_id, read);

-- RLS Policies
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own notifications" ON customer_notifications
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "System can create notifications" ON customer_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update own notifications" ON customer_notifications
    FOR UPDATE USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER LOYALTY ==============
CREATE TABLE IF NOT EXISTS customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
    lifetime_points INTEGER DEFAULT 0,
    points_expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- discount, free_service, gift
    reward_value DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemption history
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ
);

-- RLS Policies for loyalty
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own loyalty" ON customer_loyalty
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "Anyone can view rewards catalog" ON loyalty_rewards
    FOR SELECT USING (active = true);

CREATE POLICY "Customers can view own redemptions" ON loyalty_redemptions
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER WARRANTIES ==============
CREATE TABLE IF NOT EXISTS customer_warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES appointments(id),
    device_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    warranty_start DATE NOT NULL,
    warranty_expiry DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, claimed, expired
    claim_date DATE,
    claim_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE customer_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own warranties" ON customer_warranties
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "Customers can claim warranties" ON customer_warranties
    FOR UPDATE USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER INVOICES ==============
CREATE TABLE IF NOT EXISTS customer_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES appointments(id),
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, overdue, refunded
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50),
    items JSONB, -- Array of line items
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON customer_invoices(customer_id);

-- RLS Policies
ALTER TABLE customer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own invoices" ON customer_invoices
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER REVIEWS ==============
CREATE TABLE IF NOT EXISTS customer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES appointments(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    would_recommend BOOLEAN DEFAULT true,
    staff_response TEXT,
    staff_response_date TIMESTAMPTZ,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_customer ON customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON customer_reviews(rating);

-- RLS Policies
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews" ON customer_reviews
    FOR SELECT USING (visible = true OR customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "Customers can create reviews" ON customer_reviews
    FOR INSERT WITH CHECK (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER SETTINGS ==============
CREATE TABLE IF NOT EXISTS customer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own settings" ON customer_settings
    FOR SELECT USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "Customers can update own settings" ON customer_settings
    FOR UPDATE USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own settings" ON customer_settings
    FOR INSERT WITH CHECK (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== CUSTOMER REFERRALS ==============
CREATE TABLE IF NOT EXISTS customer_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_email VARCHAR(255),
    referred_name VARCHAR(255),
    referred_customer_id UUID REFERENCES customers(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, registered, completed
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON customer_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON customer_referrals(referral_code);

-- RLS Policies
ALTER TABLE customer_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own referrals" ON customer_referrals
    FOR SELECT USING (referrer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "Customers can create referrals" ON customer_referrals
    FOR INSERT WITH CHECK (referrer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- ============== SEED DATA: LOYALTY REWARDS ==============
INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active) VALUES
    ('$10 Off Next Repair', 'Get $10 off your next repair service', 500, 'discount', 10.00, true),
    ('$25 Off Next Repair', 'Get $25 off your next repair service', 1000, 'discount', 25.00, true),
    ('Free Screen Protector', 'Receive a free premium screen protector', 300, 'gift', 0, true),
    ('Free Battery Diagnostic', 'Get a complimentary battery health check', 200, 'free_service', 0, true),
    ('Priority Service Pass', 'Skip the queue on your next visit', 750, 'gift', 0, true),
    ('$50 Off Major Repair', 'Save $50 on repairs over $150', 2000, 'discount', 50.00, true)
ON CONFLICT DO NOTHING;

-- ============== HELPER FUNCTION: Generate Referral Code ==============
CREATE OR REPLACE FUNCTION generate_referral_code(customer_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a code like "SFX-ABC123"
        new_code := 'SFX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM customer_referrals WHERE referral_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============== TRIGGER: Auto-create loyalty record ==============
CREATE OR REPLACE FUNCTION create_customer_loyalty()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO customer_loyalty (customer_id, points, tier, lifetime_points)
    VALUES (NEW.id, 0, 'Bronze', 0)
    ON CONFLICT (customer_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_customer_loyalty
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_loyalty();

-- ============== TRIGGER: Auto-create settings record ==============
CREATE OR REPLACE FUNCTION create_customer_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO customer_settings (customer_id)
    VALUES (NEW.id)
    ON CONFLICT (customer_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_customer_settings
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_settings();

-- ============== GRANT PERMISSIONS ==============
GRANT SELECT, INSERT, UPDATE ON customer_notifications TO authenticated;
GRANT SELECT ON customer_loyalty TO authenticated;
GRANT SELECT ON loyalty_rewards TO authenticated;
GRANT SELECT, INSERT ON loyalty_redemptions TO authenticated;
GRANT SELECT, UPDATE ON customer_warranties TO authenticated;
GRANT SELECT ON customer_invoices TO authenticated;
GRANT SELECT, INSERT ON customer_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_settings TO authenticated;
GRANT SELECT, INSERT ON customer_referrals TO authenticated;

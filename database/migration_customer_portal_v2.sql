-- ============================================
-- SIFIXA Customer Portal V2 Tables
-- Run this in Supabase SQL Editor to create missing tables
-- ============================================

-- Customer Loyalty Table
CREATE TABLE IF NOT EXISTS customer_loyalty (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- Customer Settings Table
CREATE TABLE IF NOT EXISTS customer_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    two_factor_enabled BOOLEAN DEFAULT false,
    reminders JSONB DEFAULT '{"appointmentReminder": true, "repairUpdates": true, "pickupReminder": true}'::jsonb,
    privacy JSONB DEFAULT '{"shareDataForAnalytics": false, "allowMarketingCalls": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- Customer Referrals Table
CREATE TABLE IF NOT EXISTS customer_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(20) NOT NULL,
    referred_email VARCHAR(255),
    referred_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed', 'expired')),
    reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_loyalty
DROP POLICY IF EXISTS "Users can view own loyalty" ON customer_loyalty;
CREATE POLICY "Users can view own loyalty" ON customer_loyalty
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own loyalty" ON customer_loyalty;
CREATE POLICY "Users can update own loyalty" ON customer_loyalty
    FOR UPDATE USING (auth.uid() = customer_id);

-- RLS Policies for customer_settings
DROP POLICY IF EXISTS "Users can view own settings" ON customer_settings;
CREATE POLICY "Users can view own settings" ON customer_settings
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own settings" ON customer_settings;
CREATE POLICY "Users can update own settings" ON customer_settings
    FOR UPDATE USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON customer_settings;
CREATE POLICY "Users can insert own settings" ON customer_settings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RLS Policies for customer_referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON customer_referrals;
CREATE POLICY "Users can view own referrals" ON customer_referrals
    FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users can create referrals" ON customer_referrals;
CREATE POLICY "Users can create referrals" ON customer_referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer ON customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_settings_customer ON customer_settings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_referrals_referrer ON customer_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_customer_referrals_code ON customer_referrals(referral_code);

-- Success message
SELECT 'Customer Portal V2 tables created successfully!' as message;

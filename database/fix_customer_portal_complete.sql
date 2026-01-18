-- ============================================
-- SIFIXA CUSTOMER PORTAL COMPLETE FIX
-- Run this in Supabase SQL Editor to resolve 404/406 errors
-- ============================================

-- 1. FIX: Missing Customer Bookings View (404 Error)
-- The frontend expects 'customer_bookings_view' with an 'id' column.
-- We recreate it based on 'booking_details_view'.

DROP VIEW IF EXISTS customer_bookings_view;
CREATE OR REPLACE VIEW customer_bookings_view AS
SELECT 
    booking_id as id, -- Alias booking_id to id for frontend compatibility
    *
FROM booking_details_view;

-- Grant access
GRANT SELECT ON customer_bookings_view TO authenticated;


-- 2. FIX: Data Availability for Loyalty & Settings (406 Error)
-- Ensure tables exist first (idempotent)
CREATE TABLE IF NOT EXISTS customer_loyalty (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'Bronze',
    lifetime_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

CREATE TABLE IF NOT EXISTS customer_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- Fix RLS Policies (ensure they allow SELECT/INSERT/UPDATE for own user)
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;

-- FIX: Ensure Foreign Keys reference auth.users NOT public.customers
-- (Some environments might have created these referencing customers(id) erroneously)
DO $$
BEGIN
    -- CLEANUP: Remove orphaned records that don't match any auth.users
    -- This fixes the violation error when adding the FK
    DELETE FROM customer_loyalty WHERE customer_id NOT IN (SELECT id FROM auth.users);
    DELETE FROM customer_settings WHERE customer_id NOT IN (SELECT id FROM auth.users);

    -- Fix customer_loyalty FK
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_loyalty_customer_id_fkey' 
        AND table_name = 'customer_loyalty'
    ) THEN
        ALTER TABLE customer_loyalty DROP CONSTRAINT customer_loyalty_customer_id_fkey;
    END IF;
    
    ALTER TABLE customer_loyalty 
        ADD CONSTRAINT customer_loyalty_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix customer_settings FK
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_settings_customer_id_fkey' 
        AND table_name = 'customer_settings'
    ) THEN
        ALTER TABLE customer_settings DROP CONSTRAINT customer_settings_customer_id_fkey;
    END IF;

    ALTER TABLE customer_settings 
        ADD CONSTRAINT customer_settings_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

END $$;

DROP POLICY IF EXISTS "Users can view own loyalty" ON customer_loyalty;
CREATE POLICY "Users can view own loyalty" ON customer_loyalty FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can view own settings" ON customer_settings;
CREATE POLICY "Users can view own settings" ON customer_settings FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own settings" ON customer_settings;
CREATE POLICY "Users can update own settings" ON customer_settings FOR UPDATE USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON customer_settings;
CREATE POLICY "Users can insert own settings" ON customer_settings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 3. FIX: Avatar Storage RLS
-- Ensure 'avatars' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies (broaden them slightly to avoid "violates RLS" if folder structure varies)
-- Allow users to upload ANY file to 'avatars' as long as the name starts with their UID (or folder)
-- BUT the best policy is usually strictly folder based.
-- We'll assume the frontend now sends `{uid}/{filename}`, so `(storage.foldername(name))[1]` == uid.

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1] 
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1] 
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1] 
);

DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');


-- 4. SEED: Ensure existing users have Loyalty/Settings records
-- This fixes the 406 error for existing users who don't have these rows yet.
INSERT INTO customer_loyalty (customer_id)
SELECT id FROM auth.users
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO customer_settings (customer_id)
SELECT id FROM auth.users
ON CONFLICT (customer_id) DO NOTHING;

-- 5. NOTIFICATIONS TABLE (Fix missing dependent table)
CREATE TABLE IF NOT EXISTS customer_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON customer_notifications;
CREATE POLICY "Users view own notifications" ON customer_notifications FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users update own notifications" ON customer_notifications;
CREATE POLICY "Users update own notifications" ON customer_notifications FOR UPDATE USING (auth.uid() = customer_id);


SELECT 'Customer Portal Fixes Applied Successfully' as result;

-- ============================================
-- SIFIXA Comprehensive Data Fix & Seeding
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure Profiles Table Exists (Auth Profile)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Ensure Customers Table Exists (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Consolidated Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_comprehensive()
RETURNS TRIGGER AS $$
BEGIN
    -- A. Create Profile (Auth)
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    -- B. Create Customer Record (CRM) - Attempt to link by email
    -- If customer exists with same email, do nothing (we assume logic elsewhere handles linking if needed)
    -- If not, create new customer placeholder
    INSERT INTO public.customers (email, first_name, last_name)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        ''
    )
    ON CONFLICT (email) DO NOTHING;

    -- C. Create Loyalty Record (Portal V2) - Linked to Auth ID
    INSERT INTO public.customer_loyalty (customer_id, points, tier)
    VALUES (NEW.id, 0, 'Bronze')
    ON CONFLICT (customer_id) DO NOTHING;

    -- D. Create Settings Record (Portal V2) - Linked to Auth ID
    INSERT INTO public.customer_settings (customer_id)
    VALUES (NEW.id)
    ON CONFLICT (customer_id) DO NOTHING;

    -- E. Create Default Role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, (SELECT id FROM public.roles WHERE name = 'customer' LIMIT 1))
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-bind Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_comprehensive();

-- 5. Seed Data: Time Slots (for Bookings)
INSERT INTO time_slots (name, start_time, end_time, max_bookings, is_active)
VALUES 
    ('Morning', '09:00', '12:00', 3, true),
    ('Afternoon', '12:00', '15:00', 3, true),
    ('Late Afternoon', '15:00', '18:00', 3, true)
ON CONFLICT DO NOTHING;

-- 6. Seed Data: Loyalty Rewards
INSERT INTO loyalty_rewards (name, description, points_cost, reward_type, reward_value, active)
VALUES
    ('$10 Off Repair', 'Get $10 discount on any repair', 500, 'discount', 10.00, true),
    ('Free Screen Protector', 'Tempered glass screen protector', 300, 'item', 15.00, true),
    ('Priority Service', 'Skip the line service', 1000, 'service', 0.00, true)
ON CONFLICT DO NOTHING;

-- 7. Seed Data: Services (Basic)
INSERT INTO items (name, description, item_type, is_active)
VALUES 
    ('Screen Replacement', 'Premium OLED/LCD screen replacement', 'service', true),
    ('Battery Replacement', 'High capacity battery replacement', 'service', true),
    ('Diagnostic', 'Full device diagnostic', 'service', true)
ON CONFLICT DO NOTHING;

SELECT 'Comprehensive Fix Script Applied Successfully' as message;

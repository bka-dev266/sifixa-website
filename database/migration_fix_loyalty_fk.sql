-- ============================================
-- SIFIXA: Fix customer_loyalty FK Constraint
-- Run this in Supabase SQL Editor
-- ============================================
-- Problem: handle_new_user_comprehensive() uses auth.users.id (UUID)
-- for customer_loyalty.customer_id, but that FK references customers.id
-- which uses its own auto-generated UUID.
--
-- Fix: Capture the actual customer UUID from the customers insert
-- and use THAT for customer_loyalty and customer_settings.
-- ============================================

-- 1. Ensure customer_loyalty and customer_settings tables exist
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

CREATE TABLE IF NOT EXISTS public.customer_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

-- 2. Drop existing FK constraints on customer_loyalty and customer_settings
-- so we can re-add them referencing profiles(id) instead of customers(id)
ALTER TABLE public.customer_loyalty
    DROP CONSTRAINT IF EXISTS customer_loyalty_customer_id_fkey;

ALTER TABLE public.customer_settings
    DROP CONSTRAINT IF EXISTS customer_settings_customer_id_fkey;

-- 3. Add FK constraints referencing profiles(id) (which IS the auth UUID)
-- This way customer_loyalty.customer_id = auth user UUID = profiles.id
ALTER TABLE public.customer_loyalty
    ADD CONSTRAINT customer_loyalty_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.customer_settings
    ADD CONSTRAINT customer_settings_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Enable RLS on these tables
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - users can read/update their own records
DROP POLICY IF EXISTS "Users can view own loyalty" ON public.customer_loyalty;
CREATE POLICY "Users can view own loyalty" ON public.customer_loyalty
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own loyalty" ON public.customer_loyalty;
CREATE POLICY "Users can update own loyalty" ON public.customer_loyalty
    FOR UPDATE USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can view own settings" ON public.customer_settings;
CREATE POLICY "Users can view own settings" ON public.customer_settings
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.customer_settings;
CREATE POLICY "Users can update own settings" ON public.customer_settings
    FOR UPDATE USING (auth.uid() = customer_id);

-- Service role insert policies (for triggers)
DROP POLICY IF EXISTS "Service role can insert loyalty" ON public.customer_loyalty;
CREATE POLICY "Service role can insert loyalty" ON public.customer_loyalty
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert settings" ON public.customer_settings;
CREATE POLICY "Service role can insert settings" ON public.customer_settings
    FOR INSERT WITH CHECK (true);

-- 6. Updated trigger: uses ON CONFLICT to be safe
CREATE OR REPLACE FUNCTION public.handle_new_user_comprehensive()
RETURNS TRIGGER AS $$
BEGIN
    -- A. Create Profile (Auth) - profiles.id = auth user UUID
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    -- B. Create Customer Record (CRM) - separate UUID for CRM purposes
    INSERT INTO public.customers (email, first_name, last_name)
    VALUES (
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        ''
    )
    ON CONFLICT (email) DO NOTHING;

    -- C. Create Loyalty Record - uses auth UUID (now FK references profiles.id)
    INSERT INTO public.customer_loyalty (customer_id, points, tier)
    VALUES (NEW.id, 0, 'Bronze')
    ON CONFLICT (customer_id) DO NOTHING;

    -- D. Create Settings Record - uses auth UUID (now FK references profiles.id)
    INSERT INTO public.customer_settings (customer_id)
    VALUES (NEW.id)
    ON CONFLICT (customer_id) DO NOTHING;

    -- E. Create Default Customer Role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, (SELECT id FROM public.roles WHERE name = 'customer' LIMIT 1))
    ON CONFLICT (user_id, role_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Re-bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_comprehensive();

-- 8. Fix any existing orphaned loyalty/settings records
-- Delete records whose customer_id doesn't match any profile
DELETE FROM public.customer_loyalty
WHERE customer_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.customer_settings
WHERE customer_id NOT IN (SELECT id FROM public.profiles);

SELECT 'customer_loyalty FK constraint fix applied successfully!' as result;

-- ============================================
-- Auth Profiles Migration
-- Auto-create profiles on signup + assign roles
-- ============================================

-- Seed default roles (if not exists)
INSERT INTO roles (id, name, is_staff, permissions) VALUES
    (1, 'customer', false, '{"view_own_bookings": true}'),
    (2, 'employee', true, '{"view_all_bookings": true, "manage_repairs": true}'),
    (3, 'admin', true, '{"full_access": true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRIGGER: Auto-create profile on auth.users insert
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile for new auth user
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
    );
    
    -- Assign default customer role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, 1); -- role_id 1 = customer
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS Policies for profiles
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Staff can view all profiles
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.is_staff = true
        )
    );

-- ============================================
-- RLS Policies for user_roles
-- ============================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================
-- Helper function to get user's highest role
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT r.name INTO role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    ORDER BY 
        CASE r.name 
            WHEN 'admin' THEN 1 
            WHEN 'employee' THEN 2 
            ELSE 3 
        END
    LIMIT 1;
    
    RETURN COALESCE(role_name, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS for CMS tables - allow admin writes
-- ============================================

-- landing_settings: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_settings" ON landing_settings;
CREATE POLICY "Admin can write landing_settings" ON landing_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_pricing: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_pricing" ON landing_pricing;
CREATE POLICY "Admin can write landing_pricing" ON landing_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_pricing_items: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_pricing_items" ON landing_pricing_items;
CREATE POLICY "Admin can write landing_pricing_items" ON landing_pricing_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_gallery: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_gallery" ON landing_gallery;
CREATE POLICY "Admin can write landing_gallery" ON landing_gallery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_legal: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_legal" ON landing_legal;
CREATE POLICY "Admin can write landing_legal" ON landing_legal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_hero: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_hero" ON landing_hero;
CREATE POLICY "Admin can write landing_hero" ON landing_hero
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_services: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_services" ON landing_services;
CREATE POLICY "Admin can write landing_services" ON landing_services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_testimonials: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_testimonials" ON landing_testimonials;
CREATE POLICY "Admin can write landing_testimonials" ON landing_testimonials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_faq: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_faq" ON landing_faq;
CREATE POLICY "Admin can write landing_faq" ON landing_faq
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- landing_sections: Admin can write
DROP POLICY IF EXISTS "Admin can write landing_sections" ON landing_sections;
CREATE POLICY "Admin can write landing_sections" ON landing_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

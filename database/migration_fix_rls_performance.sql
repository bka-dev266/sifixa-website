-- ============================================
-- Fix RLS Performance Warnings
-- 1. Fix auth_rls_initplan: Wrap auth.uid() in (SELECT ...)
-- 2. Fix multiple_permissive_policies: Consolidate duplicate policies
-- ============================================

-- ============================================================
-- PART 1: FIX AUTH_RLS_INITPLAN WARNINGS
-- Replace auth.uid() with (SELECT auth.uid()) for performance
-- ============================================================

-- profiles: Users can view own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING ((SELECT auth.uid()) = id);

-- profiles: Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- customers: Customers view own data
DROP POLICY IF EXISTS "Customers view own data" ON customers;
CREATE POLICY "Customers view own data" ON customers
    FOR SELECT USING (user_id = (SELECT auth.uid()) OR is_staff());

-- devices: View own devices
DROP POLICY IF EXISTS "View own devices" ON devices;
CREATE POLICY "View own devices" ON devices
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = (SELECT auth.uid())) OR is_staff()
    );

-- appointments: View own appointments
DROP POLICY IF EXISTS "View own appointments" ON appointments;
CREATE POLICY "View own appointments" ON appointments
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = (SELECT auth.uid())) OR is_staff()
    );

-- user_roles: Users manage own roles
DROP POLICY IF EXISTS "Users manage own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- PART 2: FIX MULTIPLE_PERMISSIVE_POLICIES WARNINGS
-- Consolidate duplicate policies into single unified policies
-- ============================================================

-- ==================== CUSTOMERS ====================
-- Remove redundant policies and keep unified ones
DROP POLICY IF EXISTS "Authenticated read customers" ON customers;
DROP POLICY IF EXISTS "Staff manage customers" ON customers;
DROP POLICY IF EXISTS "Public insert customers" ON customers;
DROP POLICY IF EXISTS "Staff full access customers" ON customers;

CREATE POLICY "Unified read customers" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Unified insert customers" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage customers" ON customers
    FOR ALL USING (is_staff());

-- ==================== DEVICES ====================
DROP POLICY IF EXISTS "Authenticated read devices" ON devices;
DROP POLICY IF EXISTS "Staff manage devices" ON devices;
DROP POLICY IF EXISTS "Public insert devices" ON devices;
DROP POLICY IF EXISTS "Staff full access devices" ON devices;

CREATE POLICY "Unified read devices" ON devices
    FOR SELECT USING (true);

CREATE POLICY "Unified insert devices" ON devices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage devices" ON devices
    FOR UPDATE USING (is_staff());

CREATE POLICY "Staff delete devices" ON devices
    FOR DELETE USING (is_staff());

-- ==================== APPOINTMENTS ====================
DROP POLICY IF EXISTS "Authenticated read appointments" ON appointments;
DROP POLICY IF EXISTS "Staff manage appointments" ON appointments;
DROP POLICY IF EXISTS "Public insert appointments" ON appointments;

CREATE POLICY "Unified read appointments" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Unified insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage appointments" ON appointments
    FOR UPDATE USING (is_staff());

CREATE POLICY "Staff delete appointments" ON appointments
    FOR DELETE USING (is_staff());

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Authenticated read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users manage own roles" ON user_roles;

-- Already has "Users can view own roles" from above

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Staff read all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff full access profiles" ON profiles;

CREATE POLICY "Staff read profiles" ON profiles
    FOR SELECT USING (
        (SELECT auth.uid()) = id OR is_staff()
    );

-- ==================== CONVERSATIONS ====================
DROP POLICY IF EXISTS "Authenticated read conversations" ON conversations;
DROP POLICY IF EXISTS "Staff manage conversations" ON conversations;
DROP POLICY IF EXISTS "Public insert conversations" ON conversations;

CREATE POLICY "Unified read conversations" ON conversations
    FOR SELECT USING (true);

CREATE POLICY "Unified insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage conversations" ON conversations
    FOR UPDATE USING (is_staff());

CREATE POLICY "Staff delete conversations" ON conversations
    FOR DELETE USING (is_staff());

-- ==================== MESSAGES ====================
DROP POLICY IF EXISTS "Authenticated read messages" ON messages;
DROP POLICY IF EXISTS "Staff manage messages" ON messages;
DROP POLICY IF EXISTS "Public insert messages" ON messages;

CREATE POLICY "Unified read messages" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Unified insert messages" ON messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage messages" ON messages
    FOR UPDATE USING (is_staff());

-- ==================== ITEMS ====================
DROP POLICY IF EXISTS "Public read items" ON items;
DROP POLICY IF EXISTS "Staff full access items" ON items;
DROP POLICY IF EXISTS "Staff manage items" ON items;

CREATE POLICY "Public read items" ON items
    FOR SELECT USING (is_active = true OR is_staff());

CREATE POLICY "Staff write items" ON items
    FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "Staff update items" ON items
    FOR UPDATE USING (is_staff());

CREATE POLICY "Staff delete items" ON items
    FOR DELETE USING (is_staff());

-- ==================== ITEM_CATEGORIES ====================
DROP POLICY IF EXISTS "Public read item_categories" ON item_categories;
DROP POLICY IF EXISTS "Staff full access item_categories" ON item_categories;

CREATE POLICY "Public read item_categories" ON item_categories
    FOR SELECT USING (true);

CREATE POLICY "Staff write item_categories" ON item_categories
    FOR ALL USING (is_staff());

-- ==================== ITEM_PRICES ====================
DROP POLICY IF EXISTS "Public read item_prices" ON item_prices;
DROP POLICY IF EXISTS "Public read prices" ON item_prices;
DROP POLICY IF EXISTS "Staff full access item_prices" ON item_prices;

CREATE POLICY "Public read item_prices" ON item_prices
    FOR SELECT USING (true);

CREATE POLICY "Staff write item_prices" ON item_prices
    FOR ALL USING (is_staff());

-- ==================== STORES ====================
DROP POLICY IF EXISTS "Public read stores" ON stores;
DROP POLICY IF EXISTS "Staff full access stores" ON stores;

CREATE POLICY "Public read stores" ON stores
    FOR SELECT USING (is_active = true OR is_staff());

CREATE POLICY "Staff write stores" ON stores
    FOR ALL USING (is_staff());

-- ==================== STOCK_LEVELS ====================
DROP POLICY IF EXISTS "Authenticated read stock" ON stock_levels;
DROP POLICY IF EXISTS "Staff manage stock" ON stock_levels;

CREATE POLICY "Read stock levels" ON stock_levels
    FOR SELECT USING (true);

CREATE POLICY "Staff write stock" ON stock_levels
    FOR ALL USING (is_staff());

-- ==================== REPAIR_TRACKING_HISTORY ====================
DROP POLICY IF EXISTS "Public read tracking" ON repair_tracking_history;
DROP POLICY IF EXISTS "Public read tracking_history" ON repair_tracking_history;
DROP POLICY IF EXISTS "Authenticated insert tracking" ON repair_tracking_history;
DROP POLICY IF EXISTS "Authenticated insert tracking_history" ON repair_tracking_history;
DROP POLICY IF EXISTS "Staff manage tracking_history" ON repair_tracking_history;

CREATE POLICY "Public read repair_tracking" ON repair_tracking_history
    FOR SELECT USING (true);

CREATE POLICY "Insert repair_tracking" ON repair_tracking_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff manage repair_tracking" ON repair_tracking_history
    FOR UPDATE USING (is_staff());

-- ==================== LANDING PAGE CMS TABLES ====================
-- Consolidate admin write + public read into unified policies

-- landing_hero
DROP POLICY IF EXISTS "Admin write landing_hero" ON landing_hero;
DROP POLICY IF EXISTS "Public read landing_hero" ON landing_hero;
CREATE POLICY "Read landing_hero" ON landing_hero FOR SELECT USING (true);
CREATE POLICY "Admin write landing_hero" ON landing_hero FOR ALL USING (is_staff());

-- landing_services
DROP POLICY IF EXISTS "Admin write landing_services" ON landing_services;
DROP POLICY IF EXISTS "Public read landing_services" ON landing_services;
CREATE POLICY "Read landing_services" ON landing_services FOR SELECT USING (is_active = true OR is_staff());
CREATE POLICY "Admin write landing_services" ON landing_services FOR ALL USING (is_staff());

-- landing_testimonials
DROP POLICY IF EXISTS "Admin write landing_testimonials" ON landing_testimonials;
DROP POLICY IF EXISTS "Public read landing_testimonials" ON landing_testimonials;
CREATE POLICY "Read landing_testimonials" ON landing_testimonials FOR SELECT USING (is_active = true OR is_staff());
CREATE POLICY "Admin write landing_testimonials" ON landing_testimonials FOR ALL USING (is_staff());

-- landing_settings
DROP POLICY IF EXISTS "Admin write landing_settings" ON landing_settings;
DROP POLICY IF EXISTS "Public read landing_settings" ON landing_settings;
CREATE POLICY "Read landing_settings" ON landing_settings FOR SELECT USING (true);
CREATE POLICY "Admin write landing_settings" ON landing_settings FOR ALL USING (is_staff());

-- landing_pricing
DROP POLICY IF EXISTS "Admin write landing_pricing" ON landing_pricing;
DROP POLICY IF EXISTS "Public read landing_pricing" ON landing_pricing;
CREATE POLICY "Read landing_pricing" ON landing_pricing FOR SELECT USING (true);
CREATE POLICY "Admin write landing_pricing" ON landing_pricing FOR ALL USING (is_staff());

-- landing_pricing_items
DROP POLICY IF EXISTS "Admin write landing_pricing_items" ON landing_pricing_items;
DROP POLICY IF EXISTS "Public read landing_pricing_items" ON landing_pricing_items;
CREATE POLICY "Read landing_pricing_items" ON landing_pricing_items FOR SELECT USING (true);
CREATE POLICY "Admin write landing_pricing_items" ON landing_pricing_items FOR ALL USING (is_staff());

-- landing_gallery
DROP POLICY IF EXISTS "Admin write landing_gallery" ON landing_gallery;
DROP POLICY IF EXISTS "Public read landing_gallery" ON landing_gallery;
CREATE POLICY "Read landing_gallery" ON landing_gallery FOR SELECT USING (true);
CREATE POLICY "Admin write landing_gallery" ON landing_gallery FOR ALL USING (is_staff());

-- landing_faq
DROP POLICY IF EXISTS "Admin write landing_faq" ON landing_faq;
DROP POLICY IF EXISTS "Public read landing_faq" ON landing_faq;
CREATE POLICY "Read landing_faq" ON landing_faq FOR SELECT USING (true);
CREATE POLICY "Admin write landing_faq" ON landing_faq FOR ALL USING (is_staff());

-- landing_features
DROP POLICY IF EXISTS "Admin write landing_features" ON landing_features;
DROP POLICY IF EXISTS "Public read landing_features" ON landing_features;
CREATE POLICY "Read landing_features" ON landing_features FOR SELECT USING (true);
CREATE POLICY "Admin write landing_features" ON landing_features FOR ALL USING (is_staff());

-- landing_how_it_works_steps
DROP POLICY IF EXISTS "Admin write how_it_works_steps" ON landing_how_it_works_steps;
DROP POLICY IF EXISTS "Public read how_it_works_steps" ON landing_how_it_works_steps;
CREATE POLICY "Read landing_how_it_works_steps" ON landing_how_it_works_steps FOR SELECT USING (true);
CREATE POLICY "Admin write landing_how_it_works_steps" ON landing_how_it_works_steps FOR ALL USING (is_staff());

-- landing_how_it_works_options
DROP POLICY IF EXISTS "Admin write how_it_works_options" ON landing_how_it_works_options;
DROP POLICY IF EXISTS "Public read how_it_works_options" ON landing_how_it_works_options;
CREATE POLICY "Read landing_how_it_works_options" ON landing_how_it_works_options FOR SELECT USING (true);
CREATE POLICY "Admin write landing_how_it_works_options" ON landing_how_it_works_options FOR ALL USING (is_staff());

-- landing_sections
DROP POLICY IF EXISTS "Admin write landing_sections" ON landing_sections;
DROP POLICY IF EXISTS "Public read landing_sections" ON landing_sections;
CREATE POLICY "Read landing_sections" ON landing_sections FOR SELECT USING (true);
CREATE POLICY "Admin write landing_sections" ON landing_sections FOR ALL USING (is_staff());

-- ==================== FOOTER/SITE SETTINGS ====================
-- footer_links
DROP POLICY IF EXISTS "Admin write footer_links" ON footer_links;
DROP POLICY IF EXISTS "Public read footer_links" ON footer_links;
CREATE POLICY "Read footer_links" ON footer_links FOR SELECT USING (true);
CREATE POLICY "Admin write footer_links" ON footer_links FOR ALL USING (is_staff());

-- social_links
DROP POLICY IF EXISTS "Admin write social_links" ON social_links;
DROP POLICY IF EXISTS "Public read social_links" ON social_links;
CREATE POLICY "Read social_links" ON social_links FOR SELECT USING (true);
CREATE POLICY "Admin write social_links" ON social_links FOR ALL USING (is_staff());

-- site_settings
DROP POLICY IF EXISTS "Admin write site_settings" ON site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write site_settings" ON site_settings FOR ALL USING (is_staff());

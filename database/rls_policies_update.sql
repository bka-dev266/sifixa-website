-- ====================================================
-- SIFIXA RLS POLICIES UPDATE
-- Run this AFTER sifixa_setup.sql to fix/update RLS
-- Fixes authentication issues and customer access
-- ====================================================

-- ==================== USER_ROLES TABLE ====================
-- Fix infinite recursion by allowing simple read access
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Staff full access user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Manage user_roles" ON user_roles;

CREATE POLICY "Authenticated read user_roles" ON user_roles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own roles" ON user_roles 
FOR ALL TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- ==================== ROLES TABLE ====================
DROP POLICY IF EXISTS "Public read roles" ON roles;
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);

-- ==================== PROFILES TABLE ====================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Staff read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Staff read all profiles" ON profiles 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access profiles" ON profiles
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==================== CUSTOMERS TABLE ====================
DROP POLICY IF EXISTS "Public insert customers" ON customers;
DROP POLICY IF EXISTS "Staff full access customers" ON customers;

-- Allow anonymous to create customers (for booking without login)
CREATE POLICY "Public insert customers" ON customers 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow authenticated to read all customers
CREATE POLICY "Authenticated read customers" ON customers 
FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- Allow staff to update/delete customers
CREATE POLICY "Staff manage customers" ON customers 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== DEVICES TABLE ====================
DROP POLICY IF EXISTS "Public insert devices" ON devices;
DROP POLICY IF EXISTS "Staff full access devices" ON devices;

-- Allow anonymous to create devices (for booking)
CREATE POLICY "Public insert devices" ON devices 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow reading devices
CREATE POLICY "Authenticated read devices" ON devices 
FOR SELECT TO authenticated USING (true);

-- Staff can manage all devices
CREATE POLICY "Staff manage devices" ON devices 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== APPOINTMENTS TABLE ====================
DROP POLICY IF EXISTS "Public insert appointments" ON appointments;
DROP POLICY IF EXISTS "Staff full access appointments" ON appointments;

-- Allow anonymous to create appointments (booking)
CREATE POLICY "Public insert appointments" ON appointments 
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anonymous to read own appointment by tracking number (handled in RPC)
CREATE POLICY "Authenticated read appointments" ON appointments 
FOR SELECT TO authenticated USING (true);

-- Staff can manage all appointments
CREATE POLICY "Staff manage appointments" ON appointments 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== CONVERSATIONS TABLE ====================
DROP POLICY IF EXISTS "Customer create conversation" ON conversations;
DROP POLICY IF EXISTS "Staff access conversations" ON conversations;

CREATE POLICY "Public insert conversations" ON conversations 
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read conversations" ON conversations 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage conversations" ON conversations 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== MESSAGES TABLE ====================
DROP POLICY IF EXISTS "Customer create message" ON messages;
DROP POLICY IF EXISTS "Staff access messages" ON messages;

CREATE POLICY "Public insert messages" ON messages 
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read messages" ON messages 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage messages" ON messages 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== NOTIFICATION_EVENTS TABLE ====================
DROP POLICY IF EXISTS "Staff manage notifications" ON notification_events;

CREATE POLICY "Public insert notifications" ON notification_events 
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read notifications" ON notification_events 
FOR SELECT TO authenticated USING (true);

-- ==================== REPAIR_TRACKING_HISTORY TABLE ====================
DROP POLICY IF EXISTS "Public read tracking" ON repair_tracking_history;

CREATE POLICY "Public read tracking" ON repair_tracking_history 
FOR SELECT USING (true);

CREATE POLICY "Authenticated insert tracking" ON repair_tracking_history 
FOR INSERT TO authenticated WITH CHECK (true);

-- ==================== TIME_SLOTS TABLE ====================
DROP POLICY IF EXISTS "Public read time_slots" ON time_slots;

CREATE POLICY "Public read time_slots" ON time_slots 
FOR SELECT USING (is_active = true);

-- ==================== STORES TABLE ====================
DROP POLICY IF EXISTS "Public read stores" ON stores;

CREATE POLICY "Public read stores" ON stores 
FOR SELECT USING (is_active = true);

-- ==================== ITEMS TABLE ====================
DROP POLICY IF EXISTS "Public read items" ON items;

CREATE POLICY "Public read items" ON items 
FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Staff manage items" ON items 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== ITEM_PRICES TABLE ====================
DROP POLICY IF EXISTS "Public read prices" ON item_prices;

CREATE POLICY "Public read prices" ON item_prices 
FOR SELECT USING (true);

-- ==================== STOCK_LEVELS TABLE ====================
DROP POLICY IF EXISTS "Staff manage stock" ON stock_levels;

CREATE POLICY "Authenticated read stock" ON stock_levels 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage stock" ON stock_levels 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== LANDING PAGE TABLES ====================
-- These should already have public read policies from setup

-- Ensure landing_hero has public read
DROP POLICY IF EXISTS "Public read landing_hero" ON landing_hero;
CREATE POLICY "Public read landing_hero" ON landing_hero 
FOR SELECT USING (is_active = true);

-- Ensure landing_services has public read
DROP POLICY IF EXISTS "Public read landing_services" ON landing_services;
CREATE POLICY "Public read landing_services" ON landing_services 
FOR SELECT USING (is_active = true);

-- Ensure landing_testimonials has public read
DROP POLICY IF EXISTS "Public read landing_testimonials" ON landing_testimonials;
CREATE POLICY "Public read landing_testimonials" ON landing_testimonials 
FOR SELECT USING (is_active = true);

-- Ensure landing_faq has public read
DROP POLICY IF EXISTS "Public read landing_faq" ON landing_faq;
CREATE POLICY "Public read landing_faq" ON landing_faq 
FOR SELECT USING (is_active = true);

-- Ensure landing_sections has public read
DROP POLICY IF EXISTS "Public read landing_sections" ON landing_sections;
CREATE POLICY "Public read landing_sections" ON landing_sections 
FOR SELECT USING (is_active = true);

-- Ensure landing_pricing has public read
DROP POLICY IF EXISTS "Public read landing_pricing" ON landing_pricing;
CREATE POLICY "Public read landing_pricing" ON landing_pricing 
FOR SELECT USING (is_active = true);

-- Ensure landing_pricing_items has public read
DROP POLICY IF EXISTS "Public read landing_pricing_items" ON landing_pricing_items;
CREATE POLICY "Public read landing_pricing_items" ON landing_pricing_items 
FOR SELECT USING (is_active = true);

-- Ensure landing_gallery has RLS and policies
ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read landing_gallery" ON landing_gallery;
CREATE POLICY "Public read landing_gallery" ON landing_gallery 
FOR SELECT USING (is_active = true);

-- Admin write for all landing tables
CREATE POLICY "Admin write landing_hero" ON landing_hero 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_services" ON landing_services 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_testimonials" ON landing_testimonials 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_faq" ON landing_faq 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_sections" ON landing_sections 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_pricing" ON landing_pricing 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_pricing_items" ON landing_pricing_items 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin write landing_gallery" ON landing_gallery 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

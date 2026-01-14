-- ====================================================
-- SIFIXA Customer Portal - Policy Fix Script
-- Run this FIRST if you get "policy already exists" errors
-- Then run the migration_customer_portal.sql
-- ====================================================

-- Drop existing policies to allow re-creation
DROP POLICY IF EXISTS "Customers can view own notifications" ON customer_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON customer_notifications;
DROP POLICY IF EXISTS "Customers can update own notifications" ON customer_notifications;
DROP POLICY IF EXISTS "Customers can view own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Anyone can view rewards catalog" ON loyalty_rewards;
DROP POLICY IF EXISTS "Customers can view own redemptions" ON loyalty_redemptions;
DROP POLICY IF EXISTS "Customers can view own warranties" ON customer_warranties;
DROP POLICY IF EXISTS "Customers can claim warranties" ON customer_warranties;
DROP POLICY IF EXISTS "Customers can view own invoices" ON customer_invoices;
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Customers can view own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can update own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can create own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can view own referrals" ON customer_referrals;
DROP POLICY IF EXISTS "Customers can create referrals" ON customer_referrals;

-- v2 policies
DROP POLICY IF EXISTS "Customers can manage own favorites" ON customer_favorites;
DROP POLICY IF EXISTS "Customers can manage own payment methods" ON customer_payment_methods;
DROP POLICY IF EXISTS "Customers can view own chat history" ON customer_chat_history;
DROP POLICY IF EXISTS "Customers can send messages" ON customer_chat_history;
DROP POLICY IF EXISTS "Staff can update chat" ON customer_chat_history;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_create_customer_loyalty ON customers;
DROP TRIGGER IF EXISTS trigger_create_customer_settings ON customers;
DROP TRIGGER IF EXISTS trigger_update_payment_method_timestamp ON customer_payment_methods;

-- Now you can run migration_customer_portal.sql and migration_customer_portal_v2.sql
SELECT 'Policies and triggers dropped successfully. Now run the migration scripts.' as status;

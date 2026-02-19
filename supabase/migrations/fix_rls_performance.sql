-- ============================================================================
-- RLS Performance Fix Migration v2
-- Fixed: Uses user_roles/roles tables instead of profiles.role column
-- ============================================================================

-- Helper function to check if user is staff (cached via select wrapper)
CREATE OR REPLACE FUNCTION public.is_staff_user(user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = user_id AND r.is_staff = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 1: Fix repair_services - The booking page issue
-- ============================================================================

DROP POLICY IF EXISTS "Public read repair_services" ON repair_services;
DROP POLICY IF EXISTS "Staff manage repair_services" ON repair_services;

-- Simple public read - no auth check needed
CREATE POLICY "Public read repair_services" ON repair_services 
FOR SELECT USING (true);

CREATE POLICY "Staff manage repair_services" ON repair_services 
FOR ALL USING (
    public.is_staff_user((select auth.uid()))
);

-- ============================================================================
-- SECTION 2: Fix device_trade_ins policies
-- ============================================================================

DROP POLICY IF EXISTS "Staff can view all trade-ins" ON device_trade_ins;
DROP POLICY IF EXISTS "Customers can view own trade-ins" ON device_trade_ins;
DROP POLICY IF EXISTS "Staff can update trade-ins" ON device_trade_ins;
DROP POLICY IF EXISTS "Public can read own insert" ON device_trade_ins;

CREATE POLICY "View trade-ins" ON device_trade_ins FOR SELECT USING (
    customer_id = (select auth.uid())
    OR public.is_staff_user((select auth.uid()))
);

CREATE POLICY "Update trade-ins" ON device_trade_ins FOR UPDATE USING (
    public.is_staff_user((select auth.uid()))
);

-- ============================================================================
-- SECTION 3: Fix profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Staff read profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for trigger" ON profiles;

CREATE POLICY "View profiles" ON profiles FOR SELECT USING (
    id = (select auth.uid())
    OR public.is_staff_user((select auth.uid()))
);

CREATE POLICY "Insert own profile" ON profiles FOR INSERT WITH CHECK (
    id = (select auth.uid())
);

CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (
    id = (select auth.uid())
);

-- ============================================================================
-- SECTION 4: Fix customer_loyalty policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Users can view own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Customers can view own loyalty" ON customer_loyalty;

CREATE POLICY "View own loyalty" ON customer_loyalty FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

CREATE POLICY "Update own loyalty" ON customer_loyalty FOR UPDATE USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 5: Fix customer_referrals policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own referrals" ON customer_referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON customer_referrals;
DROP POLICY IF EXISTS "Customers can view own referrals" ON customer_referrals;
DROP POLICY IF EXISTS "Customers can create referrals" ON customer_referrals;

CREATE POLICY "View own referrals" ON customer_referrals FOR SELECT USING (
    referrer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = referrer_id 
        AND c.user_id = (select auth.uid())
    )
);

CREATE POLICY "Create referrals" ON customer_referrals FOR INSERT WITH CHECK (
    referrer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = referrer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 6: Fix support_tickets policies
-- ============================================================================

DROP POLICY IF EXISTS "Customers can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Customers can update own tickets" ON support_tickets;

CREATE POLICY "View own tickets" ON support_tickets FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
    OR public.is_staff_user((select auth.uid()))
);

CREATE POLICY "Create tickets" ON support_tickets FOR INSERT WITH CHECK (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

CREATE POLICY "Update own tickets" ON support_tickets FOR UPDATE USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 7: Fix support_ticket_messages policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_ticket_messages;
DROP POLICY IF EXISTS "Users can add messages to their tickets" ON support_ticket_messages;

CREATE POLICY "View ticket messages" ON support_ticket_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM support_tickets t 
        WHERE t.id = ticket_id 
        AND (
            t.customer_id = (select auth.uid())
            OR EXISTS (
                SELECT 1 FROM customers c 
                WHERE c.id = t.customer_id 
                AND c.user_id = (select auth.uid())
            )
        )
    )
    OR public.is_staff_user((select auth.uid()))
);

CREATE POLICY "Add ticket messages" ON support_ticket_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_tickets t 
        WHERE t.id = ticket_id 
        AND (
            t.customer_id = (select auth.uid())
            OR EXISTS (
                SELECT 1 FROM customers c 
                WHERE c.id = t.customer_id 
                AND c.user_id = (select auth.uid())
            )
        )
    )
    OR public.is_staff_user((select auth.uid()))
);

-- ============================================================================
-- SECTION 8: Fix customer_settings policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own settings" ON customer_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON customer_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can view own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can update own settings" ON customer_settings;
DROP POLICY IF EXISTS "Customers can create own settings" ON customer_settings;

CREATE POLICY "View own settings" ON customer_settings FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

CREATE POLICY "Manage own settings" ON customer_settings FOR ALL USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 9: Fix customer_notifications policies
-- ============================================================================

DROP POLICY IF EXISTS "Customers can view own notifications" ON customer_notifications;
DROP POLICY IF EXISTS "Customers can update own notifications" ON customer_notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON customer_notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON customer_notifications;

CREATE POLICY "Manage own notifications" ON customer_notifications FOR ALL USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 10: Fix other customer tables
-- ============================================================================

-- loyalty_redemptions
DROP POLICY IF EXISTS "Customers can view own redemptions" ON loyalty_redemptions;
CREATE POLICY "View own redemptions" ON loyalty_redemptions FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- customer_warranties
DROP POLICY IF EXISTS "Customers can view own warranties" ON customer_warranties;
DROP POLICY IF EXISTS "Customers can claim warranties" ON customer_warranties;
CREATE POLICY "Manage own warranties" ON customer_warranties FOR ALL USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- customer_invoices
DROP POLICY IF EXISTS "Customers can view own invoices" ON customer_invoices;
CREATE POLICY "View own invoices" ON customer_invoices FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- customer_reviews
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON customer_reviews;
CREATE POLICY "View reviews" ON customer_reviews FOR SELECT USING (true);
CREATE POLICY "Create reviews" ON customer_reviews FOR INSERT WITH CHECK (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
);

-- ============================================================================
-- SECTION 11: Fix appointments and customers duplicates
-- ============================================================================

DROP POLICY IF EXISTS "Unified read appointments" ON appointments;
DROP POLICY IF EXISTS "View own appointments" ON appointments;
CREATE POLICY "Read appointments" ON appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff manage customers" ON customers;
DROP POLICY IF EXISTS "Unified insert customers" ON customers;
DROP POLICY IF EXISTS "Customers view own data" ON customers;
DROP POLICY IF EXISTS "Unified read customers" ON customers;

CREATE POLICY "Read customers" ON customers FOR SELECT USING (
    user_id = (select auth.uid())
    OR email = (select auth.email())
    OR public.is_staff_user((select auth.uid()))
);

CREATE POLICY "Insert customers" ON customers FOR INSERT WITH CHECK (true);

CREATE POLICY "Update customers" ON customers FOR UPDATE USING (
    user_id = (select auth.uid())
    OR public.is_staff_user((select auth.uid()))
);

-- devices
DROP POLICY IF EXISTS "Unified read devices" ON devices;
DROP POLICY IF EXISTS "View own devices" ON devices;
CREATE POLICY "Read devices" ON devices FOR SELECT USING (
    customer_id = (select auth.uid())
    OR EXISTS (
        SELECT 1 FROM customers c 
        WHERE c.id = customer_id 
        AND c.user_id = (select auth.uid())
    )
    OR public.is_staff_user((select auth.uid()))
);

-- ============================================================================
-- SECTION 12: Fix landing page tables - consolidate duplicates
-- ============================================================================

-- For landing tables, keep simple public read
DO $$
DECLARE
    landing_tables TEXT[] := ARRAY[
        'landing_hero', 'landing_services', 'landing_testimonials', 'landing_faq',
        'landing_sections', 'landing_features', 'landing_gallery', 'landing_pricing',
        'landing_pricing_items', 'landing_how_it_works_options', 'landing_how_it_works_steps',
        'landing_settings', 'footer_links', 'site_settings', 'social_links'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY landing_tables
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Admin write %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Read %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Public read %s" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Admin manage %s" ON %I', tbl, tbl);
            
            EXECUTE format('CREATE POLICY "Public read %s" ON %I FOR SELECT USING (true)', tbl, tbl);
            EXECUTE format('
                CREATE POLICY "Admin manage %s" ON %I
                FOR ALL
                USING (public.is_staff_user((select auth.uid())))
                WITH CHECK (public.is_staff_user((select auth.uid())))', tbl, tbl);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update policies for table %: %', tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 13: Fix item_categories and item_prices
-- ============================================================================

DROP POLICY IF EXISTS "Public read item_categories" ON item_categories;
DROP POLICY IF EXISTS "Staff write item_categories" ON item_categories;
CREATE POLICY "Public read item_categories" ON item_categories FOR SELECT USING (true);
CREATE POLICY "Staff manage item_categories" ON item_categories FOR ALL USING (
    public.is_staff_user((select auth.uid()))
);

DROP POLICY IF EXISTS "Public read item_prices" ON item_prices;
DROP POLICY IF EXISTS "Staff write item_prices" ON item_prices;
CREATE POLICY "Public read item_prices" ON item_prices FOR SELECT USING (true);
CREATE POLICY "Staff manage item_prices" ON item_prices FOR ALL USING (
    public.is_staff_user((select auth.uid()))
);

-- ============================================================================
-- Done! 
-- ============================================================================
SELECT 'RLS Performance Migration Complete!' as status;

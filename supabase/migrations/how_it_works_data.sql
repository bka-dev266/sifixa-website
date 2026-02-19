-- Update How It Works content with extended descriptions
-- Run this in Supabase SQL Editor

-- First, delete existing data
DELETE FROM landing_how_it_works_options WHERE id IS NOT NULL;

-- Insert new options with extended descriptions
INSERT INTO landing_how_it_works_options (id, title, icon, description, display_order, is_active) VALUES
(
    gen_random_uuid(),
    'We Come To You',
    'MapPin',
    'Our technician visits your location. Simply book online, and we''ll arrive at your preferred time. Get your device repaired on the spot without leaving your home or office.',
    1,
    true
),
(
    gen_random_uuid(),
    'Pickup & Delivery',
    'Truck',
    'We pick up and deliver back to you. Schedule a convenient pickup time, and our driver will collect your device. Once repaired, we''ll deliver it right to your door.',
    2,
    true
),
(
    gen_random_uuid(),
    'Visit Our Shop',
    'Store',
    'Walk in anytime - no appointment needed. Get a free diagnosis in minutes and have your device repaired while you wait. Most repairs are completed the same day.',
    3,
    true
);

-- Verify the insert
SELECT * FROM landing_how_it_works_options ORDER BY display_order;

-- Clean up duplicate time slots (without deleting referenced ones)
-- Run this in Supabase SQL Editor

-- First, see what time slots exist
SELECT id, name, start_time, end_time, store_id, is_active FROM time_slots ORDER BY name, store_id;

-- Instead of deleting, deactivate the store-specific duplicates
-- Keep only global time slots (store_id IS NULL) active
UPDATE time_slots 
SET is_active = false 
WHERE store_id IS NOT NULL;

-- OR if you want to keep specific ones, deactivate by ID
-- (Replace these IDs with the ones you want to deactivate after viewing the first query)
-- UPDATE time_slots SET is_active = false WHERE id IN ('id1', 'id2', 'id3');

-- Verify only 3 active slots remain
SELECT id, name, start_time, end_time, max_bookings, is_active, store_id 
FROM time_slots 
WHERE is_active = true
ORDER BY start_time;

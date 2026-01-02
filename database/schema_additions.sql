-- ====================================================
-- SIFIXA SCHEMA ADDITIONS
-- Run AFTER sifixa_setup.sql to add missing columns/tables
-- This adds columns needed for full booking/tracking functionality
-- ====================================================

-- ==================== ADD MISSING COLUMNS TO APPOINTMENTS ====================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'regular';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES profiles(id);

-- ==================== CREATE REPAIR TRACKING HISTORY ====================
CREATE TABLE IF NOT EXISTS repair_tracking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_tracking_history_appointment ON repair_tracking_history(appointment_id);

-- RLS for tracking history
ALTER TABLE repair_tracking_history ENABLE ROW LEVEL SECURITY;

-- Public can read tracking history (for customer tracking)
DROP POLICY IF EXISTS "Public read tracking_history" ON repair_tracking_history;
CREATE POLICY "Public read tracking_history" ON repair_tracking_history 
FOR SELECT USING (true);

-- Authenticated can insert tracking history
DROP POLICY IF EXISTS "Authenticated insert tracking_history" ON repair_tracking_history;
CREATE POLICY "Authenticated insert tracking_history" ON repair_tracking_history 
FOR INSERT TO authenticated WITH CHECK (true);

-- Staff can manage all tracking history
DROP POLICY IF EXISTS "Staff manage tracking_history" ON repair_tracking_history;
CREATE POLICY "Staff manage tracking_history" ON repair_tracking_history 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================== ADD MISSING COLUMNS TO STOCK_MOVEMENTS ====================
-- The original schema uses qty, we need to ensure consistency
-- stock_movements already has: item_id, from_location_id, to_location_id, qty, movement_type, reference_type, reference_id, notes, created_by

-- ==================== ADD ITEM_ID TO APPOINTMENTS (for linking services) ====================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id);

-- ==================== UPDATE APPOINTMENT STATUS CONSTRAINT ====================
-- Add 'pending' and 'completed' to allowed statuses
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS valid_appointment_status;
ALTER TABLE appointments ADD CONSTRAINT valid_appointment_status 
    CHECK (status IN ('pending', 'scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'no_show', 'canceled'));

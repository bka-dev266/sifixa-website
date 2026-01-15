-- ============================================
-- SIFIXA Support Tickets System
-- Run this in Supabase SQL Editor
-- ============================================

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'repair', 'billing', 'technical', 'feedback', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Support Ticket Messages (for replies/thread)
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) DEFAULT 'customer' CHECK (sender_type IN ('customer', 'agent', 'system')),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
DROP POLICY IF EXISTS "Customers can view own tickets" ON support_tickets;
CREATE POLICY "Customers can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can create tickets" ON support_tickets;
CREATE POLICY "Customers can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update own tickets" ON support_tickets;
CREATE POLICY "Customers can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = customer_id);

-- RLS Policies for support_ticket_messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON support_ticket_messages;
CREATE POLICY "Users can view messages for their tickets" ON support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = support_ticket_messages.ticket_id 
            AND support_tickets.customer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add messages to their tickets" ON support_ticket_messages;
CREATE POLICY "Users can add messages to their tickets" ON support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = support_ticket_messages.ticket_id 
            AND support_tickets.customer_id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

-- Function to update updated_at on ticket changes
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_support_tickets_timestamp ON support_tickets;
CREATE TRIGGER update_support_tickets_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamp();

SELECT 'Support Tickets tables created successfully!' as message;

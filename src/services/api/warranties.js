// Supabase API - Warranties Module
// Warranty management and claims
import { supabase } from '../supabase';

export const warrantiesApi = {
    // Create warranty for a ticket
    create: async (ticketId, expiresAt, terms = null) => {
        const { data, error } = await supabase
            .from('warranties')
            .insert([{
                ticket_id: ticketId,
                expires_at: expiresAt,
                terms: terms
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            ticketId: data.ticket_id,
            expiresAt: data.expires_at,
            terms: data.terms,
            createdAt: data.created_at
        };
    },

    // Get warranty by ticket
    getByTicket: async (ticketId) => {
        const { data, error } = await supabase
            .from('warranties')
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        if (error) return null;
        return {
            id: data.id,
            ticketId: data.ticket_id,
            expiresAt: data.expires_at,
            terms: data.terms,
            createdAt: data.created_at,
            isExpired: new Date(data.expires_at) < new Date()
        };
    },

    // Get all warranties for a customer
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('warranties')
            .select(`
                *,
                repair_tickets!inner(
                    id,
                    ticket_number,
                    customer_id,
                    devices(brand, model)
                )
            `)
            .eq('repair_tickets.customer_id', customerId)
            .order('expires_at', { ascending: false });

        if (error) return [];

        return data.map(w => ({
            id: w.id,
            ticketId: w.ticket_id,
            ticketNumber: w.repair_tickets?.ticket_number,
            device: w.repair_tickets?.devices ?
                `${w.repair_tickets.devices.brand} ${w.repair_tickets.devices.model}` : 'Unknown',
            expiresAt: w.expires_at,
            terms: w.terms,
            isExpired: new Date(w.expires_at) < new Date()
        }));
    },

    // Check if warranty is valid
    isValid: async (ticketId) => {
        const { data, error } = await supabase
            .from('warranties')
            .select('expires_at')
            .eq('ticket_id', ticketId)
            .single();

        if (error) return false;
        return new Date(data.expires_at) >= new Date();
    },

    // Create warranty claim
    createClaim: async (originalTicketId, claimTicketId, reason = null) => {
        const { data, error } = await supabase
            .from('ticket_warranty_claims')
            .insert([{
                original_ticket_id: originalTicketId,
                claim_ticket_id: claimTicketId,
                reason: reason
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            originalTicketId: data.original_ticket_id,
            claimTicketId: data.claim_ticket_id,
            reason: data.reason,
            createdAt: data.created_at
        };
    },

    // Get claims for a ticket
    getClaims: async (originalTicketId) => {
        const { data, error } = await supabase
            .from('ticket_warranty_claims')
            .select(`
                *,
                claim_ticket:claim_ticket_id(
                    id,
                    ticket_number,
                    status,
                    opened_at
                )
            `)
            .eq('original_ticket_id', originalTicketId)
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map(c => ({
            id: c.id,
            claimTicketId: c.claim_ticket_id,
            claimTicketNumber: c.claim_ticket?.ticket_number,
            claimStatus: c.claim_ticket?.status,
            reason: c.reason,
            createdAt: c.created_at
        }));
    },

    // Get expiring warranties (next N days)
    getExpiring: async (days = 30) => {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('warranties')
            .select(`
                *,
                repair_tickets(
                    ticket_number,
                    customers(first_name, last_name, email, phone),
                    devices(brand, model)
                )
            `)
            .gte('expires_at', today.toISOString().split('T')[0])
            .lte('expires_at', futureDate.toISOString().split('T')[0])
            .order('expires_at');

        if (error) return [];

        return data.map(w => ({
            id: w.id,
            ticketId: w.ticket_id,
            ticketNumber: w.repair_tickets?.ticket_number,
            customer: w.repair_tickets?.customers ?
                `${w.repair_tickets.customers.first_name} ${w.repair_tickets.customers.last_name || ''}`.trim() : null,
            customerEmail: w.repair_tickets?.customers?.email,
            customerPhone: w.repair_tickets?.customers?.phone,
            device: w.repair_tickets?.devices ?
                `${w.repair_tickets.devices.brand} ${w.repair_tickets.devices.model}` : null,
            expiresAt: w.expires_at,
            daysRemaining: Math.ceil((new Date(w.expires_at) - today) / (1000 * 60 * 60 * 24))
        }));
    },

    // Update warranty
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
        if (updates.terms !== undefined) dbUpdates.terms = updates.terms;

        const { data, error } = await supabase
            .from('warranties')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

export default warrantiesApi;

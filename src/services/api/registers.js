// Supabase API - Registers & Shifts Module
// POS register management
import { supabase } from '../supabase';

export const registersApi = {
    // Get all registers
    getAll: async () => {
        const { data, error } = await supabase
            .from('registers')
            .select(`
                *,
                stores(id, name)
            `)
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(r => ({
            id: r.id,
            name: r.name,
            storeId: r.store_id,
            storeName: r.stores?.name,
            isActive: r.is_active,
            createdAt: r.created_at
        }));
    },

    // Get register by ID
    getById: async (id) => {
        const { data, error } = await supabase
            .from('registers')
            .select(`
                *,
                stores(id, name)
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            storeId: data.store_id,
            storeName: data.stores?.name,
            isActive: data.is_active
        };
    },

    // Create register
    create: async (registerData) => {
        const { data, error } = await supabase
            .from('registers')
            .insert([{
                store_id: registerData.storeId,
                name: registerData.name,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ============== SHIFTS ==============

    // Open a new shift
    openShift: async (registerId, openedBy, openingCash = 0) => {
        // Check if there's already an open shift
        const { data: existingShift } = await supabase
            .from('register_shifts')
            .select('id')
            .eq('register_id', registerId)
            .is('closed_at', null)
            .single();

        if (existingShift) {
            throw new Error('There is already an open shift for this register');
        }

        const { data, error } = await supabase
            .from('register_shifts')
            .insert([{
                register_id: registerId,
                opened_by: openedBy,
                opening_cash: openingCash
            }])
            .select(`
                *,
                profiles:opened_by(full_name)
            `)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            registerId: data.register_id,
            openedBy: data.profiles?.full_name,
            openedAt: data.opened_at,
            openingCash: data.opening_cash
        };
    },

    // Close shift
    closeShift: async (shiftId, closedBy, closingCash, notes = null) => {
        // Get shift details for expected cash calculation
        const { data: shift } = await supabase
            .from('register_shifts')
            .select('opening_cash')
            .eq('id', shiftId)
            .single();

        // Calculate expected cash (would need sales/payments data for accuracy)
        const expectedCash = shift?.opening_cash || 0; // Simplified
        const cashDifference = closingCash - expectedCash;

        const { data, error } = await supabase
            .from('register_shifts')
            .update({
                closed_by: closedBy,
                closed_at: new Date().toISOString(),
                closing_cash: closingCash,
                expected_cash: expectedCash,
                cash_difference: cashDifference,
                notes: notes
            })
            .eq('id', shiftId)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            closedAt: data.closed_at,
            closingCash: data.closing_cash,
            expectedCash: data.expected_cash,
            cashDifference: data.cash_difference
        };
    },

    // Get current open shift for a register
    getCurrentShift: async (registerId) => {
        const { data, error } = await supabase
            .from('register_shifts')
            .select(`
                *,
                opened_by_profile:opened_by(full_name)
            `)
            .eq('register_id', registerId)
            .is('closed_at', null)
            .single();

        if (error) return null;
        return {
            id: data.id,
            registerId: data.register_id,
            openedBy: data.opened_by_profile?.full_name,
            openedAt: data.opened_at,
            openingCash: data.opening_cash
        };
    },

    // Get shift by ID
    getShiftById: async (shiftId) => {
        const { data, error } = await supabase
            .from('register_shifts')
            .select(`
                *,
                opened_by_profile:opened_by(full_name),
                closed_by_profile:closed_by(full_name),
                registers(name)
            `)
            .eq('id', shiftId)
            .single();

        if (error) return null;
        return {
            id: data.id,
            registerId: data.register_id,
            registerName: data.registers?.name,
            openedBy: data.opened_by_profile?.full_name,
            openedAt: data.opened_at,
            openingCash: data.opening_cash,
            closedBy: data.closed_by_profile?.full_name,
            closedAt: data.closed_at,
            closingCash: data.closing_cash,
            expectedCash: data.expected_cash,
            cashDifference: data.cash_difference,
            notes: data.notes
        };
    },

    // Get shift history for a register
    getShiftHistory: async (registerId, limit = 10) => {
        const { data, error } = await supabase
            .from('register_shifts')
            .select(`
                *,
                opened_by_profile:opened_by(full_name),
                closed_by_profile:closed_by(full_name)
            `)
            .eq('register_id', registerId)
            .order('opened_at', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data.map(s => ({
            id: s.id,
            openedBy: s.opened_by_profile?.full_name,
            openedAt: s.opened_at,
            closedBy: s.closed_by_profile?.full_name,
            closedAt: s.closed_at,
            openingCash: s.opening_cash,
            closingCash: s.closing_cash,
            cashDifference: s.cash_difference
        }));
    },

    // ============== CASH DRAWER EVENTS ==============

    // Record cash drop
    recordCashDrop: async (shiftId, amount, note, createdBy) => {
        return registersApi.recordCashEvent(shiftId, 'drop', -Math.abs(amount), note, createdBy);
    },

    // Record payout
    recordPayout: async (shiftId, amount, note, createdBy) => {
        return registersApi.recordCashEvent(shiftId, 'payout', -Math.abs(amount), note, createdBy);
    },

    // Add cash
    addCash: async (shiftId, amount, note, createdBy) => {
        return registersApi.recordCashEvent(shiftId, 'add_cash', Math.abs(amount), note, createdBy);
    },

    // Record cash correction
    recordCorrection: async (shiftId, amount, note, createdBy) => {
        return registersApi.recordCashEvent(shiftId, 'correction', amount, note, createdBy);
    },

    // Generic cash event recorder
    recordCashEvent: async (shiftId, eventType, amount, note, createdBy) => {
        const { data, error } = await supabase
            .from('cash_drawer_events')
            .insert([{
                register_shift_id: shiftId,
                event_type: eventType,
                amount: amount,
                note: note,
                created_by: createdBy
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            eventType: data.event_type,
            amount: data.amount,
            note: data.note,
            createdAt: data.created_at
        };
    },

    // Get cash drawer events for a shift
    getCashDrawerEvents: async (shiftId) => {
        const { data, error } = await supabase
            .from('cash_drawer_events')
            .select(`
                *,
                profiles:created_by(full_name)
            `)
            .eq('register_shift_id', shiftId)
            .order('created_at');

        if (error) return [];
        return data.map(e => ({
            id: e.id,
            eventType: e.event_type,
            amount: e.amount,
            note: e.note,
            createdBy: e.profiles?.full_name,
            createdAt: e.created_at
        }));
    }
};

export default registersApi;

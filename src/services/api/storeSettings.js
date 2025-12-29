// Supabase API - Store Settings Module
import { supabase } from '../supabase';

export const storeSettingsApi = {
    // ============== STORES ==============

    // Get all stores
    getStores: async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(s => ({
            id: s.id,
            name: s.name,
            address: s.address,
            phone: s.phone,
            email: s.email,
            timezone: s.timezone,
            isActive: s.is_active,
            createdAt: s.created_at
        }));
    },

    // Get store by ID
    getStoreById: async (id) => {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            address: data.address,
            phone: data.phone,
            email: data.email,
            timezone: data.timezone,
            isActive: data.is_active
        };
    },

    // Update store
    updateStore: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('stores')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create store
    createStore: async (storeData) => {
        const { data, error } = await supabase
            .from('stores')
            .insert([{
                name: storeData.name,
                address: storeData.address || null,
                phone: storeData.phone || null,
                email: storeData.email || null,
                timezone: storeData.timezone || 'America/New_York',
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ============== STORE SETTINGS ==============

    // Get settings for a store
    getSettings: async (storeId) => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('*')
            .eq('store_id', storeId);

        if (error) return {};

        // Convert to key-value object
        return data.reduce((acc, s) => {
            acc[s.setting_key] = s.setting_value;
            return acc;
        }, {});
    },

    // Update a setting
    updateSetting: async (storeId, key, value) => {
        const { data, error } = await supabase
            .from('store_settings')
            .upsert([{
                store_id: storeId,
                setting_key: key,
                setting_value: value
            }], {
                onConflict: 'store_id,setting_key'
            })
            .select()
            .single();

        if (error) throw error;
        return { key: data.setting_key, value: data.setting_value };
    },

    // Update multiple settings
    updateSettings: async (storeId, settings) => {
        const rows = Object.entries(settings).map(([key, value]) => ({
            store_id: storeId,
            setting_key: key,
            setting_value: value
        }));

        const { error } = await supabase
            .from('store_settings')
            .upsert(rows, {
                onConflict: 'store_id,setting_key'
            });

        if (error) throw error;
        return true;
    },

    // ============== TAX RATES ==============

    // Get all tax rates
    getTaxRates: async () => {
        const { data, error } = await supabase
            .from('tax_rates')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(t => ({
            id: t.id,
            name: t.name,
            rate: t.rate,
            isActive: t.is_active,
            createdAt: t.created_at
        }));
    },

    // Create tax rate
    createTaxRate: async (taxData) => {
        const { data, error } = await supabase
            .from('tax_rates')
            .insert([{
                name: taxData.name,
                rate: taxData.rate,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return { id: data.id, name: data.name, rate: data.rate };
    },

    // Update tax rate
    updateTaxRate: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.rate !== undefined) dbUpdates.rate = updates.rate;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('tax_rates')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete tax rate
    deleteTaxRate: async (id) => {
        const { error } = await supabase
            .from('tax_rates')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Assign tax rate to store
    assignTaxToStore: async (storeId, taxRateId) => {
        const { data, error } = await supabase
            .from('store_tax_map')
            .insert([{
                store_id: storeId,
                tax_rate_id: taxRateId
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return { alreadyAssigned: true };
            throw error;
        }
        return data;
    },

    // Get taxes for a store
    getStoreTaxes: async (storeId) => {
        const { data, error } = await supabase
            .from('store_tax_map')
            .select(`
                tax_rate_id,
                tax_rates(id, name, rate)
            `)
            .eq('store_id', storeId);

        if (error) return [];
        return data.map(t => t.tax_rates).filter(Boolean);
    },

    // Remove tax from store
    removeTaxFromStore: async (storeId, taxRateId) => {
        const { error } = await supabase
            .from('store_tax_map')
            .delete()
            .eq('store_id', storeId)
            .eq('tax_rate_id', taxRateId);

        if (error) throw error;
        return true;
    },

    // ============== TIME SLOTS ==============

    // Get time slots for a store
    getTimeSlots: async (storeId = null) => {
        let query = supabase
            .from('time_slots')
            .select('*')
            .order('start_time');

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(s => ({
            id: s.id,
            storeId: s.store_id,
            name: s.name,
            startTime: s.start_time,
            endTime: s.end_time,
            maxBookings: s.max_bookings,
            isActive: s.is_active
        }));
    },

    // Create time slot
    createTimeSlot: async (slotData) => {
        const { data, error } = await supabase
            .from('time_slots')
            .insert([{
                store_id: slotData.storeId,
                name: slotData.name,
                start_time: slotData.startTime,
                end_time: slotData.endTime,
                max_bookings: slotData.maxBookings || 1,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update time slot
    updateTimeSlot: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
        if (updates.maxBookings !== undefined) dbUpdates.max_bookings = updates.maxBookings;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('time_slots')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

export default storeSettingsApi;

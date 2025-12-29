// Supabase API - Services Module (Supabase Only)
import { supabase } from '../supabase';

export const servicesApi = {
    // Get all services (from unified items table)
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('item_type', 'service')
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('name');

            if (error) {
                console.error('Services fetch error:', error);
                return [];
            }

            // Fetch prices for all items
            const itemIds = data.map(i => i.id);
            const { data: prices } = await supabase
                .from('item_prices')
                .select('*')
                .in('item_id', itemIds)
                .order('effective_from', { ascending: false });

            return data.map(s => {
                // Get the latest price for this service
                const latestPrice = prices?.find(p => p.item_id === s.id);
                const price = latestPrice?.price || 0;

                return {
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    price: price,
                    priceMin: price,
                    priceMax: price,
                    category: 'both',
                    active: s.is_active,
                    sku: s.sku
                };
            });
        } catch (err) {
            console.error('Services error:', err);
            return [];
        }
    },

    // Get single service
    getById: async (id) => {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .eq('item_type', 'service')
            .single();
        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            price: 0,
            active: data.is_active,
            sku: data.sku
        };
    },

    // Create service
    create: async (serviceData) => {
        const { data: item, error } = await supabase
            .from('items')
            .insert([{
                item_type: 'service',
                sku: serviceData.sku || `SVC-${Date.now()}`,
                name: serviceData.name,
                description: serviceData.description,
                is_taxable: true,
                is_active: serviceData.active !== false
            }])
            .select()
            .single();
        if (error) throw error;
        return { id: item.id, ...serviceData, active: true };
    },

    // Update service
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.active !== undefined) dbUpdates.is_active = updates.active;

        const { error } = await supabase
            .from('items')
            .update(dbUpdates)
            .eq('id', id);
        if (error) throw error;
        return { id, ...updates };
    },

    // Delete service (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('items')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Toggle service active status
    toggleActive: async (id) => {
        const { data: item } = await supabase
            .from('items')
            .select('is_active')
            .eq('id', id)
            .single();

        const { data, error } = await supabase
            .from('items')
            .update({ is_active: !item?.is_active })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return { id: data.id, active: data.is_active };
    }
};

export default servicesApi;

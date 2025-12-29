// Supabase API - Inventory Module (Supabase Only)
import { supabase } from '../supabase';

export const inventoryApi = {
    // Get all inventory items (parts and products)
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .in('item_type', ['part', 'product'])
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('name');

            if (error) {
                console.error('Inventory fetch error:', error);
                return [];
            }

            return data.map(i => ({
                id: i.id,
                name: i.name,
                sku: i.sku,
                category: i.item_type,
                quantity: 0, // Will get from stock_levels separately if needed
                minStock: 5,
                cost: 0,
                lastRestocked: i.updated_at?.split('T')[0],
                itemType: i.item_type
            }));
        } catch (err) {
            console.error('Inventory error:', err);
            return [];
        }
    },

    // Get single inventory item
    getById: async (id) => {
        const { data, error } = await supabase
            .from('items')
            .select(`
                *,
                item_costs(cost, effective_from),
                stock_levels(qty_on_hand, reorder_point, location_id)
            `)
            .eq('id', id)
            .single();
        if (error) throw error;

        const latestCost = data.item_costs?.sort((a, b) =>
            new Date(b.effective_from) - new Date(a.effective_from)
        )[0];
        const totalQty = data.stock_levels?.reduce((sum, sl) => sum + (sl.qty_on_hand || 0), 0) || 0;

        return {
            id: data.id,
            name: data.name,
            sku: data.sku,
            description: data.description,
            quantity: totalQty,
            minStock: data.stock_levels?.[0]?.reorder_point || 5,
            cost: latestCost?.cost || 0,
            itemType: data.item_type
        };
    },

    // Create inventory item
    create: async (itemData) => {
        // Insert item
        const { data: item, error: itemError } = await supabase
            .from('items')
            .insert([{
                item_type: itemData.itemType || 'part',
                sku: itemData.sku,
                name: itemData.name,
                description: itemData.description || '',
                is_taxable: itemData.itemType === 'product',
                is_active: true,
                track_inventory: true
            }])
            .select()
            .single();
        if (itemError) throw itemError;

        // Insert cost
        if (itemData.cost) {
            await supabase.from('item_costs').insert([{
                item_id: item.id,
                cost: itemData.cost,
                effective_from: new Date().toISOString()
            }]);
        }

        // Get default stock location
        const { data: defaultLocation } = await supabase
            .from('stock_locations')
            .select('id')
            .eq('is_default', true)
            .single();

        if (defaultLocation) {
            await supabase.from('stock_levels').insert([{
                location_id: defaultLocation.id,
                item_id: item.id,
                qty_on_hand: itemData.quantity || 0,
                reorder_point: itemData.minStock || 5
            }]);
        }

        return { id: item.id, ...itemData };
    },

    // Update inventory item
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
        if (updates.description !== undefined) dbUpdates.description = updates.description;

        if (Object.keys(dbUpdates).length > 0) {
            await supabase.from('items').update(dbUpdates).eq('id', id);
        }

        if (updates.cost !== undefined) {
            await supabase.from('item_costs').insert([{
                item_id: id,
                cost: updates.cost,
                effective_from: new Date().toISOString()
            }]);
        }

        if (updates.quantity !== undefined || updates.minStock !== undefined) {
            const { data: existingStock } = await supabase
                .from('stock_levels')
                .select('*')
                .eq('item_id', id)
                .limit(1)
                .single();

            if (existingStock) {
                const stockUpdates = {};
                if (updates.quantity !== undefined) stockUpdates.qty_on_hand = updates.quantity;
                if (updates.minStock !== undefined) stockUpdates.reorder_point = updates.minStock;
                await supabase.from('stock_levels').update(stockUpdates).eq('id', existingStock.id);
            }
        }

        return { id, ...updates };
    },

    // Delete inventory item (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('items')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Adjust stock with audit trail
    adjustStock: async (id, adjustment, reason = 'manual_adjustment') => {
        const { data: stockLevel } = await supabase
            .from('stock_levels')
            .select('*')
            .eq('item_id', id)
            .limit(1)
            .single();

        if (!stockLevel) throw new Error('Stock level not found');

        const newQuantity = Math.max(0, (stockLevel.qty_on_hand || 0) + adjustment);

        await supabase
            .from('stock_levels')
            .update({ qty_on_hand: newQuantity })
            .eq('id', stockLevel.id);

        // Record stock movement for audit
        await supabase.from('stock_movements').insert([{
            location_id: stockLevel.location_id,
            item_id: id,
            movement_type: adjustment > 0 ? 'adjustment_in' : 'adjustment_out',
            qty_change: adjustment,
            note: reason
        }]);

        return { id, quantity: newQuantity };
    },

    // Get low stock alerts
    getLowStockAlerts: async () => {
        const { data, error } = await supabase
            .from('stock_levels')
            .select(`
                *,
                items(id, name, sku)
            `)
            .lt('qty_on_hand', 'reorder_point');
        if (error) throw error;
        return data.map(sl => ({
            id: sl.items.id,
            name: sl.items.name,
            sku: sl.items.sku,
            quantity: sl.qty_on_hand,
            minStock: sl.reorder_point
        }));
    }
};

export default inventoryApi;

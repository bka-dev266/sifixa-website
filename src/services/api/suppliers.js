// Supabase API - Suppliers Module
import { supabase } from '../supabase';

export const suppliersApi = {
    // Get all suppliers
    getAll: async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(s => ({
            id: s.id,
            name: s.name,
            contactName: s.contact_name,
            email: s.email,
            phone: s.phone,
            address: s.address,
            notes: s.notes,
            isActive: s.is_active,
            createdAt: s.created_at
        }));
    },

    // Get supplier by ID
    getById: async (id) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            contactName: data.contact_name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            notes: data.notes,
            isActive: data.is_active,
            createdAt: data.created_at
        };
    },

    // Create supplier
    create: async (supplierData) => {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([{
                name: supplierData.name,
                contact_name: supplierData.contactName || null,
                email: supplierData.email || null,
                phone: supplierData.phone || null,
                address: supplierData.address || null,
                notes: supplierData.notes || null,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            contactName: data.contact_name,
            email: data.email,
            phone: data.phone
        };
    },

    // Update supplier
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('suppliers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete supplier (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('suppliers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get supplier's purchase orders
    getPurchaseOrders: async (supplierId) => {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('id, po_number, status, ordered_at, created_at')
            .eq('supplier_id', supplierId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data;
    },

    // Search suppliers
    search: async (query) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('id, name, email, phone')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) return [];
        return data;
    }
};

export default suppliersApi;

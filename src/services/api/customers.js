// Supabase API - Customers Module (Supabase Only)
// Enhanced with customer_tags and devices relationships
import { supabase } from '../supabase';

export const customersApi = {
    // Get all customers with tags
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    customer_tag_map(
                        tag_id,
                        customer_tags(id, name, color)
                    )
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Customers fetch error:', error);
                return [];
            }

            return data.map(c => ({
                id: c.id,
                name: `${c.first_name} ${c.last_name || ''}`.trim(),
                firstName: c.first_name,
                lastName: c.last_name,
                email: c.email,
                phone: c.phone,
                address: c.address1 || '',
                address1: c.address1,
                address2: c.address2,
                city: c.city,
                state: c.state,
                zip: c.zip,
                notes: c.notes,
                tags: c.customer_tag_map?.map(tm => tm.customer_tags).filter(Boolean) || [],
                userId: c.user_id,
                createdAt: c.created_at
            }));
        } catch (err) {
            console.error('Customers error:', err);
            return [];
        }
    },

    // Get single customer by ID with tags and devices
    getById: async (id) => {
        const { data: customer, error } = await supabase
            .from('customers')
            .select(`
                *,
                customer_tag_map(
                    tag_id,
                    customer_tags(id, name, color)
                ),
                devices(id, device_type, brand, model, color, serial_number, imei)
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address1 || '',
            address1: customer.address1,
            address2: customer.address2,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            notes: customer.notes,
            tags: customer.customer_tag_map?.map(tm => tm.customer_tags).filter(Boolean) || [],
            devices: customer.devices?.map(d => ({
                id: d.id,
                deviceType: d.device_type,
                brand: d.brand,
                model: d.model,
                color: d.color,
                serialNumber: d.serial_number,
                imei: d.imei
            })) || [],
            userId: customer.user_id,
            createdAt: customer.created_at
        };
    },

    // Get customer by email
    getByEmail: async (email) => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .is('deleted_at', null)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: `${data.first_name} ${data.last_name || ''}`.trim(),
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone
        };
    },

    // Create new customer
    create: async (customerData) => {
        let firstName = customerData.firstName || customerData.first_name;
        let lastName = customerData.lastName || customerData.last_name;
        if (!firstName && customerData.name) {
            const parts = customerData.name.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }

        const { data, error } = await supabase
            .from('customers')
            .insert([{
                first_name: firstName,
                last_name: lastName || null,
                email: customerData.email,
                phone: customerData.phone,
                address1: customerData.address1 || customerData.address || null,
                address2: customerData.address2 || null,
                city: customerData.city || null,
                state: customerData.state || null,
                zip: customerData.zip || null,
                notes: customerData.notes || null,
                user_id: customerData.userId || null
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: `${data.first_name} ${data.last_name || ''}`.trim(),
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
            createdAt: data.created_at
        };
    },

    // Update customer
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name) {
            const parts = updates.name.split(' ');
            dbUpdates.first_name = parts[0];
            dbUpdates.last_name = parts.slice(1).join(' ') || null;
        }
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.address1 !== undefined) dbUpdates.address1 = updates.address1;
        if (updates.address2 !== undefined) dbUpdates.address2 = updates.address2;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.state !== undefined) dbUpdates.state = updates.state;
        if (updates.zip !== undefined) dbUpdates.zip = updates.zip;

        const { data, error } = await supabase
            .from('customers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: `${data.first_name} ${data.last_name || ''}`.trim(),
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            notes: data.notes
        };
    },

    // Delete customer (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // ============== TAG MANAGEMENT ==============

    // Get all available tags
    getTags: async () => {
        const { data, error } = await supabase
            .from('customer_tags')
            .select('*')
            .order('name');

        if (error) return [];
        return data.map(t => ({
            id: t.id,
            name: t.name,
            color: t.color
        }));
    },

    // Create a new tag
    createTag: async (tagData) => {
        const { data, error } = await supabase
            .from('customer_tags')
            .insert([{
                name: tagData.name,
                color: tagData.color || '#6366f1'
            }])
            .select()
            .single();

        if (error) throw error;
        return { id: data.id, name: data.name, color: data.color };
    },

    // Add tag to customer
    addTag: async (customerId, tagId) => {
        const { error } = await supabase
            .from('customer_tag_map')
            .insert([{
                customer_id: customerId,
                tag_id: tagId
            }]);

        if (error) {
            // Ignore duplicate key errors
            if (error.code === '23505') return { alreadyTagged: true };
            throw error;
        }
        return { success: true };
    },

    // Remove tag from customer
    removeTag: async (customerId, tagId) => {
        const { error } = await supabase
            .from('customer_tag_map')
            .delete()
            .eq('customer_id', customerId)
            .eq('tag_id', tagId);

        if (error) throw error;
        return true;
    },

    // Get customer's tags
    getCustomerTags: async (customerId) => {
        const { data, error } = await supabase
            .from('customer_tag_map')
            .select(`
                tag_id,
                customer_tags(id, name, color)
            `)
            .eq('customer_id', customerId);

        if (error) return [];
        return data.map(tm => tm.customer_tags).filter(Boolean);
    },

    // Search customers by name, email, or phone
    search: async (query) => {
        const searchTerm = `%${query}%`;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .is('deleted_at', null)
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .limit(20);

        if (error) return [];
        return data.map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name || ''}`.trim(),
            email: c.email,
            phone: c.phone
        }));
    }
};

export default customersApi;

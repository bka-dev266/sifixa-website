// Supabase API - Customer Addresses Module
import { supabase } from '../supabase';

export const addressesApi = {
    /**
     * Get all addresses for a customer
     */
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customerId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get default address for a customer
     */
    getDefault: async (customerId) => {
        const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customerId)
            .eq('is_default', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create a new address
     */
    create: async (customerId, addressData) => {
        // If this is the first address or marked as default, handle default logic
        if (addressData.isDefault) {
            await supabase
                .from('customer_addresses')
                .update({ is_default: false })
                .eq('customer_id', customerId);
        }

        const { data, error } = await supabase
            .from('customer_addresses')
            .insert([{
                customer_id: customerId,
                label: addressData.label || 'Home',
                street_address: addressData.street,
                apt_suite: addressData.aptSuite || null,
                city: addressData.city,
                state: addressData.state,
                zip_code: addressData.zipCode,
                latitude: addressData.latitude || null,
                longitude: addressData.longitude || null,
                is_default: addressData.isDefault || false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an address
     */
    update: async (addressId, addressData) => {
        const updates = {};
        if (addressData.label !== undefined) updates.label = addressData.label;
        if (addressData.street !== undefined) updates.street_address = addressData.street;
        if (addressData.aptSuite !== undefined) updates.apt_suite = addressData.aptSuite;
        if (addressData.city !== undefined) updates.city = addressData.city;
        if (addressData.state !== undefined) updates.state = addressData.state;
        if (addressData.zipCode !== undefined) updates.zip_code = addressData.zipCode;
        if (addressData.latitude !== undefined) updates.latitude = addressData.latitude;
        if (addressData.longitude !== undefined) updates.longitude = addressData.longitude;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('customer_addresses')
            .update(updates)
            .eq('id', addressId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete an address
     */
    delete: async (addressId) => {
        const { error } = await supabase
            .from('customer_addresses')
            .delete()
            .eq('id', addressId);

        if (error) throw error;
        return true;
    },

    /**
     * Set an address as default
     */
    setDefault: async (customerId, addressId) => {
        await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', customerId);

        const { data, error } = await supabase
            .from('customer_addresses')
            .update({ is_default: true })
            .eq('id', addressId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Check if service is available in a ZIP code
     */
    checkServiceAvailability: async (zipCode, serviceType) => {
        const { data, error } = await supabase
            .from('service_areas')
            .select('*')
            .eq('zip_code', zipCode)
            .eq('service_delivery_type', serviceType)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return {
            available: !!data,
            additionalFee: data?.additional_fee || 0
        };
    },

    /**
     * Get service delivery types
     */
    getServiceDeliveryTypes: async () => {
        const { data, error } = await supabase
            .from('service_delivery_types')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) throw error;
        return data || [];
    }
};

export default addressesApi;

// ====================================================
// Repair Services API
// Fetch repair services by device type for booking page
// ====================================================

import { supabase } from '../supabase';

export const repairServicesApi = {
    /**
     * Get all active repair services
     */
    getAll: async () => {
        const { data, error } = await supabase
            .from('repair_services')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Failed to fetch repair services:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get repair services filtered by device type
     * @param {string} deviceType - 'phone', 'tablet', 'computer', 'watch', 'console', 'other'
     */
    getByDeviceType: async (deviceType) => {
        const { data, error } = await supabase
            .from('repair_services')
            .select('*')
            .eq('device_type', deviceType)
            .eq('is_active', true)
            .order('display_order');

        if (error) {
            console.error('Failed to fetch services for device type:', error);
            return [];
        }

        return (data || []).map(service => ({
            id: service.id,
            name: service.name,
            slug: service.slug,
            description: service.description,
            deviceType: service.device_type,
            priceMin: parseFloat(service.price_min) || 0,
            priceMax: parseFloat(service.price_max) || 0,
            priceFixed: service.price_fixed ? parseFloat(service.price_fixed) : null,
            durationEstimate: service.duration_estimate,
            warrantyDays: service.warranty_days,
            icon: service.icon,
            isPopular: service.is_popular
        }));
    },

    /**
     * Get a single service by ID
     */
    getById: async (id) => {
        const { data, error } = await supabase
            .from('repair_services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch service by ID:', error);
            return null;
        }
        return data;
    },

    /**
     * Get popular services (for quick selection)
     * @param {string|null} deviceType - Optional filter by device type
     */
    getPopular: async (deviceType = null) => {
        let query = supabase
            .from('repair_services')
            .select('*')
            .eq('is_active', true)
            .eq('is_popular', true)
            .order('display_order');

        if (deviceType) {
            query = query.eq('device_type', deviceType);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Failed to fetch popular services:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get all device types that have active services
     */
    getDeviceTypes: async () => {
        const { data, error } = await supabase
            .from('repair_services')
            .select('device_type')
            .eq('is_active', true);

        if (error) {
            console.error('Failed to fetch device types:', error);
            return [];
        }

        // Get unique device types
        const types = [...new Set((data || []).map(d => d.device_type))];
        return types;
    }
};

export default repairServicesApi;

// ====================================================
// Repair Services API
// Fetch repair services by device type for booking page
// ====================================================

import { supabase } from '../supabase';

// Fallback services when database is unavailable
const FALLBACK_SERVICES = {
    phone: [
        { id: 'fb-phone-1', name: 'Screen Replacement', description: 'Cracked or broken screen repair', priceMin: 79, priceMax: 299, durationEstimate: 60, warrantyDays: 90 },
        { id: 'fb-phone-2', name: 'Battery Replacement', description: 'Battery health restoration', priceMin: 49, priceMax: 99, durationEstimate: 30, warrantyDays: 365 },
        { id: 'fb-phone-3', name: 'Charging Port Repair', description: 'Fix loose or broken charging', priceMin: 59, priceMax: 99, durationEstimate: 45, warrantyDays: 90 },
    ],
    tablet: [
        { id: 'fb-tablet-1', name: 'Screen Replacement', description: 'Cracked screen repair', priceMin: 99, priceMax: 399, durationEstimate: 90, warrantyDays: 90 },
        { id: 'fb-tablet-2', name: 'Battery Replacement', description: 'Battery replacement', priceMin: 79, priceMax: 149, durationEstimate: 60, warrantyDays: 365 },
    ],
    computer: [
        { id: 'fb-comp-1', name: 'Virus Removal', description: 'Malware and virus cleanup', priceMin: 49, priceMax: 99, durationEstimate: 60, warrantyDays: 30 },
        { id: 'fb-comp-2', name: 'Screen Replacement', description: 'Laptop screen repair', priceMin: 149, priceMax: 399, durationEstimate: 120, warrantyDays: 90 },
        { id: 'fb-comp-3', name: 'Data Recovery', description: 'Recover lost files', priceMin: 99, priceMax: 299, durationEstimate: 120, warrantyDays: 0 },
    ]
};

const getFallbackServices = (deviceType) => {
    const services = FALLBACK_SERVICES[deviceType] || FALLBACK_SERVICES.phone;
    return services.map(s => ({
        ...s,
        deviceType,
        slug: s.name.toLowerCase().replace(/\s+/g, '-'),
        isPopular: false,
        priceFixed: null,
        icon: null
    }));
};

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
        // Timeout wrapper to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        try {
            const queryPromise = supabase
                .from('repair_services')
                .select('*')
                .eq('device_type', deviceType)
                .eq('is_active', true)
                .order('display_order');

            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            if (error) {
                console.error('Failed to fetch services for device type:', error);
                return getFallbackServices(deviceType);
            }

            if (!data || data.length === 0) {
                console.warn('No services found for device type:', deviceType);
                return getFallbackServices(deviceType);
            }

            return data.map(service => ({
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
        } catch (err) {
            console.error('Service fetch timeout or error:', err.message);
            return getFallbackServices(deviceType);
        }
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

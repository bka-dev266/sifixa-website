// Supabase API - Devices Module
// Manages customer devices (phones, tablets, laptops, etc.)
import { supabase } from '../supabase';

export const devicesApi = {
    // Get all devices for a customer
    getByCustomer: async (customerId) => {
        try {
            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Devices fetch error:', error);
                return [];
            }

            return data.map(d => ({
                id: d.id,
                customerId: d.customer_id,
                deviceType: d.device_type,
                brand: d.brand,
                model: d.model,
                color: d.color,
                serialNumber: d.serial_number,
                imei: d.imei,
                passcodeProvided: d.passcode_provided,
                conditionNotes: d.condition_notes,
                createdAt: d.created_at
            }));
        } catch (err) {
            console.error('Devices error:', err);
            return [];
        }
    },

    // Get single device by ID
    getById: async (id) => {
        const { data, error } = await supabase
            .from('devices')
            .select(`
                *,
                customers(id, first_name, last_name, email, phone)
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            customerId: data.customer_id,
            deviceType: data.device_type,
            brand: data.brand,
            model: data.model,
            color: data.color,
            serialNumber: data.serial_number,
            imei: data.imei,
            passcodeProvided: data.passcode_provided,
            conditionNotes: data.condition_notes,
            createdAt: data.created_at,
            customer: data.customers ? {
                id: data.customers.id,
                name: `${data.customers.first_name} ${data.customers.last_name || ''}`.trim(),
                email: data.customers.email,
                phone: data.customers.phone
            } : null
        };
    },

    // Create new device
    create: async (deviceData) => {
        const { data, error } = await supabase
            .from('devices')
            .insert([{
                customer_id: deviceData.customerId,
                device_type: deviceData.deviceType || 'phone',
                brand: deviceData.brand || null,
                model: deviceData.model || null,
                color: deviceData.color || null,
                serial_number: deviceData.serialNumber || null,
                imei: deviceData.imei || null,
                passcode_provided: deviceData.passcodeProvided || false,
                condition_notes: deviceData.conditionNotes || null
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            customerId: data.customer_id,
            deviceType: data.device_type,
            brand: data.brand,
            model: data.model,
            color: data.color,
            serialNumber: data.serial_number,
            imei: data.imei,
            passcodeProvided: data.passcode_provided,
            conditionNotes: data.condition_notes,
            createdAt: data.created_at
        };
    },

    // Update device
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.deviceType !== undefined) dbUpdates.device_type = updates.deviceType;
        if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
        if (updates.model !== undefined) dbUpdates.model = updates.model;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
        if (updates.imei !== undefined) dbUpdates.imei = updates.imei;
        if (updates.passcodeProvided !== undefined) dbUpdates.passcode_provided = updates.passcodeProvided;
        if (updates.conditionNotes !== undefined) dbUpdates.condition_notes = updates.conditionNotes;

        const { data, error } = await supabase
            .from('devices')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            customerId: data.customer_id,
            deviceType: data.device_type,
            brand: data.brand,
            model: data.model,
            color: data.color,
            serialNumber: data.serial_number,
            imei: data.imei,
            passcodeProvided: data.passcode_provided,
            conditionNotes: data.condition_notes
        };
    },

    // Delete device
    delete: async (id) => {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get device types (for dropdown)
    getDeviceTypes: () => {
        return [
            { value: 'phone', label: 'Phone' },
            { value: 'tablet', label: 'Tablet' },
            { value: 'laptop', label: 'Laptop' },
            { value: 'desktop', label: 'Desktop' },
            { value: 'watch', label: 'Smart Watch' },
            { value: 'console', label: 'Game Console' },
            { value: 'other', label: 'Other' }
        ];
    }
};

export default devicesApi;

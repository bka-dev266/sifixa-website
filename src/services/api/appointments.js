// Supabase API - Appointments Module
// Enhanced with devices and time_slots linking
import { supabase } from '../supabase';

export const appointmentsApi = {
    // Get all appointments with customer, device, and time slot details
    getAll: async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    customers(id, first_name, last_name, email, phone),
                    devices(id, device_type, brand, model),
                    time_slots(id, name, start_time, end_time)
                `)
                .order('scheduled_date', { ascending: false });

            if (error) {
                console.error('Appointments fetch error:', error);
                return [];
            }

            return data.map(a => ({
                id: a.id,
                trackingNumber: a.id?.slice(0, 8).toUpperCase() || 'N/A',
                customerId: a.customer_id,
                customer: a.customers ? {
                    id: a.customers.id,
                    name: `${a.customers.first_name} ${a.customers.last_name || ''}`.trim(),
                    email: a.customers.email,
                    phone: a.customers.phone
                } : null,
                deviceId: a.device_id,
                device: a.devices ? {
                    id: a.devices.id,
                    type: a.devices.device_type,
                    name: `${a.devices.brand || ''} ${a.devices.model || ''}`.trim() || 'Unknown Device'
                } : null,
                timeSlotId: a.time_slot_id,
                timeSlot: a.time_slots ? {
                    id: a.time_slots.id,
                    name: a.time_slots.name,
                    startTime: a.time_slots.start_time,
                    endTime: a.time_slots.end_time
                } : null,
                scheduledDate: a.scheduled_date,
                scheduledStart: a.scheduled_start,
                scheduledEnd: a.scheduled_end,
                status: a.status,
                notes: a.notes,
                createdAt: a.created_at
            }));
        } catch (err) {
            console.error('Appointments error:', err);
            return [];
        }
    },

    // Get appointment by ID with full details
    getById: async (id) => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customers(id, first_name, last_name, email, phone),
                devices(id, device_type, brand, model, color, serial_number),
                time_slots(id, name, start_time, end_time)
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            customerId: data.customer_id,
            customer: data.customers ? {
                id: data.customers.id,
                name: `${data.customers.first_name} ${data.customers.last_name || ''}`.trim(),
                email: data.customers.email,
                phone: data.customers.phone
            } : null,
            deviceId: data.device_id,
            device: data.devices ? {
                id: data.devices.id,
                type: data.devices.device_type,
                brand: data.devices.brand,
                model: data.devices.model,
                color: data.devices.color,
                serialNumber: data.devices.serial_number
            } : null,
            timeSlotId: data.time_slot_id,
            timeSlot: data.time_slots,
            scheduledDate: data.scheduled_date,
            scheduledStart: data.scheduled_start,
            scheduledEnd: data.scheduled_end,
            status: data.status,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    // Create appointment
    create: async (appointmentData) => {
        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                customer_id: appointmentData.customerId,
                device_id: appointmentData.deviceId || null,
                time_slot_id: appointmentData.timeSlotId || null,
                scheduled_date: appointmentData.scheduledDate,
                scheduled_start: appointmentData.scheduledStart || null,
                scheduled_end: appointmentData.scheduledEnd || null,
                status: 'scheduled',
                notes: appointmentData.notes || null
            }])
            .select(`
                *,
                customers(id, first_name, last_name),
                devices(id, device_type, brand, model)
            `)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            customerId: data.customer_id,
            customer: data.customers ? {
                id: data.customers.id,
                name: `${data.customers.first_name} ${data.customers.last_name || ''}`.trim()
            } : null,
            deviceId: data.device_id,
            device: data.devices,
            scheduledDate: data.scheduled_date,
            status: data.status,
            createdAt: data.created_at
        };
    },

    // Update appointment
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
        if (updates.scheduledStart !== undefined) dbUpdates.scheduled_start = updates.scheduledStart;
        if (updates.scheduledEnd !== undefined) dbUpdates.scheduled_end = updates.scheduledEnd;
        if (updates.deviceId !== undefined) dbUpdates.device_id = updates.deviceId;
        if (updates.timeSlotId !== undefined) dbUpdates.time_slot_id = updates.timeSlotId;

        const { data, error } = await supabase
            .from('appointments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update status only
    updateStatus: async (id, status) => {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Cancel appointment
    cancel: async (id) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'canceled' })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Confirm appointment
    confirm: async (id) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Mark as arrived
    markArrived: async (id) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'arrived' })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Mark as no-show
    markNoShow: async (id) => {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'no_show' })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Get appointments by customer
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                devices(id, device_type, brand, model),
                time_slots(id, name, start_time, end_time)
            `)
            .eq('customer_id', customerId)
            .order('scheduled_date', { ascending: false });

        if (error) return [];
        return data.map(a => ({
            id: a.id,
            deviceId: a.device_id,
            device: a.devices,
            timeSlot: a.time_slots,
            scheduledDate: a.scheduled_date,
            scheduledStart: a.scheduled_start,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at
        }));
    },

    // Get appointments for a specific date
    getByDate: async (date) => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customers(id, first_name, last_name, phone),
                devices(id, device_type, brand, model),
                time_slots(id, name, start_time, end_time)
            `)
            .eq('scheduled_date', date)
            .order('scheduled_start');

        if (error) return [];
        return data;
    },

    // Get available time slots for a date
    getAvailableSlots: async (date, storeId = null) => {
        // Get all time slots
        let query = supabase
            .from('time_slots')
            .select('*')
            .eq('is_active', true);

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        const { data: slots, error: slotsError } = await query;
        if (slotsError) return [];

        // Get bookings for the date
        const { data: bookings, error: bookingsError } = await supabase
            .from('appointments')
            .select('time_slot_id')
            .eq('scheduled_date', date)
            .neq('status', 'canceled');

        if (bookingsError) return slots;

        // Count bookings per slot
        const bookingCounts = {};
        bookings.forEach(b => {
            if (b.time_slot_id) {
                bookingCounts[b.time_slot_id] = (bookingCounts[b.time_slot_id] || 0) + 1;
            }
        });

        // Return slots with availability
        return slots.map(slot => ({
            id: slot.id,
            name: slot.name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            maxBookings: slot.max_bookings,
            currentBookings: bookingCounts[slot.id] || 0,
            available: (bookingCounts[slot.id] || 0) < slot.max_bookings
        }));
    },

    /**
     * Get time slot availability for a specific date with detailed capacity info
     * Returns slots with remaining capacity and availability level indicators
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string|null} storeId - Optional store ID
     */
    getSlotAvailability: async (date, storeId = null) => {
        // Get all active time slots
        let slotsQuery = supabase
            .from('time_slots')
            .select('*')
            .eq('is_active', true);

        if (storeId) {
            slotsQuery = slotsQuery.eq('store_id', storeId);
        }

        const { data: slots, error: slotsError } = await slotsQuery;
        if (slotsError) {
            console.error('Failed to fetch time slots:', slotsError);
            return [];
        }

        // Get bookings for the date (exclude canceled and no_show)
        const { data: bookings, error: bookingsError } = await supabase
            .from('appointments')
            .select('time_slot_id')
            .eq('scheduled_date', date)
            .not('status', 'in', '("canceled", "no_show")');

        if (bookingsError) {
            console.error('Failed to fetch bookings:', bookingsError);
            // Return slots without booking counts if query fails
            return (slots || []).map(slot => ({
                id: slot.id,
                name: slot.name,
                startTime: slot.start_time,
                endTime: slot.end_time,
                maxBookings: slot.max_bookings || 3,
                currentBookings: 0,
                remainingSlots: slot.max_bookings || 3,
                isAvailable: true,
                availabilityLevel: 'available'
            }));
        }

        // Count bookings per slot
        const bookingCounts = {};
        (bookings || []).forEach(b => {
            if (b.time_slot_id) {
                bookingCounts[b.time_slot_id] = (bookingCounts[b.time_slot_id] || 0) + 1;
            }
        });

        // Return slots with detailed availability info
        return (slots || []).map(slot => {
            const maxBookings = slot.max_bookings || 3;
            const currentBookings = bookingCounts[slot.id] || 0;
            const remaining = maxBookings - currentBookings;

            let availabilityLevel = 'available';
            if (remaining === 0) {
                availabilityLevel = 'full';
            } else if (remaining === 1) {
                availabilityLevel = 'limited';
            }

            return {
                id: slot.id,
                name: slot.name,
                startTime: slot.start_time,
                endTime: slot.end_time,
                maxBookings: maxBookings,
                currentBookings: currentBookings,
                remainingSlots: remaining,
                isAvailable: remaining > 0,
                availabilityLevel: availabilityLevel
            };
        });
    },

    // Get today's appointments
    getToday: async () => {
        const today = new Date().toISOString().split('T')[0];
        return appointmentsApi.getByDate(today);
    },

    // Get upcoming appointments (next 7 days)
    getUpcoming: async () => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customers(id, first_name, last_name, phone),
                devices(id, device_type, brand, model)
            `)
            .gte('scheduled_date', today.toISOString().split('T')[0])
            .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
            .in('status', ['scheduled', 'confirmed'])
            .order('scheduled_date')
            .order('scheduled_start');

        if (error) return [];
        return data;
    }
};

export default appointmentsApi;

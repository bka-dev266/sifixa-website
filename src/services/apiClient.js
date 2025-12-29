// ====================================================
// SIFIXA API Client
// Clean abstraction layer for all database operations
// Uses Supabase RPC functions for transactions
// ====================================================

import { supabase } from './supabase';

// ==================== BOOKINGS API ====================
export const bookingsApi = {
    /**
     * Create a new booking with proper transaction
     * Creates customer (if needed) + device + appointment
     */
    create: async (bookingData) => {
        const { data, error } = await supabase.rpc('create_booking', {
            p_customer_name: bookingData.customer?.name || bookingData.customerName,
            p_customer_email: bookingData.customer?.email || bookingData.customerEmail,
            p_customer_phone: bookingData.customer?.phone || bookingData.customerPhone,
            p_device_type: bookingData.device?.type || bookingData.deviceType || 'phone',
            p_device_brand: bookingData.device?.brand || bookingData.deviceBrand || null,
            p_device_model: bookingData.device?.model || bookingData.deviceModel || null,
            p_scheduled_date: bookingData.date || bookingData.scheduledDate,
            p_time_slot_id: bookingData.timeSlotId || null,
            p_issue: bookingData.issue || bookingData.notes || null,
            p_priority: bookingData.priorityLevel || bookingData.priority || 'regular',
            p_store_id: bookingData.storeId || null
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Get all bookings with optional filters
     */
    list: async (filters = {}) => {
        const { data, error } = await supabase.rpc('search_bookings', {
            p_search: filters.search || null,
            p_status: filters.status || null,
            p_date_from: filters.dateFrom || null,
            p_date_to: filters.dateTo || null,
            p_store_id: filters.storeId || null,
            p_limit: filters.limit || 50,
            p_offset: filters.offset || 0
        });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get single booking by ID
     */
    getById: async (id) => {
        const { data, error } = await supabase.rpc('get_booking', {
            p_booking_id: id
        });

        if (error) throw error;
        return data;
    },

    /**
     * Update booking status
     */
    updateStatus: async (id, status, notes = null) => {
        const { data, error } = await supabase.rpc('update_booking_status', {
            p_booking_id: id,
            p_new_status: status,
            p_notes: notes
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Cancel/void a booking
     */
    void: async (id, reason = null) => {
        const { data, error } = await supabase.rpc('void_booking', {
            p_booking_id: id,
            p_reason: reason
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Update booking details (reschedule, notes, etc.)
     */
    update: async (id, updates) => {
        // For simple updates, use direct table update
        const dbUpdates = {};
        if (updates.scheduledDate) dbUpdates.scheduled_date = updates.scheduledDate;
        if (updates.scheduledStart) dbUpdates.scheduled_start = updates.scheduledStart;
        if (updates.timeSlotId) dbUpdates.time_slot_id = updates.timeSlotId;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.status) dbUpdates.status = updates.status;
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('appointments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== CUSTOMERS API ====================
export const customersApi = {
    /**
     * Create a new customer
     */
    create: async (customerData) => {
        const { data, error } = await supabase.rpc('create_customer', {
            p_first_name: customerData.firstName || customerData.name?.split(' ')[0],
            p_last_name: customerData.lastName || customerData.name?.split(' ').slice(1).join(' ') || null,
            p_email: customerData.email || null,
            p_phone: customerData.phone || null,
            p_address1: customerData.address1 || customerData.address || null,
            p_city: customerData.city || null,
            p_state: customerData.state || null,
            p_zip: customerData.zip || null,
            p_notes: customerData.notes || null
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Search/list customers
     */
    list: async (filters = {}) => {
        const { data, error } = await supabase.rpc('search_customers', {
            p_search: filters.search || null,
            p_limit: filters.limit || 50,
            p_offset: filters.offset || 0
        });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get customer by ID (from view)
     */
    getById: async (id) => {
        const { data, error } = await supabase
            .from('customers_view')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update customer
     */
    update: async (id, updates) => {
        const { data, error } = await supabase.rpc('update_customer', {
            p_customer_id: id,
            p_first_name: updates.firstName || null,
            p_last_name: updates.lastName || null,
            p_email: updates.email || null,
            p_phone: updates.phone || null,
            p_address1: updates.address1 || null,
            p_city: updates.city || null,
            p_state: updates.state || null,
            p_zip: updates.zip || null,
            p_notes: updates.notes || null
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Delete customer (soft delete)
     */
    delete: async (id) => {
        const { error } = await supabase
            .from('customers')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }
};

// ==================== INVENTORY API ====================
export const inventoryApi = {
    /**
     * List inventory items
     */
    list: async (filters = {}) => {
        let query = supabase
            .from('inventory_view')
            .select('*')
            .eq('is_active', true);

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
        }

        if (filters.lowStock) {
            query = query.lt('total_stock', 10); // Threshold
        }

        if (filters.itemType) {
            query = query.eq('item_type', filters.itemType);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get item by ID
     */
    getById: async (id) => {
        const { data, error } = await supabase
            .from('inventory_view')
            .select('*')
            .eq('item_id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Adjust stock level
     */
    adjust: async (itemId, qtyChange, reason = null) => {
        const { data, error } = await supabase.rpc('adjust_inventory', {
            p_item_id: itemId,
            p_qty_change: qtyChange,
            p_reason: reason
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        return data;
    },

    /**
     * Create new item
     */
    create: async (itemData) => {
        const { data, error } = await supabase
            .from('items')
            .insert([{
                item_type: itemData.itemType || 'product',
                sku: itemData.sku || `ITM-${Date.now()}`,
                name: itemData.name,
                description: itemData.description || null,
                is_taxable: itemData.isTaxable !== false,
                is_active: true,
                track_inventory: itemData.trackInventory !== false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update item
     */
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('items')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== TIME SLOTS API ====================
export const timeSlotsApi = {
    /**
     * Get available time slots
     */
    list: async (storeId = null) => {
        let query = supabase
            .from('time_slots')
            .select('*')
            .eq('is_active', true)
            .order('start_time');

        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map(slot => ({
            id: slot.id,
            name: slot.name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            maxBookings: slot.max_bookings,
            active: slot.is_active
        }));
    },

    /**
     * Check availability for a date
     */
    getAvailability: async (date, storeId = null) => {
        const slots = await timeSlotsApi.list(storeId);

        // Get bookings for the date
        const { data: bookings } = await supabase
            .from('appointments')
            .select('time_slot_id')
            .eq('scheduled_date', date)
            .neq('status', 'canceled');

        // Count bookings per slot
        const bookingCounts = {};
        (bookings || []).forEach(b => {
            if (b.time_slot_id) {
                bookingCounts[b.time_slot_id] = (bookingCounts[b.time_slot_id] || 0) + 1;
            }
        });

        return slots.map(slot => ({
            ...slot,
            currentBookings: bookingCounts[slot.id] || 0,
            available: (bookingCounts[slot.id] || 0) < slot.maxBookings
        }));
    }
};

// ==================== SERVICES API ====================
export const servicesApi = {
    /**
     * List all active services
     */
    list: async () => {
        const { data, error } = await supabase
            .from('items')
            .select(`
                id,
                sku,
                name,
                description,
                is_active,
                item_prices(price, effective_from)
            `)
            .eq('item_type', 'service')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');

        if (error) throw error;

        return (data || []).map(s => {
            const latestPrice = s.item_prices?.sort((a, b) =>
                new Date(b.effective_from) - new Date(a.effective_from)
            )[0];

            return {
                id: s.id,
                sku: s.sku,
                name: s.name,
                description: s.description,
                price: latestPrice?.price || 0,
                priceMin: latestPrice?.price || 0,
                priceMax: latestPrice?.price || 0,
                active: s.is_active
            };
        });
    },

    /**
     * Get service by ID
     */
    getById: async (id) => {
        const { data, error } = await supabase
            .from('items')
            .select('*, item_prices(price, effective_from)')
            .eq('id', id)
            .eq('item_type', 'service')
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== STORES API ====================
export const storesApi = {
    /**
     * Get active stores
     */
    list: async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get default store
     */
    getDefault: async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== DEVICES API ====================
export const devicesApi = {
    /**
     * Get devices for a customer
     */
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            customerId: d.customer_id,
            deviceType: d.device_type,
            brand: d.brand,
            model: d.model,
            color: d.color,
            serialNumber: d.serial_number,
            imei: d.imei,
            createdAt: d.created_at
        }));
    },

    /**
     * Create device
     */
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
                imei: deviceData.imei || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ==================== MESSAGES API ====================
export const messagesApi = {
    /**
     * Submit a contact form message
     */
    create: async (messageData) => {
        // First, try to find or create customer
        let customerId = null;
        if (messageData.email) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('email', messageData.email)
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create a new customer
                const nameParts = (messageData.name || '').split(' ');
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert([{
                        first_name: nameParts[0] || 'Unknown',
                        last_name: nameParts.slice(1).join(' ') || null,
                        email: messageData.email
                    }])
                    .select()
                    .single();
                customerId = newCustomer?.id;
            }
        }

        // Create conversation and message
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert([{
                customer_id: customerId,
                subject: messageData.subject || 'Contact Form Submission',
                status: 'open'
            }])
            .select()
            .single();

        if (convError) throw convError;

        const { data: message, error: msgError } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversation.id,
                sender_type: 'customer',
                sender_id: customerId,
                channel: 'in_app',
                subject: messageData.subject,
                body: messageData.message,
                status: 'sent',
                sent_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (msgError) throw msgError;

        return {
            success: true,
            conversationId: conversation.id,
            messageId: message.id
        };
    },

    /**
     * Get messages for a customer
     */
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                messages(*)
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

// ==================== SELL DEVICE API ====================
export const sellDeviceApi = {
    /**
     * Submit a device for sale/trade-in
     */
    submit: async (deviceData) => {
        // Find or create customer
        let customerId = null;
        if (deviceData.email) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('email', deviceData.email)
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const nameParts = (deviceData.name || '').split(' ');
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert([{
                        first_name: nameParts[0] || 'Unknown',
                        last_name: nameParts.slice(1).join(' ') || null,
                        email: deviceData.email,
                        phone: deviceData.phone
                    }])
                    .select()
                    .single();
                customerId = newCustomer?.id;
            }
        }

        // Create device record
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .insert([{
                customer_id: customerId,
                device_type: deviceData.deviceType || 'phone',
                brand: deviceData.brand || null,
                model: deviceData.model || null,
                condition_notes: `Condition: ${deviceData.condition}\nStorage: ${deviceData.storage || 'N/A'}\nNotes: ${deviceData.notes || 'None'}\nEstimated Value: $${deviceData.estimatedPrice || 0}`
            }])
            .select()
            .single();

        if (deviceError) throw deviceError;

        // Create a notification event for staff
        await supabase
            .from('notification_events')
            .insert([{
                customer_id: customerId,
                type: 'system',
                title: 'Device Trade-In Request',
                message: `${deviceData.name} wants to sell their ${deviceData.brand} ${deviceData.model}. Estimated value: $${deviceData.estimatedPrice}`
            }]);

        return {
            success: true,
            deviceId: device.id,
            customerId: customerId,
            estimatedPrice: deviceData.estimatedPrice
        };
    }
};

// ==================== UNIFIED API EXPORT ====================
export const api = {
    bookings: bookingsApi,
    customers: customersApi,
    inventory: inventoryApi,
    timeSlots: timeSlotsApi,
    services: servicesApi,
    stores: storesApi,
    devices: devicesApi,
    messages: messagesApi,
    sellDevice: sellDeviceApi
};

export default api;

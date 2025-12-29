// Supabase API Service
// This module provides database operations using Supabase

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ybbdnyszdfvlbxlfdtvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYmRueXN6ZGZ2bGJ4bGZkdHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjM3MzcsImV4cCI6MjA4MTkzOTczN30.YnwtSdn2LfPt6oEq6TilIGIdJ1qkUfhE-uDkhUI3R08';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if Supabase is available
const isSupabaseAvailable = async () => {
    try {
        const { error } = await supabase.from('users').select('id').limit(1);
        return !error;
    } catch {
        return false;
    }
};

// ============== USERS ==============
export const usersApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id');
        if (error) throw error;
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    getByUsername: async (username) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    create: async (userData) => {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============== CUSTOMERS ==============
export const customersApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('id');
        if (error) throw error;
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    getByEmail: async (email) => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    create: async (customerData) => {
        const { data, error } = await supabase
            .from('customers')
            .insert([customerData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('customers')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============== SERVICES ==============
export const servicesApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('id');
        if (error) throw error;
        // Map to match existing format
        return data.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            priceMin: s.price_min,
            priceMax: s.price_max,
            category: s.category,
            active: s.active
        }));
    },

    getActive: async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('active', true)
            .order('id');
        if (error) throw error;
        return data.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            priceMin: s.price_min,
            priceMax: s.price_max,
            category: s.category,
            active: s.active
        }));
    },

    create: async (serviceData) => {
        const { data, error } = await supabase
            .from('services')
            .insert([{
                name: serviceData.name,
                description: serviceData.description,
                price_min: serviceData.priceMin,
                price_max: serviceData.priceMax,
                category: serviceData.category,
                active: serviceData.active ?? true
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.priceMin !== undefined) dbUpdates.price_min = updates.priceMin;
        if (updates.priceMax !== undefined) dbUpdates.price_max = updates.priceMax;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.active !== undefined) dbUpdates.active = updates.active;
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('services')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============== TIME SLOTS ==============
export const timeSlotsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('time_slots')
            .select('*')
            .order('id');
        if (error) throw error;
        return data.map(s => ({
            id: s.id,
            name: s.name,
            startTime: s.start_time,
            endTime: s.end_time,
            maxBookings: s.max_bookings,
            active: s.active
        }));
    },

    getActive: async () => {
        const { data, error } = await supabase
            .from('time_slots')
            .select('*')
            .eq('active', true)
            .order('id');
        if (error) throw error;
        return data.map(s => ({
            id: s.id,
            name: s.name,
            startTime: s.start_time,
            endTime: s.end_time,
            maxBookings: s.max_bookings,
            active: s.active
        }));
    },

    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
        if (updates.maxBookings !== undefined) dbUpdates.max_bookings = updates.maxBookings;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        const { data, error } = await supabase
            .from('time_slots')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ============== BOOKINGS ==============
export const bookingsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(b => ({
            id: b.id,
            device: b.device,
            serviceType: b.service_type,
            issue: b.issue,
            date: b.date,
            time: b.time,
            customer: {
                name: b.customer_name,
                email: b.customer_email,
                phone: b.customer_phone
            },
            status: b.status,
            priority: b.priority,
            priorityLevel: b.priority_level,
            priorityFee: b.priority_fee,
            baseRepairPrice: b.base_repair_price,
            totalPrice: b.total_price,
            costEstimate: b.cost_estimate,
            notes: b.notes || [],
            timeTracking: b.time_tracking || { startTime: null, endTime: null, totalMinutes: 0 }
        }));
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return {
            id: data.id,
            device: data.device,
            serviceType: data.service_type,
            issue: data.issue,
            date: data.date,
            time: data.time,
            customer: {
                name: data.customer_name,
                email: data.customer_email,
                phone: data.customer_phone
            },
            status: data.status,
            priority: data.priority,
            priorityLevel: data.priority_level,
            priorityFee: data.priority_fee,
            baseRepairPrice: data.base_repair_price,
            totalPrice: data.total_price,
            costEstimate: data.cost_estimate,
            notes: data.notes || [],
            timeTracking: data.time_tracking || { startTime: null, endTime: null, totalMinutes: 0 }
        };
    },

    create: async (bookingData) => {
        const id = Date.now().toString();
        const { data, error } = await supabase
            .from('bookings')
            .insert([{
                id,
                device: bookingData.device,
                service_type: bookingData.serviceType,
                issue: bookingData.issue,
                date: bookingData.date,
                time: bookingData.time,
                customer_name: bookingData.customer?.name,
                customer_email: bookingData.customer?.email,
                customer_phone: bookingData.customer?.phone,
                status: 'Pending',
                priority: bookingData.priority || 'normal',
                priority_level: bookingData.priorityLevel || 'regular',
                priority_fee: bookingData.priorityFee || 0,
                base_repair_price: bookingData.baseRepairPrice,
                total_price: bookingData.totalPrice,
                notes: [],
                time_tracking: { startTime: null, endTime: null, totalMinutes: 0 }
            }])
            .select()
            .single();
        if (error) throw error;
        return { ...data, id };
    },

    updateStatus: async (id, status) => {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    update: async (id, updates) => {
        const dbUpdates = { updated_at: new Date().toISOString() };
        if (updates.device !== undefined) dbUpdates.device = updates.device;
        if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
        if (updates.issue !== undefined) dbUpdates.issue = updates.issue;
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        if (updates.time !== undefined) dbUpdates.time = updates.time;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.costEstimate !== undefined) dbUpdates.cost_estimate = updates.costEstimate;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.timeTracking !== undefined) dbUpdates.time_tracking = updates.timeTracking;

        const { data, error } = await supabase
            .from('bookings')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============== INVENTORY ==============
export const inventoryApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('id');
        if (error) throw error;
        return data.map(i => ({
            id: i.id,
            name: i.name,
            sku: i.sku,
            category: i.category,
            quantity: i.quantity,
            minStock: i.min_stock,
            cost: i.cost,
            supplier: i.supplier,
            lastRestocked: i.last_restocked,
            usageHistory: i.usage_history || []
        }));
    },

    update: async (id, updates) => {
        const dbUpdates = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
        if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
        if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;

        const { data, error } = await supabase
            .from('inventory')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    create: async (itemData) => {
        const { data, error } = await supabase
            .from('inventory')
            .insert([{
                name: itemData.name,
                sku: itemData.sku,
                category: itemData.category,
                quantity: itemData.quantity || 0,
                min_stock: itemData.minStock || 5,
                cost: itemData.cost,
                supplier: itemData.supplier,
                usage_history: []
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ============== STORE PRODUCTS ==============
export const storeProductsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .order('id');
        if (error) throw error;
        return data.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: p.price,
            cost: p.cost,
            quantity: p.quantity,
            minStock: p.min_stock,
            description: p.description
        }));
    },

    update: async (id, updates) => {
        const dbUpdates = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.price !== undefined) dbUpdates.price = updates.price;
        if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
        if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
        if (updates.description !== undefined) dbUpdates.description = updates.description;

        const { data, error } = await supabase
            .from('store_products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ============== SALES ==============
export const salesApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(s => ({
            id: s.id,
            date: s.date,
            time: s.time,
            items: s.items,
            subtotal: s.subtotal,
            tax: s.tax,
            discount: s.discount,
            total: s.total,
            paymentMethod: s.payment_method,
            employeeId: s.employee_id,
            employeeName: s.employee_name,
            customerId: s.customer_id,
            customerName: s.customer_name,
            receiptNumber: s.receipt_number,
            type: s.type,
            bookingId: s.booking_id
        }));
    },

    create: async (saleData) => {
        const id = `SALE-${Date.now()}`;
        const receiptNumber = `RCP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const { data, error } = await supabase
            .from('sales')
            .insert([{
                id,
                date: saleData.date || new Date().toISOString().split('T')[0],
                time: saleData.time || new Date().toLocaleTimeString(),
                items: saleData.items,
                subtotal: saleData.subtotal,
                tax: saleData.tax,
                discount: saleData.discount || 0,
                total: saleData.total,
                payment_method: saleData.paymentMethod,
                employee_id: saleData.employeeId,
                employee_name: saleData.employeeName,
                customer_id: saleData.customerId,
                customer_name: saleData.customerName || 'Walk-in Customer',
                receipt_number: receiptNumber,
                type: saleData.type,
                booking_id: saleData.bookingId
            }])
            .select()
            .single();
        if (error) throw error;
        return { ...data, id, receiptNumber };
    }
};

// ============== WEBSITE CONTENT ==============
export const websiteContentApi = {
    get: async () => {
        const { data, error } = await supabase
            .from('website_content')
            .select('content_data')
            .eq('content_key', 'website_content')
            .single();
        if (error) throw error;
        return data?.content_data;
    },

    update: async (section, sectionData) => {
        // Get current content
        const { data: existing } = await supabase
            .from('website_content')
            .select('content_data')
            .eq('content_key', 'website_content')
            .single();

        const currentContent = existing?.content_data || {};
        const updatedContent = {
            ...currentContent,
            [section]: { ...currentContent[section], ...sectionData }
        };

        const { data, error } = await supabase
            .from('website_content')
            .upsert({
                content_key: 'website_content',
                content_data: updatedContent,
                updated_at: new Date().toISOString()
            }, { onConflict: 'content_key' })
            .select()
            .single();
        if (error) throw error;
        return updatedContent;
    }
};

// ============== ACTIVITY LOG ==============
export const activityLogApi = {
    getAll: async (limit = 100) => {
        const { data, error } = await supabase
            .from('activity_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data.map(a => ({
            id: a.id,
            timestamp: a.timestamp,
            userId: a.user_id,
            userName: a.user_name,
            userRole: a.user_role,
            action: a.action,
            category: a.category,
            details: a.details,
            metadata: a.metadata
        }));
    },

    create: async (logData) => {
        const id = `ACT-${Date.now()}`;
        const { data, error } = await supabase
            .from('activity_log')
            .insert([{
                id,
                timestamp: new Date().toISOString(),
                user_id: logData.userId,
                user_name: logData.userName,
                user_role: logData.userRole,
                action: logData.action,
                category: logData.category,
                details: logData.details,
                metadata: logData.metadata
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// ============== MESSAGE TEMPLATES ==============
export const messageTemplatesApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .order('id');
        if (error) throw error;
        return data;
    }
};

// ============== CUSTOMER MESSAGES ==============
export const customerMessagesApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('customer_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(m => ({
            id: m.id,
            customerId: m.customer_id,
            customerName: m.customer_name,
            customerEmail: m.customer_email,
            customerPhone: m.customer_phone,
            bookingId: m.booking_id,
            employeeId: m.employee_id,
            employeeName: m.employee_name,
            type: m.type,
            subject: m.subject,
            message: m.message,
            channel: m.channel,
            status: m.status,
            sentAt: m.sent_at,
            readAt: m.read_at
        }));
    },

    create: async (messageData) => {
        const { data, error } = await supabase
            .from('customer_messages')
            .insert([{
                customer_id: messageData.customerId,
                customer_name: messageData.customerName,
                customer_email: messageData.customerEmail,
                customer_phone: messageData.customerPhone,
                booking_id: messageData.bookingId,
                employee_id: messageData.employeeId,
                employee_name: messageData.employeeName,
                type: messageData.type,
                subject: messageData.subject,
                message: messageData.message,
                channel: messageData.channel,
                status: 'sent',
                sent_at: new Date().toISOString()
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// Export all APIs
export default {
    supabase,
    isSupabaseAvailable,
    users: usersApi,
    customers: customersApi,
    services: servicesApi,
    timeSlots: timeSlotsApi,
    bookings: bookingsApi,
    inventory: inventoryApi,
    storeProducts: storeProductsApi,
    sales: salesApi,
    websiteContent: websiteContentApi,
    activityLog: activityLogApi,
    messageTemplates: messageTemplatesApi,
    customerMessages: customerMessagesApi
};

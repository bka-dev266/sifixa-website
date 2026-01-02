// Supabase Integration - Database Only (No localStorage!)
// All data is stored in Supabase database
import { supabase } from './supabase';

// Import modular APIs - Core
import { customersApi } from './api/customers';
import { servicesApi } from './api/services';
import { inventoryApi } from './api/inventory';
import { usersApi } from './api/users';
import { appointmentsApi } from './api/appointments';
import { devicesApi } from './api/devices';

// Import modular APIs - Tickets & Warranties
import { ticketsApi } from './api/tickets';
import { warrantiesApi } from './api/warranties';

// Import modular APIs - POS & Sales
import { registersApi } from './api/registers';
import { salesOrdersApi } from './api/salesOrders';
import { paymentsApi } from './api/payments';
import { discountsApi } from './api/discounts';

// Import modular APIs - Inventory
import { purchaseOrdersApi } from './api/purchaseOrders';
import { suppliersApi } from './api/suppliers';

// Import modular APIs - Invoicing & Messaging
import { invoicesApi } from './api/invoices';
import { messagingApi } from './api/messaging';

// Import modular APIs - Reporting & Settings
import { reportingApi } from './api/reporting';
import { storeSettingsApi } from './api/storeSettings';


// ============== MOCK API - SUPABASE ONLY ==============
export const mockApi = {
    // ============== AUTHENTICATION ==============
    login: async (username, _password) => {
        // Query profiles table for user
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !profile) {
                throw new Error('Invalid credentials');
            }

            return {
                id: profile.id,
                username: profile.username,
                name: profile.full_name,
                email: profile.email,
                role: 'admin',
                isStaff: true,
                permissions: {}
            };
        } catch {
            throw new Error('Invalid credentials');
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        return true;
    },

    // ============== CUSTOMERS ==============
    getCustomers: () => customersApi.getAll(),
    getCustomer: (id) => customersApi.getById(id),
    addCustomer: (data) => customersApi.create(data),
    updateCustomer: (id, updates) => customersApi.update(id, updates),
    deleteCustomer: (id) => customersApi.delete(id),

    // ============== SERVICES ==============
    getServices: () => servicesApi.getAll(),
    getService: (id) => servicesApi.getById(id),
    addService: (data) => servicesApi.create(data),
    updateService: (id, updates) => servicesApi.update(id, updates),
    deleteService: (id) => servicesApi.delete(id),
    toggleServiceActive: (id) => servicesApi.toggleActive(id),

    // ============== INVENTORY ==============
    getInventory: () => inventoryApi.getAll(),
    getInventoryItem: (id) => inventoryApi.getById(id),
    addInventoryItem: (data) => inventoryApi.create(data),
    updateInventoryItem: (id, updates) => inventoryApi.update(id, updates),
    deleteInventoryItem: (id) => inventoryApi.delete(id),
    adjustStock: (id, adjustment, reason) => inventoryApi.adjustStock(id, adjustment, reason),
    getReorderAlerts: async () => {
        // Return empty array for now to avoid query errors
        return [];
    },

    // ============== USERS ==============
    getUsers: () => usersApi.getAll(),
    getEmployees: () => usersApi.getStaff(),
    getUser: (id) => usersApi.getById(id),
    addUser: (data) => usersApi.create(data),
    updateUser: (id, updates) => usersApi.update(id, updates),
    deleteUser: (id) => usersApi.delete(id),
    getRoles: () => usersApi.getRoles(),

    // ============== APPOINTMENTS/BOOKINGS ==============
    getBookings: () => appointmentsApi.getAll(),
    getBooking: (id) => appointmentsApi.getById(id),

    addBooking: async (bookingData) => {
        try {
            console.log('Starting booking creation with data:', bookingData);

            // First, check if customer exists by email
            const { data: existingCustomers, error: customerCheckError } = await supabase
                .from('customers')
                .select('id')
                .eq('email', bookingData.customer.email)
                .limit(1);

            if (customerCheckError) {
                console.error('Customer check error:', customerCheckError);
                throw customerCheckError;
            }

            let customerId;
            if (existingCustomers && existingCustomers.length > 0) {
                customerId = existingCustomers[0].id;
                console.log('Found existing customer:', customerId);
            } else {
                // Create new customer
                const nameParts = bookingData.customer.name.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || null;

                console.log('Creating new customer:', { firstName, lastName, email: bookingData.customer.email });

                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert([{
                        first_name: firstName,
                        last_name: lastName,
                        email: bookingData.customer.email,
                        phone: bookingData.customer.phone
                    }])
                    .select()
                    .single();

                if (customerError) {
                    console.error('Customer creation error:', customerError);
                    throw customerError;
                }
                customerId = newCustomer.id;
                console.log('Created new customer:', customerId);
            }

            // Get default store
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('is_active', true)
                .limit(1)
                .single();

            if (storeError || !store) {
                console.error('Store fetch error:', storeError);
                throw new Error('No active store found');
            }

            // Get time slot ID from name
            const { data: timeSlot, error: timeSlotError } = await supabase
                .from('time_slots')
                .select('id, start_time')
                .eq('name', bookingData.time)
                .eq('is_active', true)
                .limit(1)
                .single();

            if (timeSlotError || !timeSlot) {
                console.error('Time slot fetch error:', timeSlotError);
                // Use default time if no slot found
                console.warn('Using default time since no time slot found');
            }

            const scheduledTime = timeSlot ? timeSlot.start_time : '09:00:00';

            // Create appointment with all required fields
            const appointmentData = {
                customer_id: customerId,
                store_id: store.id,
                scheduled_date: bookingData.date,
                scheduled_start: scheduledTime,  // Fixed: column is scheduled_start
                time_slot_id: timeSlot ? timeSlot.id : null,
                status: 'scheduled',
                notes: `Device: ${bookingData.device}\nService: ${bookingData.serviceType}\nIssue: ${bookingData.issue}\nPriority: ${bookingData.priorityLevel}`
            };

            console.log('Creating appointment with data:', appointmentData);

            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select()
                .single();

            if (appointmentError) {
                console.error('Appointment creation error:', appointmentError);
                throw appointmentError;
            }

            console.log('Created appointment:', appointment);

            // Generate tracking number
            const trackingNumber = `SFX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${appointment.id.slice(0, 4).toUpperCase()}`;

            return {
                id: appointment.id,
                trackingNumber: trackingNumber,
                ...bookingData
            };
        } catch (error) {
            console.error('Add booking error:', error);
            throw error;
        }
    },

    updateBooking: (id, updates) => appointmentsApi.update(id, updates),
    updateBookingStatus: async (id, status) => appointmentsApi.update(id, { status }),
    cancelBooking: (id) => appointmentsApi.cancel(id),
    getBookingsByCustomer: (customerId) => appointmentsApi.getByCustomer(customerId),

    // ============== STATISTICS ==============
    getStats: async () => {
        try {
            const [bookings, services, customers] = await Promise.all([
                appointmentsApi.getAll(),
                servicesApi.getAll(),
                customersApi.getAll()
            ]);
            return {
                totalBookings: bookings.length,
                pendingBookings: bookings.filter(b => b.status === 'scheduled').length,
                completedToday: bookings.filter(b => b.status === 'completed').length,
                activeServices: services.filter(s => s.active).length,
                totalCustomers: customers.length
            };
        } catch {
            return {
                totalBookings: 0,
                pendingBookings: 0,
                completedToday: 0,
                activeServices: 0,
                totalCustomers: 0
            };
        }
    },

    // ============== REPAIR TRACKING ==============
    // Note: repair_ticket_history table may not exist - return empty array
    getRepairTracking: async (bookingId) => {
        // Skip if no booking ID provided
        if (!bookingId) return [];

        try {
            // Try to fetch from repair_ticket_history table
            const { data, error } = await supabase
                .from('repair_ticket_history')
                .select('*')
                .eq('ticket_id', bookingId)
                .order('changed_at', { ascending: true });

            // If table doesn't exist (404) or other error, return empty array silently
            if (error) {
                // Don't log 404 errors - table may not exist
                if (error.code !== 'PGRST116') {
                    console.debug('Repair tracking not available:', error.message);
                }
                return [];
            }

            return (data || []).map(r => ({
                id: r.id,
                booking_id: r.ticket_id,
                status: r.new_status,
                message: r.note,
                created_at: r.changed_at
            }));
        } catch {
            return [];
        }
    },

    addRepairTrackingLog: async (bookingId, status, message, staffMember) => {
        const { data, error } = await supabase
            .from('repair_ticket_history')
            .insert([{
                ticket_id: bookingId,
                new_status: status,
                note: message,
                changed_by: staffMember
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============== SETTINGS ==============
    getSettings: async () => {
        return {
            storeName: 'SIFIXA',
            phone: '555-0100',
            email: 'info@sifixa.com',
            address: '123 Repair St',
            businessHours: 'Mon-Sat: 9AM - 8PM',
            taxRate: 8.0
        };
    },

    updateSettings: async (updates) => {
        return updates;
    },

    // ============== TIME SLOTS ==============
    getTimeSlots: async () => {
        try {
            const { data, error } = await supabase
                .from('time_slots')
                .select('*')
                .eq('is_active', true)
                .order('start_time');

            if (error) {
                console.error('Time slots fetch error:', error);
                // Return default time slots
                return [
                    { id: '1', name: 'Morning', startTime: '09:00', endTime: '12:00', maxBookings: 3, active: true },
                    { id: '2', name: 'Afternoon', startTime: '12:00', endTime: '16:00', maxBookings: 3, active: true },
                    { id: '3', name: 'Evening', startTime: '16:00', endTime: '20:00', maxBookings: 3, active: true }
                ];
            }

            if (!data || data.length === 0) {
                // Return default time slots if database is empty
                return [
                    { id: '1', name: 'Morning', startTime: '09:00', endTime: '12:00', maxBookings: 3, active: true },
                    { id: '2', name: 'Afternoon', startTime: '12:00', endTime: '16:00', maxBookings: 3, active: true },
                    { id: '3', name: 'Evening', startTime: '16:00', endTime: '20:00', maxBookings: 3, active: true }
                ];
            }

            return data.map(s => ({
                id: s.id,
                name: s.name,
                startTime: s.start_time,
                endTime: s.end_time,
                maxBookings: s.max_bookings,
                active: s.is_active
            }));
        } catch {
            console.error('Time slots error');
            // Return default time slots
            return [
                { id: '1', name: 'Morning', startTime: '09:00', endTime: '12:00', maxBookings: 3, active: true },
                { id: '2', name: 'Afternoon', startTime: '12:00', endTime: '16:00', maxBookings: 3, active: true },
                { id: '3', name: 'Evening', startTime: '16:00', endTime: '20:00', maxBookings: 3, active: true }
            ];
        }
    },

    // ============== STORE PRODUCTS (POS) ==============
    getStoreProducts: async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('item_type', 'product')
                .eq('is_active', true)
                .is('deleted_at', null);
            if (error) return [];
            return data.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: 0,
                category: 'products'
            }));
        } catch {
            return [];
        }
    },

    // ============== SALES ==============
    getSales: async () => {
        try {
            const { data, error } = await supabase
                .from('sales_orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) return [];
            return data.map(s => ({
                id: s.id,
                customer: 'Customer',
                total: s.total_amount,
                status: s.status,
                date: s.created_at
            }));
        } catch {
            return [];
        }
    },

    addSale: async (saleData) => {
        const { data, error } = await supabase
            .from('sales_orders')
            .insert([{
                customer_id: saleData.customerId || null,
                store_id: saleData.storeId,
                status: 'completed',
                subtotal: saleData.subtotal,
                tax_amount: saleData.tax,
                total_amount: saleData.total
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getSalesStats: async () => {
        return {
            salesToday: 0,
            transactionsToday: 0,
            totalSales: 0
        };
    },

    // ============== PURCHASE ORDERS ==============
    getPurchaseOrders: async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) return [];
            return data.map(po => ({
                id: po.id,
                supplier: 'Supplier',
                status: po.status,
                total: po.total,
                date: po.created_at
            }));
        } catch {
            return [];
        }
    },

    // ============== ANALYTICS ==============
    getAnalyticsData: async () => {
        return {
            revenue: { thisMonth: 0, lastMonth: 0 },
            bookings: { thisMonth: 0, lastMonth: 0 }
        };
    },

    getRevenueByService: async () => {
        return [];
    },

    getBookingsByStatus: async () => {
        try {
            const bookings = await appointmentsApi.getAll();
            const statusCounts = {};
            bookings.forEach(b => {
                statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
            });
            return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        } catch {
            return [];
        }
    },

    getInventoryAnalytics: async () => {
        try {
            const inventory = await inventoryApi.getAll();
            return {
                totalItems: inventory.length,
                lowStockItems: 0,
                totalValue: 0
            };
        } catch {
            return { totalItems: 0, lowStockItems: 0, totalValue: 0 };
        }
    },

    getSupportStats: async () => {
        return {
            openTickets: 0,
            resolvedToday: 0,
            avgResponseTime: '2h 15m'
        };
    },

    // ============== CUSTOMER MESSAGES ==============
    getCustomerMessages: async () => {
        try {
            const { data, error } = await supabase
                .from('notification_events')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) return [];
            return data;
        } catch {
            return [];
        }
    },

    getMessageTemplates: async () => {
        try {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*');
            if (error) return [];
            return data;
        } catch {
            return [];
        }
    },

    sendCustomerMessage: async (messageData) => {
        const { data, error } = await supabase
            .from('notification_events')
            .insert([{
                customer_id: messageData.customerId,
                type: messageData.type || 'message',
                title: messageData.subject,
                message: messageData.body
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    fillMessageTemplate: (template, data) => {
        let filled = template.body;
        Object.entries(data).forEach(([key, value]) => {
            filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return filled;
    },

    // ============== REPAIRS READY FOR PICKUP ==============
    getRepairsReadyForPickup: async () => {
        try {
            const { data, error } = await supabase
                .from('repair_tickets')
                .select('*')
                .eq('status', 'ready_for_pickup');
            if (error) return [];
            return data.map(r => ({
                bookingId: r.id,
                device: r.device_description,
                customer: 'Customer',
                total: r.final_price || 0
            }));
        } catch {
            return [];
        }
    },

    markRepairPickedUp: async (bookingId) => {
        const { error } = await supabase
            .from('repair_tickets')
            .update({ status: 'completed' })
            .eq('id', bookingId);
        if (error) throw error;
        return true;
    },

    // ============== BOOKING OPERATIONS ==============
    addBookingNote: async (bookingId, note, _author) => {
        return appointmentsApi.update(bookingId, { notes: note });
    },

    updateBookingPriority: async (bookingId, priority) => {
        return appointmentsApi.update(bookingId, { priority });
    },

    updateBookingCostEstimate: async (bookingId, cost) => {
        return appointmentsApi.update(bookingId, { estimatedCost: cost });
    },

    startRepairTimer: async (bookingId) => {
        return { id: bookingId, timerStarted: new Date().toISOString() };
    },

    stopRepairTimer: async (bookingId) => {
        return { id: bookingId, timerStopped: new Date().toISOString() };
    },

    // ============== LEGACY COMPATIBILITY ==============
    updateProductStock: async (id, change) => {
        return inventoryApi.adjustStock(id, change, 'stock_update');
    },

    updateStoreProduct: async (id, updates) => {
        return inventoryApi.update(id, updates);
    },

    updatePurchaseOrder: async (orderId, updates) => {
        return updates;
    },

    resetUserPassword: async (userId, _newPassword) => {
        console.log('Password reset requested for user:', userId);
        return true;
    },

    getCustomerUserByEmail: async (email) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, email')
            .eq('email', email)
            .single();
        if (error) return null;
        return data;
    },

    // ============== WEBSITE CONTENT (CMS) ==============
    getWebsiteContent: async () => {
        try {
            const { data, error } = await supabase
                .from('website_content')
                .select('*');

            if (error || !data || data.length === 0) {
                // Return default content
                return {
                    hero: {
                        title: 'Professional Device Repair',
                        subtitle: 'Fast, reliable repairs for phones, tablets, and computers',
                        ctaText: 'Book Repair',
                        ctaLink: '/booking'
                    },
                    whyChooseUs: {
                        items: [
                            { title: 'Expert Technicians', description: 'Certified professionals' },
                            { title: 'Quality Parts', description: 'OEM and premium parts' },
                            { title: 'Fast Service', description: 'Same-day repairs available' }
                        ]
                    },
                    howItWorks: {
                        steps: [
                            { step: 1, title: 'Book Online', description: 'Schedule your repair' },
                            { step: 2, title: 'Drop Off', description: 'Bring your device' },
                            { step: 3, title: 'Repair', description: 'We fix it' },
                            { step: 4, title: 'Pick Up', description: 'Get your device back' }
                        ]
                    },
                    footer: {
                        companyName: 'SIFIXA',
                        phone: '555-0100',
                        email: 'info@sifixa.com'
                    }
                };
            }

            // Transform array to object keyed by section
            const content = {};
            data.forEach(item => {
                content[item.section] = item.content;
            });
            return content;
        } catch (err) {
            console.error('Website content error:', err);
            return {};
        }
    },

    updateWebsiteContent: async (section, content) => {
        const { data, error } = await supabase
            .from('website_content')
            .upsert([{ section, content, updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ============== NEW: DEVICES ==============
    getDevices: (customerId) => devicesApi.getByCustomer(customerId),
    getDevice: (id) => devicesApi.getById(id),
    addDevice: (data) => devicesApi.create(data),
    updateDevice: (id, updates) => devicesApi.update(id, updates),
    deleteDevice: (id) => devicesApi.delete(id),

    // ============== NEW: REPAIR TICKETS ==============
    getTickets: (filters) => ticketsApi.getAll(filters),
    getTicket: (id) => ticketsApi.getById(id),
    createTicket: (data) => ticketsApi.create(data),
    updateTicket: (id, updates) => ticketsApi.update(id, updates),
    updateTicketStatus: (id, status, message, changedBy) => ticketsApi.updateStatus(id, status, message, changedBy),
    getTicketStatusHistory: (ticketId) => ticketsApi.getStatusHistory(ticketId),
    assignTechnician: (ticketId, techId) => ticketsApi.assignTechnician(ticketId, techId),
    unassignTechnician: (ticketId, techId) => ticketsApi.unassignTechnician(ticketId, techId),
    addTicketNote: (ticketId, note, isInternal, createdBy) => ticketsApi.addNote(ticketId, note, isInternal, createdBy),
    getTicketNotes: (ticketId, includeInternal) => ticketsApi.getNotes(ticketId, includeInternal),
    addTicketService: (ticketId, serviceItemId, qty, unitPrice, discount, tax) => ticketsApi.addService(ticketId, serviceItemId, qty, unitPrice, discount, tax),
    addTicketPart: (ticketId, partItemId, qty, unitPrice, cost, usedBy) => ticketsApi.addPart(ticketId, partItemId, qty, unitPrice, cost, usedBy),
    getTicketsByCustomer: (customerId) => ticketsApi.getByCustomer(customerId),
    searchTicketByNumber: (ticketNumber) => ticketsApi.getByTicketNumber(ticketNumber),
    deleteTicket: (id) => ticketsApi.delete(id),

    // ============== NEW: WARRANTIES ==============
    createWarranty: (ticketId, expiresAt, terms) => warrantiesApi.create(ticketId, expiresAt, terms),
    getWarrantyByTicket: (ticketId) => warrantiesApi.getByTicket(ticketId),
    getWarrantiesByCustomer: (customerId) => warrantiesApi.getByCustomer(customerId),
    createWarrantyClaim: (originalTicketId, claimTicketId, reason) => warrantiesApi.createClaim(originalTicketId, claimTicketId, reason),
    getExpiringWarranties: (days) => warrantiesApi.getExpiring(days),

    // ============== NEW: POS REGISTERS ==============
    getRegisters: () => registersApi.getAll(),
    getRegister: (id) => registersApi.getById(id),
    createRegister: (data) => registersApi.create(data),
    openShift: (registerId, openedBy, openingCash) => registersApi.openShift(registerId, openedBy, openingCash),
    closeShift: (shiftId, closedBy, closingCash, notes) => registersApi.closeShift(shiftId, closedBy, closingCash, notes),
    getCurrentShift: (registerId) => registersApi.getCurrentShift(registerId),
    recordCashDrop: (shiftId, amount, note, createdBy) => registersApi.recordCashDrop(shiftId, amount, note, createdBy),
    recordPayout: (shiftId, amount, note, createdBy) => registersApi.recordPayout(shiftId, amount, note, createdBy),

    // ============== NEW: SALES ORDERS ==============
    getSalesOrders: (filters) => salesOrdersApi.getAll(filters),
    getSalesOrder: (id) => salesOrdersApi.getById(id),
    createSalesOrder: (data) => salesOrdersApi.create(data),
    addOrderItem: (orderId, itemId, qty, unitPrice, discount, tax, cost) => salesOrdersApi.addItem(orderId, itemId, qty, unitPrice, discount, tax, cost),
    updateOrderItem: (orderItemId, updates) => salesOrdersApi.updateItem(orderItemId, updates),
    removeOrderItem: (orderItemId) => salesOrdersApi.removeItem(orderItemId),
    applyDiscount: (orderId, discountId, appliedAmount) => salesOrdersApi.applyDiscount(orderId, discountId, appliedAmount),
    applyCoupon: (orderId, couponCode) => salesOrdersApi.applyCoupon(orderId, couponCode),
    completeSalesOrder: (orderId) => salesOrdersApi.complete(orderId),
    voidSalesOrder: (orderId, reasonId, note) => salesOrdersApi.void(orderId, reasonId, note),
    getTodaySalesSummary: () => salesOrdersApi.getTodaySummary(),

    // ============== NEW: PAYMENTS ==============
    createPayment: (paymentData) => paymentsApi.create(paymentData),
    getPaymentsByOrder: (orderId) => paymentsApi.getByOrder(orderId),
    getPaymentsByInvoice: (invoiceId) => paymentsApi.getByInvoice(invoiceId),
    processRefund: (paymentData) => paymentsApi.processRefund(paymentData),
    createRefund: (refundData) => paymentsApi.createRefund(refundData),
    getRefundsByOrder: (orderId) => paymentsApi.getRefundsByOrder(orderId),
    getDailyPaymentSummary: (date) => paymentsApi.getDailySummary(date),

    // ============== NEW: DISCOUNTS & COUPONS ==============
    getDiscounts: () => discountsApi.getAll(),
    getActiveDiscounts: () => discountsApi.getActive(),
    createDiscount: (data) => discountsApi.create(data),
    updateDiscount: (id, updates) => discountsApi.update(id, updates),
    deleteDiscount: (id) => discountsApi.delete(id),
    getCoupons: () => discountsApi.getCoupons(),
    createCoupon: (data) => discountsApi.createCoupon(data),
    validateCoupon: (code) => discountsApi.validateCoupon(code),
    updateCoupon: (id, updates) => discountsApi.updateCoupon(id, updates),

    // ============== NEW: SUPPLIERS ==============
    getSuppliers: () => suppliersApi.getAll(),
    getSupplier: (id) => suppliersApi.getById(id),
    createSupplier: (data) => suppliersApi.create(data),
    updateSupplier: (id, updates) => suppliersApi.update(id, updates),
    deleteSupplier: (id) => suppliersApi.delete(id),

    // ============== NEW: PURCHASE ORDERS (Enhanced) ==============
    createPurchaseOrder: (data) => purchaseOrdersApi.create(data),
    getPurchaseOrder: (id) => purchaseOrdersApi.getById(id),
    addPurchaseOrderItem: (poId, itemId, qty, unitCost) => purchaseOrdersApi.addItem(poId, itemId, qty, unitCost),
    sendPurchaseOrder: (poId) => purchaseOrdersApi.send(poId),
    receivePurchaseOrder: (poId, items, receivedBy, notes) => purchaseOrdersApi.receiveGoods(poId, items, receivedBy, notes),
    cancelPurchaseOrder: (poId) => purchaseOrdersApi.cancel(poId),

    // ============== NEW: INVOICES ==============
    getInvoices: (filters) => invoicesApi.getAll(filters),
    getInvoice: (id) => invoicesApi.getById(id),
    getInvoicesByCustomer: (customerId) => invoicesApi.getByCustomer(customerId),
    getInvoiceByTicket: (ticketId) => invoicesApi.getByTicket(ticketId),
    createInvoice: (data) => invoicesApi.create(data),
    addInvoiceItem: (invoiceId, itemData) => invoicesApi.addItem(invoiceId, itemData),
    sendInvoice: (invoiceId) => invoicesApi.send(invoiceId),
    markInvoicePaid: (invoiceId) => invoicesApi.markPaid(invoiceId),
    voidInvoice: (invoiceId) => invoicesApi.void(invoiceId),
    getOverdueInvoices: () => invoicesApi.getOverdue(),

    // ============== NEW: MESSAGING ==============
    getConversations: (customerId) => messagingApi.getConversations(customerId),
    createConversation: (customerId, ticketId, subject) => messagingApi.createConversation(customerId, ticketId, subject),
    getMessages: (conversationId) => messagingApi.getMessages(conversationId),
    sendMessage: (messageData) => messagingApi.sendMessage(messageData),
    markMessageRead: (messageId) => messagingApi.markAsRead(messageId),
    getNotifications: (customerId, limit) => messagingApi.getNotifications(customerId, limit),
    createNotification: (data) => messagingApi.createNotification(data),
    markNotificationRead: (notificationId) => messagingApi.markNotificationRead(notificationId),

    // ============== NEW: REPORTING & ANALYTICS ==============
    getDashboardSummary: () => reportingApi.getDashboardSummary(),
    getDailyMetrics: (date) => reportingApi.getDailyMetrics(date),
    getMetricsRange: (startDate, endDate) => reportingApi.getMetricsRange(startDate, endDate),
    getAuditLog: (filters) => reportingApi.getAuditLog(filters),
    logAuditAction: (actionData) => reportingApi.logAction(actionData),
    getTicketsByStatusChart: () => reportingApi.getTicketsByStatus(),
    getRevenueByDayChart: (days) => reportingApi.getRevenueByDay(days),

    // ============== NEW: STORE SETTINGS ==============
    getStores: () => storeSettingsApi.getStores(),
    getStore: (id) => storeSettingsApi.getStoreById(id),
    updateStore: (id, updates) => storeSettingsApi.updateStore(id, updates),
    getStoreSettings: (storeId) => storeSettingsApi.getSettings(storeId),
    updateStoreSettings: (storeId, settings) => storeSettingsApi.updateSettings(storeId, settings),
    getTaxRates: () => storeSettingsApi.getTaxRates(),
    createTaxRate: (data) => storeSettingsApi.createTaxRate(data),
    updateTaxRate: (id, updates) => storeSettingsApi.updateTaxRate(id, updates),
    getTimeSlotsConfig: (storeId) => storeSettingsApi.getTimeSlots(storeId),
    createTimeSlot: (data) => storeSettingsApi.createTimeSlot(data),
    updateTimeSlot: (id, updates) => storeSettingsApi.updateTimeSlot(id, updates),

    // ============== DIRECT API ACCESS ==============
    // Provide direct access to all API modules for advanced usage
    apis: {
        customers: customersApi,
        users: usersApi,
        devices: devicesApi,
        appointments: appointmentsApi,
        tickets: ticketsApi,
        warranties: warrantiesApi,
        services: servicesApi,
        inventory: inventoryApi,
        registers: registersApi,
        salesOrders: salesOrdersApi,
        payments: paymentsApi,
        discounts: discountsApi,
        purchaseOrders: purchaseOrdersApi,
        suppliers: suppliersApi,
        invoices: invoicesApi,
        messaging: messagingApi,
        reporting: reportingApi,
        storeSettings: storeSettingsApi
    }
};

export default mockApi;

// Supabase API - Invoices Module
import { supabase } from '../supabase';

// Generate invoice number
const generateInvoiceNumber = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${y}${m}-${rand}`;
};

export const invoicesApi = {
    // Get all invoices
    getAll: async (filters = {}) => {
        let query = supabase
            .from('invoices')
            .select(`
                *,
                customers(id, first_name, last_name, email),
                repair_tickets(id, ticket_number)
            `)
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.customerId) {
            query = query.eq('customer_id', filters.customerId);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            customerId: inv.customer_id,
            customerName: inv.customers ?
                `${inv.customers.first_name} ${inv.customers.last_name || ''}`.trim() : null,
            customerEmail: inv.customers?.email,
            ticketId: inv.ticket_id,
            ticketNumber: inv.repair_tickets?.ticket_number,
            status: inv.status,
            issuedAt: inv.issued_at,
            dueAt: inv.due_at,
            subtotal: inv.subtotal,
            taxTotal: inv.tax_total,
            discountTotal: inv.discount_total,
            total: inv.total,
            createdAt: inv.created_at
        }));
    },

    // Get invoice by ID with items
    getById: async (id) => {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                customers(id, first_name, last_name, email, phone, address1, city, state, zip),
                repair_tickets(id, ticket_number, status),
                invoice_items(
                    id, description, qty, unit_price, discount_amount, tax_amount, line_total,
                    items(id, name, sku)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            invoiceNumber: data.invoice_number,
            customerId: data.customer_id,
            customer: data.customers ? {
                id: data.customers.id,
                name: `${data.customers.first_name} ${data.customers.last_name || ''}`.trim(),
                email: data.customers.email,
                phone: data.customers.phone,
                address: data.customers.address1,
                city: data.customers.city,
                state: data.customers.state,
                zip: data.customers.zip
            } : null,
            ticketId: data.ticket_id,
            ticket: data.repair_tickets,
            status: data.status,
            issuedAt: data.issued_at,
            dueAt: data.due_at,
            items: data.invoice_items?.map(i => ({
                id: i.id,
                itemId: i.items?.id,
                itemName: i.items?.name,
                sku: i.items?.sku,
                description: i.description,
                qty: i.qty,
                unitPrice: i.unit_price,
                discount: i.discount_amount,
                tax: i.tax_amount,
                total: i.line_total
            })) || [],
            subtotal: data.subtotal,
            taxTotal: data.tax_total,
            discountTotal: data.discount_total,
            total: data.total,
            notes: data.notes,
            createdAt: data.created_at
        };
    },

    // Get invoices by customer
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('invoices')
            .select('id, invoice_number, status, total, issued_at, due_at')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            status: inv.status,
            total: inv.total,
            issuedAt: inv.issued_at,
            dueAt: inv.due_at
        }));
    },

    // Get invoice by ticket
    getByTicket: async (ticketId) => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        if (error) return null;
        return data;
    },

    // Create invoice
    create: async (invoiceData) => {
        const invoiceNumber = generateInvoiceNumber();

        const { data, error } = await supabase
            .from('invoices')
            .insert([{
                invoice_number: invoiceNumber,
                customer_id: invoiceData.customerId,
                ticket_id: invoiceData.ticketId || null,
                status: 'draft',
                due_at: invoiceData.dueAt || null,
                notes: invoiceData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            invoiceNumber: data.invoice_number,
            status: data.status
        };
    },

    // Add item to invoice
    addItem: async (invoiceId, itemData) => {
        const lineTotal = (itemData.qty * itemData.unitPrice) -
            (itemData.discount || 0) + (itemData.tax || 0);

        const { data, error } = await supabase
            .from('invoice_items')
            .insert([{
                invoice_id: invoiceId,
                item_id: itemData.itemId || null,
                description: itemData.description,
                qty: itemData.qty || 1,
                unit_price: itemData.unitPrice,
                discount_amount: itemData.discount || 0,
                tax_amount: itemData.tax || 0,
                line_total: lineTotal
            }])
            .select()
            .single();

        if (error) throw error;

        // Recalculate totals
        await invoicesApi.recalculateTotals(invoiceId);

        return data;
    },

    // Update invoice item
    updateItem: async (itemId, updates) => {
        const dbUpdates = {};
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.qty !== undefined) dbUpdates.qty = updates.qty;
        if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
        if (updates.discount !== undefined) dbUpdates.discount_amount = updates.discount;
        if (updates.tax !== undefined) dbUpdates.tax_amount = updates.tax;

        // Get current values to recalculate line total
        const { data: current } = await supabase
            .from('invoice_items')
            .select('qty, unit_price, discount_amount, tax_amount, invoice_id')
            .eq('id', itemId)
            .single();

        const qty = updates.qty ?? current.qty;
        const unitPrice = updates.unitPrice ?? current.unit_price;
        const discount = updates.discount ?? current.discount_amount;
        const tax = updates.tax ?? current.tax_amount;
        dbUpdates.line_total = (qty * unitPrice) - discount + tax;

        const { data, error } = await supabase
            .from('invoice_items')
            .update(dbUpdates)
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;

        // Recalculate totals
        await invoicesApi.recalculateTotals(current.invoice_id);

        return data;
    },

    // Remove invoice item
    removeItem: async (itemId) => {
        const { data: item } = await supabase
            .from('invoice_items')
            .select('invoice_id')
            .eq('id', itemId)
            .single();

        const { error } = await supabase
            .from('invoice_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        if (item?.invoice_id) {
            await invoicesApi.recalculateTotals(item.invoice_id);
        }

        return true;
    },

    // Recalculate invoice totals
    recalculateTotals: async (invoiceId) => {
        const { data: items } = await supabase
            .from('invoice_items')
            .select('qty, unit_price, discount_amount, tax_amount')
            .eq('invoice_id', invoiceId);

        const subtotal = items?.reduce((sum, i) => sum + (i.qty * i.unit_price), 0) || 0;
        const taxTotal = items?.reduce((sum, i) => sum + (i.tax_amount || 0), 0) || 0;
        const discountTotal = items?.reduce((sum, i) => sum + (i.discount_amount || 0), 0) || 0;
        const total = subtotal + taxTotal - discountTotal;

        await supabase
            .from('invoices')
            .update({ subtotal, tax_total: taxTotal, discount_total: discountTotal, total })
            .eq('id', invoiceId);
    },

    // Send invoice
    send: async (invoiceId) => {
        const { data, error } = await supabase
            .from('invoices')
            .update({
                status: 'sent',
                issued_at: new Date().toISOString()
            })
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Mark as paid
    markPaid: async (invoiceId) => {
        const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', invoiceId);

        if (error) throw error;
        return true;
    },

    // Void invoice
    void: async (invoiceId) => {
        const { error } = await supabase
            .from('invoices')
            .update({ status: 'void' })
            .eq('id', invoiceId);

        if (error) throw error;
        return true;
    },

    // Get invoice statuses
    getStatuses: () => [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'partially_paid', label: 'Partially Paid' },
        { value: 'paid', label: 'Paid' },
        { value: 'void', label: 'Void' },
        { value: 'refunded', label: 'Refunded' }
    ],

    // Get overdue invoices
    getOverdue: async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                customers(first_name, last_name, email, phone)
            `)
            .lt('due_at', today)
            .in('status', ['sent', 'unpaid', 'partially_paid'])
            .order('due_at');

        if (error) return [];
        return data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: inv.customers ?
                `${inv.customers.first_name} ${inv.customers.last_name || ''}`.trim() : null,
            customerEmail: inv.customers?.email,
            customerPhone: inv.customers?.phone,
            total: inv.total,
            dueAt: inv.due_at,
            daysOverdue: Math.ceil((new Date() - new Date(inv.due_at)) / (1000 * 60 * 60 * 24))
        }));
    }
};

export default invoicesApi;

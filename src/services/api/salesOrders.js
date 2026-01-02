// Supabase API - Sales Orders Module
// POS sales order management
import { supabase } from '../supabase';

// Generate order number
const generateOrderNumber = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${y}${m}${d}-${rand}`;
};

export const salesOrdersApi = {
    // Get all orders
    getAll: async (filters = {}) => {
        let query = supabase
            .from('sales_orders')
            .select(`
                *,
                registers(id, name),
                customers(id, first_name, last_name),
                profiles:cashier_id(full_name)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.registerId) {
            query = query.eq('register_id', filters.registerId);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(o => ({
            id: o.id,
            orderNumber: o.order_number,
            registerId: o.register_id,
            registerName: o.registers?.name,
            customerId: o.customer_id,
            customerName: o.customers ?
                `${o.customers.first_name} ${o.customers.last_name || ''}`.trim() : null,
            ticketId: o.ticket_id,
            status: o.status,
            cashier: o.profiles?.full_name,
            subtotal: o.subtotal,
            taxTotal: o.tax_total,
            discountTotal: o.discount_total,
            total: o.total,
            openedAt: o.opened_at,
            closedAt: o.closed_at
        }));
    },

    // Get order by ID with items
    getById: async (id) => {
        const { data, error } = await supabase
            .from('sales_orders')
            .select(`
                *,
                registers(id, name),
                customers(id, first_name, last_name, email, phone),
                profiles:cashier_id(full_name),
                sales_order_items(
                    id, qty, unit_price, discount_amount, tax_amount, line_total, cost_at_sale,
                    items(id, name, sku, item_type)
                ),
                sales_order_discounts(
                    id, applied_amount,
                    discounts(id, name, discount_type, value),
                    coupons(id, code)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            orderNumber: data.order_number,
            registerId: data.register_id,
            registerName: data.registers?.name,
            customerId: data.customer_id,
            customer: data.customers ? {
                id: data.customers.id,
                name: `${data.customers.first_name} ${data.customers.last_name || ''}`.trim(),
                email: data.customers.email,
                phone: data.customers.phone
            } : null,
            ticketId: data.ticket_id,
            status: data.status,
            cashier: data.profiles?.full_name,
            cashierId: data.cashier_id,
            items: data.sales_order_items?.map(i => ({
                id: i.id,
                itemId: i.items?.id,
                name: i.items?.name,
                sku: i.items?.sku,
                type: i.items?.item_type,
                qty: i.qty,
                unitPrice: i.unit_price,
                discount: i.discount_amount,
                tax: i.tax_amount,
                total: i.line_total,
                cost: i.cost_at_sale
            })) || [],
            discounts: data.sales_order_discounts?.map(d => ({
                id: d.id,
                discountName: d.discounts?.name,
                couponCode: d.coupons?.code,
                amount: d.applied_amount
            })) || [],
            subtotal: data.subtotal,
            taxTotal: data.tax_total,
            discountTotal: data.discount_total,
            total: data.total,
            notes: data.notes,
            openedAt: data.opened_at,
            closedAt: data.closed_at
        };
    },

    // Create new order
    create: async (orderData) => {
        const orderNumber = generateOrderNumber();

        const { data, error } = await supabase
            .from('sales_orders')
            .insert([{
                order_number: orderNumber,
                register_id: orderData.registerId,
                customer_id: orderData.customerId || null,
                ticket_id: orderData.ticketId || null,
                status: 'open',
                cashier_id: orderData.cashierId,
                notes: orderData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            orderNumber: data.order_number,
            status: data.status,
            openedAt: data.opened_at
        };
    },

    // Add item to order
    addItem: async (orderId, itemId, qty, unitPrice, discount = 0, tax = 0, costAtSale = null) => {
        const lineTotal = (qty * unitPrice) - discount + tax;

        const { data, error } = await supabase
            .from('sales_order_items')
            .insert([{
                sales_order_id: orderId,
                item_id: itemId,
                qty: qty,
                unit_price: unitPrice,
                discount_amount: discount,
                tax_amount: tax,
                line_total: lineTotal,
                cost_at_sale: costAtSale
            }])
            .select(`
                *,
                items(name, sku)
            `)
            .single();

        if (error) throw error;

        // Recalculate order totals
        await salesOrdersApi.recalculateTotals(orderId);

        return {
            id: data.id,
            itemName: data.items?.name,
            qty: data.qty,
            unitPrice: data.unit_price,
            total: data.line_total
        };
    },

    // Update item quantity
    updateItem: async (orderItemId, updates) => {
        const dbUpdates = {};
        if (updates.qty !== undefined) dbUpdates.qty = updates.qty;
        if (updates.discount !== undefined) dbUpdates.discount_amount = updates.discount;

        // Get current item to recalculate
        const { data: current } = await supabase
            .from('sales_order_items')
            .select('unit_price, tax_amount, sales_order_id')
            .eq('id', orderItemId)
            .single();

        if (updates.qty) {
            dbUpdates.line_total = (updates.qty * current.unit_price) -
                (updates.discount || 0) + (current.tax_amount || 0);
        }

        const { data, error } = await supabase
            .from('sales_order_items')
            .update(dbUpdates)
            .eq('id', orderItemId)
            .select()
            .single();

        if (error) throw error;

        // Recalculate order totals
        await salesOrdersApi.recalculateTotals(current.sales_order_id);

        return data;
    },

    // Remove item from order
    removeItem: async (orderItemId) => {
        // Get order ID first
        const { data: item } = await supabase
            .from('sales_order_items')
            .select('sales_order_id')
            .eq('id', orderItemId)
            .single();

        const { error } = await supabase
            .from('sales_order_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', orderItemId);

        if (error) throw error;

        // Recalculate order totals
        if (item?.sales_order_id) {
            await salesOrdersApi.recalculateTotals(item.sales_order_id);
        }

        return true;
    },

    // Apply discount to order
    applyDiscount: async (orderId, discountId, appliedAmount) => {
        const { data, error } = await supabase
            .from('sales_order_discounts')
            .insert([{
                sales_order_id: orderId,
                discount_id: discountId,
                applied_amount: appliedAmount
            }])
            .select()
            .single();

        if (error) throw error;

        // Recalculate totals
        await salesOrdersApi.recalculateTotals(orderId);

        return data;
    },

    // Apply coupon
    applyCoupon: async (orderId, couponCode) => {
        // Find coupon
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select(`
                *,
                discounts(discount_type, value)
            `)
            .eq('code', couponCode)
            .eq('is_active', true)
            .single();

        if (couponError || !coupon) {
            throw new Error('Invalid coupon code');
        }

        // Check if already used max times
        if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
            throw new Error('Coupon has reached maximum uses');
        }

        // Calculate discount amount based on order subtotal
        const { data: order } = await supabase
            .from('sales_orders')
            .select('subtotal')
            .eq('id', orderId)
            .single();

        let appliedAmount = 0;
        if (coupon.discounts?.discount_type === 'percent') {
            appliedAmount = (order.subtotal * coupon.discounts.value) / 100;
        } else {
            appliedAmount = coupon.discounts?.value || 0;
        }

        // Apply the discount
        const { error } = await supabase
            .from('sales_order_discounts')
            .insert([{
                sales_order_id: orderId,
                discount_id: coupon.discount_id,
                coupon_id: coupon.id,
                applied_amount: appliedAmount
            }])
            .select()
            .single();

        if (error) throw error;

        // Increment coupon usage
        await supabase
            .from('coupons')
            .update({ times_used: coupon.times_used + 1 })
            .eq('id', coupon.id);

        // Record redemption
        await supabase.from('coupon_redemptions').insert([{
            coupon_id: coupon.id,
            sales_order_id: orderId
        }]);

        // Recalculate totals
        await salesOrdersApi.recalculateTotals(orderId);

        return { couponCode, appliedAmount };
    },

    // Recalculate order totals
    recalculateTotals: async (orderId) => {
        // Get all items
        const { data: items } = await supabase
            .from('sales_order_items')
            .select('unit_price, qty, discount_amount, tax_amount, line_total')
            .eq('sales_order_id', orderId)
            .is('deleted_at', null);

        // Get all discounts
        const { data: discounts } = await supabase
            .from('sales_order_discounts')
            .select('applied_amount')
            .eq('sales_order_id', orderId);

        const subtotal = items?.reduce((sum, i) => sum + (i.qty * i.unit_price), 0) || 0;
        const taxTotal = items?.reduce((sum, i) => sum + (i.tax_amount || 0), 0) || 0;
        const itemDiscounts = items?.reduce((sum, i) => sum + (i.discount_amount || 0), 0) || 0;
        const orderDiscounts = discounts?.reduce((sum, d) => sum + (d.applied_amount || 0), 0) || 0;
        const discountTotal = itemDiscounts + orderDiscounts;
        const total = subtotal + taxTotal - discountTotal;

        await supabase
            .from('sales_orders')
            .update({
                subtotal,
                tax_total: taxTotal,
                discount_total: discountTotal,
                total: Math.max(0, total)
            })
            .eq('id', orderId);
    },

    // Complete order
    complete: async (orderId) => {
        const { data, error } = await supabase
            .from('sales_orders')
            .update({
                status: 'completed',
                closed_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Void order
    void: async (orderId, _voidReasonId = null, note = null) => {
        const { data, error } = await supabase
            .from('sales_orders')
            .update({
                status: 'voided',
                closed_at: new Date().toISOString(),
                notes: note
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get order statuses
    getStatuses: () => [
        { value: 'open', label: 'Open' },
        { value: 'completed', label: 'Completed' },
        { value: 'voided', label: 'Voided' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'partially_refunded', label: 'Partially Refunded' }
    ],

    // Get today's sales summary
    getTodaySummary: async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('sales_orders')
            .select('total, status')
            .gte('closed_at', `${today}T00:00:00`)
            .lte('closed_at', `${today}T23:59:59`)
            .eq('status', 'completed');

        if (error) return { count: 0, total: 0 };

        return {
            count: data.length,
            total: data.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }
};

export default salesOrdersApi;

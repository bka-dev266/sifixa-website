// Supabase API - Payments Module
// Payment processing and refunds
import { supabase } from '../supabase';

export const paymentsApi = {
    // Create payment
    create: async (paymentData) => {
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                ref_type: paymentData.refType, // 'sales_order' or 'invoice'
                ref_id: paymentData.refId,
                register_shift_id: paymentData.registerShiftId || null,
                payment_type: paymentData.paymentType,
                amount: paymentData.amount,
                provider: paymentData.provider || 'manual',
                provider_txn_id: paymentData.providerTxnId || null,
                status: 'succeeded',
                created_by: paymentData.createdBy || null,
                notes: paymentData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            refType: data.ref_type,
            refId: data.ref_id,
            paymentType: data.payment_type,
            amount: data.amount,
            status: data.status,
            paidAt: data.paid_at
        };
    },

    // Get payments for an order
    getByOrder: async (orderId) => {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                profiles:created_by(full_name)
            `)
            .eq('ref_type', 'sales_order')
            .eq('ref_id', orderId)
            .order('paid_at');

        if (error) return [];
        return data.map(p => ({
            id: p.id,
            paymentType: p.payment_type,
            amount: p.amount,
            provider: p.provider,
            providerTxnId: p.provider_txn_id,
            status: p.status,
            paidAt: p.paid_at,
            createdBy: p.profiles?.full_name,
            notes: p.notes
        }));
    },

    // Get payments for an invoice
    getByInvoice: async (invoiceId) => {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                profiles:created_by(full_name)
            `)
            .eq('ref_type', 'invoice')
            .eq('ref_id', invoiceId)
            .order('paid_at');

        if (error) return [];
        return data.map(p => ({
            id: p.id,
            paymentType: p.payment_type,
            amount: p.amount,
            provider: p.provider,
            status: p.status,
            paidAt: p.paid_at,
            createdBy: p.profiles?.full_name
        }));
    },

    // Get total paid for a reference
    getTotalPaid: async (refType, refId) => {
        const { data, error } = await supabase
            .from('payments')
            .select('amount')
            .eq('ref_type', refType)
            .eq('ref_id', refId)
            .eq('status', 'succeeded');

        if (error) return 0;
        return data.reduce((sum, p) => sum + (p.amount || 0), 0);
    },

    // Process refund payment (negative amount)
    processRefund: async (paymentData) => {
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                ref_type: paymentData.refType,
                ref_id: paymentData.refId,
                register_shift_id: paymentData.registerShiftId || null,
                payment_type: paymentData.paymentType,
                amount: -Math.abs(paymentData.amount), // Negative for refund
                provider: paymentData.provider || 'manual',
                status: 'succeeded',
                created_by: paymentData.createdBy || null,
                notes: paymentData.notes || 'Refund'
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            amount: data.amount,
            status: data.status
        };
    },

    // Get payment types
    getPaymentTypes: () => [
        { value: 'cash', label: 'Cash' },
        { value: 'card', label: 'Credit/Debit Card' },
        { value: 'apple_pay', label: 'Apple Pay' },
        { value: 'google_pay', label: 'Google Pay' },
        { value: 'zelle', label: 'Zelle' },
        { value: 'check', label: 'Check' },
        { value: 'store_credit', label: 'Store Credit' },
        { value: 'other', label: 'Other' }
    ],

    // ============== REFUNDS ==============

    // Create refund record
    createRefund: async (refundData) => {
        const { data, error } = await supabase
            .from('refunds')
            .insert([{
                sales_order_id: refundData.salesOrderId,
                reason_id: refundData.reasonId || null,
                reason_text: refundData.reasonText || null,
                subtotal: refundData.subtotal || 0,
                tax_refunded: refundData.taxRefunded || 0,
                total: refundData.total,
                created_by: refundData.createdBy
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            salesOrderId: data.sales_order_id,
            total: data.total,
            createdAt: data.created_at
        };
    },

    // Add refund item
    addRefundItem: async (refundId, itemData) => {
        const lineTotal = (itemData.qtyReturned * itemData.unitPrice) -
            (itemData.discountRefunded || 0) + (itemData.taxRefunded || 0);

        const { data, error } = await supabase
            .from('refund_items')
            .insert([{
                refund_id: refundId,
                sales_order_item_id: itemData.salesOrderItemId,
                qty_returned: itemData.qtyReturned,
                unit_price: itemData.unitPrice,
                discount_refunded: itemData.discountRefunded || 0,
                tax_refunded: itemData.taxRefunded || 0,
                line_total: lineTotal,
                restock: itemData.restock !== false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get refunds for an order
    getRefundsByOrder: async (orderId) => {
        const { data, error } = await supabase
            .from('refunds')
            .select(`
                *,
                return_reasons(name),
                profiles:created_by(full_name),
                refund_items(
                    id, qty_returned, unit_price, line_total, restock,
                    sales_order_items(
                        items(name, sku)
                    )
                )
            `)
            .eq('sales_order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(r => ({
            id: r.id,
            reason: r.return_reasons?.name || r.reason_text,
            subtotal: r.subtotal,
            taxRefunded: r.tax_refunded,
            total: r.total,
            createdBy: r.profiles?.full_name,
            createdAt: r.created_at,
            items: r.refund_items?.map(ri => ({
                id: ri.id,
                itemName: ri.sales_order_items?.items?.name,
                qtyReturned: ri.qty_returned,
                lineTotal: ri.line_total,
                restock: ri.restock
            })) || []
        }));
    },

    // Get return reasons
    getReturnReasons: async () => {
        const { data, error } = await supabase
            .from('return_reasons')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(r => ({
            id: r.id,
            name: r.name,
            requiresNote: r.requires_note
        }));
    },

    // Get daily payment summary
    getDailySummary: async (date = null) => {
        const targetDate = date || new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('payments')
            .select('payment_type, amount')
            .gte('paid_at', `${targetDate}T00:00:00`)
            .lte('paid_at', `${targetDate}T23:59:59`)
            .eq('status', 'succeeded');

        if (error) return {};

        // Group by payment type
        const summary = {};
        data.forEach(p => {
            if (!summary[p.payment_type]) {
                summary[p.payment_type] = { count: 0, total: 0 };
            }
            summary[p.payment_type].count++;
            summary[p.payment_type].total += p.amount || 0;
        });

        return summary;
    }
};

export default paymentsApi;

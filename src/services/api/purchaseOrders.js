// Supabase API - Purchase Orders Module
// Inventory purchasing and receiving
import { supabase } from '../supabase';

// Generate PO number
const generatePONumber = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PO-${y}${m}-${rand}`;
};

export const purchaseOrdersApi = {
    // Get all purchase orders
    getAll: async (filters = {}) => {
        let query = supabase
            .from('purchase_orders')
            .select(`
                *,
                suppliers(id, name),
                profiles:created_by(full_name)
            `)
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.supplierId) {
            query = query.eq('supplier_id', filters.supplierId);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(po => ({
            id: po.id,
            poNumber: po.po_number,
            supplierId: po.supplier_id,
            supplierName: po.suppliers?.name,
            status: po.status,
            orderedAt: po.ordered_at,
            expectedAt: po.expected_at,
            createdBy: po.profiles?.full_name,
            createdAt: po.created_at
        }));
    },

    // Get PO by ID with items
    getById: async (id) => {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                suppliers(id, name, contact_name, email, phone),
                profiles:created_by(full_name),
                purchase_order_items(
                    id, qty_ordered, unit_cost, qty_received,
                    items(id, name, sku)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            poNumber: data.po_number,
            supplierId: data.supplier_id,
            supplier: data.suppliers ? {
                id: data.suppliers.id,
                name: data.suppliers.name,
                contactName: data.suppliers.contact_name,
                email: data.suppliers.email,
                phone: data.suppliers.phone
            } : null,
            status: data.status,
            orderedAt: data.ordered_at,
            expectedAt: data.expected_at,
            createdBy: data.profiles?.full_name,
            notes: data.notes,
            items: data.purchase_order_items?.map(i => ({
                id: i.id,
                itemId: i.items?.id,
                itemName: i.items?.name,
                sku: i.items?.sku,
                qtyOrdered: i.qty_ordered,
                unitCost: i.unit_cost,
                qtyReceived: i.qty_received,
                lineTotal: i.qty_ordered * i.unit_cost
            })) || [],
            createdAt: data.created_at
        };
    },

    // Create PO
    create: async (poData) => {
        const poNumber = generatePONumber();

        const { data, error } = await supabase
            .from('purchase_orders')
            .insert([{
                po_number: poNumber,
                supplier_id: poData.supplierId,
                status: 'draft',
                expected_at: poData.expectedAt || null,
                created_by: poData.createdBy,
                notes: poData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            poNumber: data.po_number,
            status: data.status
        };
    },

    // Add item to PO
    addItem: async (poId, itemId, qtyOrdered, unitCost) => {
        const { data, error } = await supabase
            .from('purchase_order_items')
            .insert([{
                po_id: poId,
                item_id: itemId,
                qty_ordered: qtyOrdered,
                unit_cost: unitCost
            }])
            .select(`
                *,
                items(name, sku)
            `)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            itemName: data.items?.name,
            qtyOrdered: data.qty_ordered,
            unitCost: data.unit_cost
        };
    },

    // Update PO item
    updateItem: async (itemId, updates) => {
        const dbUpdates = {};
        if (updates.qtyOrdered !== undefined) dbUpdates.qty_ordered = updates.qtyOrdered;
        if (updates.unitCost !== undefined) dbUpdates.unit_cost = updates.unitCost;

        const { data, error } = await supabase
            .from('purchase_order_items')
            .update(dbUpdates)
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Remove item from PO
    removeItem: async (itemId) => {
        const { error } = await supabase
            .from('purchase_order_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
        return true;
    },

    // Send PO (mark as sent)
    send: async (poId) => {
        const { data, error } = await supabase
            .from('purchase_orders')
            .update({
                status: 'sent',
                ordered_at: new Date().toISOString()
            })
            .eq('id', poId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Cancel PO
    cancel: async (poId) => {
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'canceled' })
            .eq('id', poId);

        if (error) throw error;
        return true;
    },

    // ============== RECEIVING ==============

    // Receive goods
    receiveGoods: async (poId, items, receivedBy, notes = null) => {
        // Create goods receipt
        const { data: receipt, error: receiptError } = await supabase
            .from('goods_receipts')
            .insert([{
                po_id: poId,
                received_by: receivedBy,
                notes: notes
            }])
            .select()
            .single();

        if (receiptError) throw receiptError;

        // Add receipt items and update PO items
        for (const item of items) {
            // Add to goods_receipt_items
            await supabase.from('goods_receipt_items').insert([{
                receipt_id: receipt.id,
                item_id: item.itemId,
                qty_received: item.qtyReceived,
                unit_cost: item.unitCost
            }]);

            // Update PO item qty_received
            if (item.poItemId) {
                const { data: poItem } = await supabase
                    .from('purchase_order_items')
                    .select('qty_received')
                    .eq('id', item.poItemId)
                    .single();

                await supabase
                    .from('purchase_order_items')
                    .update({ qty_received: (poItem?.qty_received || 0) + item.qtyReceived })
                    .eq('id', item.poItemId);
            }

            // Update stock levels (if location provided)
            if (item.locationId) {
                // Get or create stock level
                const { data: stockLevel } = await supabase
                    .from('stock_levels')
                    .select('qty_on_hand')
                    .eq('location_id', item.locationId)
                    .eq('item_id', item.itemId)
                    .single();

                if (stockLevel) {
                    await supabase
                        .from('stock_levels')
                        .update({ qty_on_hand: stockLevel.qty_on_hand + item.qtyReceived })
                        .eq('location_id', item.locationId)
                        .eq('item_id', item.itemId);
                } else {
                    await supabase.from('stock_levels').insert([{
                        location_id: item.locationId,
                        item_id: item.itemId,
                        qty_on_hand: item.qtyReceived
                    }]);
                }

                // Record stock movement
                await supabase.from('stock_movements').insert([{
                    location_id: item.locationId,
                    item_id: item.itemId,
                    movement_type: 'purchase_received',
                    qty_change: item.qtyReceived,
                    unit_cost: item.unitCost,
                    ref_type: 'po',
                    ref_id: poId,
                    created_by: receivedBy
                }]);
            }
        }

        // Update PO status
        const { data: poItems } = await supabase
            .from('purchase_order_items')
            .select('qty_ordered, qty_received')
            .eq('po_id', poId);

        const allReceived = poItems?.every(i => i.qty_received >= i.qty_ordered);
        const someReceived = poItems?.some(i => i.qty_received > 0);

        await supabase
            .from('purchase_orders')
            .update({ status: allReceived ? 'received' : (someReceived ? 'partially_received' : 'sent') })
            .eq('id', poId);

        return { receiptId: receipt.id };
    },

    // Get receipts for a PO
    getReceipts: async (poId) => {
        const { data, error } = await supabase
            .from('goods_receipts')
            .select(`
                *,
                profiles:received_by(full_name),
                goods_receipt_items(
                    id, qty_received, unit_cost,
                    items(name, sku)
                )
            `)
            .eq('po_id', poId)
            .order('received_at', { ascending: false });

        if (error) return [];
        return data.map(r => ({
            id: r.id,
            receivedAt: r.received_at,
            receivedBy: r.profiles?.full_name,
            notes: r.notes,
            items: r.goods_receipt_items?.map(i => ({
                itemName: i.items?.name,
                qtyReceived: i.qty_received,
                unitCost: i.unit_cost
            })) || []
        }));
    },

    // Get PO statuses
    getStatuses: () => [
        { value: 'draft', label: 'Draft' },
        { value: 'sent', label: 'Sent' },
        { value: 'partially_received', label: 'Partially Received' },
        { value: 'received', label: 'Received' },
        { value: 'canceled', label: 'Canceled' }
    ]
};

export default purchaseOrdersApi;

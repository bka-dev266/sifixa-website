// Supabase API - Repair Tickets Module
// Full ticket lifecycle management
import { supabase } from '../supabase';

// Generate ticket number
const generateTicketNumber = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${y}${m}${d}-${rand}`;
};

export const ticketsApi = {
    // Get all tickets with related data
    getAll: async (filters = {}) => {
        try {
            let query = supabase
                .from('repair_tickets')
                .select(`
                    *,
                    customers(id, first_name, last_name, email, phone),
                    devices(id, device_type, brand, model, color),
                    appointments(id, scheduled_date, scheduled_start),
                    ticket_assignments(
                        tech_id,
                        assigned_at,
                        profiles(id, full_name)
                    )
                `)
                .is('deleted_at', null)
                .order('opened_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Tickets fetch error:', error);
                return [];
            }

            return data.map(t => ({
                id: t.id,
                ticketNumber: t.ticket_number,
                customerId: t.customer_id,
                customer: t.customers ? {
                    id: t.customers.id,
                    name: `${t.customers.first_name} ${t.customers.last_name || ''}`.trim(),
                    email: t.customers.email,
                    phone: t.customers.phone
                } : null,
                deviceId: t.device_id,
                device: t.devices ? {
                    id: t.devices.id,
                    type: t.devices.device_type,
                    name: `${t.devices.brand || ''} ${t.devices.model || ''}`.trim(),
                    color: t.devices.color
                } : null,
                appointmentId: t.appointment_id,
                appointment: t.appointments,
                status: t.status,
                priority: t.priority,
                assignedTechs: t.ticket_assignments?.map(ta => ({
                    id: ta.tech_id,
                    name: ta.profiles?.full_name,
                    assignedAt: ta.assigned_at
                })).filter(ta => ta.name) || [],
                openedAt: t.opened_at,
                closedAt: t.closed_at,
                createdBy: t.created_by,
                updatedAt: t.updated_at
            }));
        } catch (err) {
            console.error('Tickets error:', err);
            return [];
        }
    },

    // Get single ticket with full details
    getById: async (id) => {
        const { data, error } = await supabase
            .from('repair_tickets')
            .select(`
                *,
                customers(id, first_name, last_name, email, phone, address1, city, state, zip),
                devices(id, device_type, brand, model, color, serial_number, imei, condition_notes),
                appointments(id, scheduled_date, scheduled_start, status),
                ticket_assignments(
                    tech_id,
                    assigned_at,
                    unassigned_at,
                    profiles(id, full_name, email)
                ),
                ticket_notes(id, note, is_internal, created_at, created_by),
                ticket_services(
                    id, qty, unit_price, discount_amount, tax_amount, line_total,
                    items(id, name, sku)
                ),
                ticket_parts_used(
                    id, qty, unit_price, cost_at_use, used_at,
                    items(id, name, sku)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            ticketNumber: data.ticket_number,
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
            deviceId: data.device_id,
            device: data.devices ? {
                id: data.devices.id,
                type: data.devices.device_type,
                brand: data.devices.brand,
                model: data.devices.model,
                color: data.devices.color,
                serialNumber: data.devices.serial_number,
                imei: data.devices.imei,
                conditionNotes: data.devices.condition_notes
            } : null,
            appointmentId: data.appointment_id,
            appointment: data.appointments,
            status: data.status,
            priority: data.priority,
            assignedTechs: data.ticket_assignments?.filter(ta => !ta.unassigned_at).map(ta => ({
                id: ta.tech_id,
                name: ta.profiles?.full_name,
                email: ta.profiles?.email,
                assignedAt: ta.assigned_at
            })) || [],
            notes: data.ticket_notes?.map(n => ({
                id: n.id,
                note: n.note,
                isInternal: n.is_internal,
                createdAt: n.created_at,
                createdBy: n.created_by
            })) || [],
            services: data.ticket_services?.map(s => ({
                id: s.id,
                serviceId: s.items?.id,
                serviceName: s.items?.name,
                sku: s.items?.sku,
                qty: s.qty,
                unitPrice: s.unit_price,
                discount: s.discount_amount,
                tax: s.tax_amount,
                total: s.line_total
            })) || [],
            partsUsed: data.ticket_parts_used?.map(p => ({
                id: p.id,
                partId: p.items?.id,
                partName: p.items?.name,
                sku: p.items?.sku,
                qty: p.qty,
                unitPrice: p.unit_price,
                cost: p.cost_at_use,
                usedAt: p.used_at
            })) || [],
            openedAt: data.opened_at,
            closedAt: data.closed_at,
            createdBy: data.created_by,
            updatedAt: data.updated_at
        };
    },

    // Create new ticket
    create: async (ticketData) => {
        const ticketNumber = generateTicketNumber();

        const { data, error } = await supabase
            .from('repair_tickets')
            .insert([{
                ticket_number: ticketNumber,
                customer_id: ticketData.customerId,
                device_id: ticketData.deviceId || null,
                appointment_id: ticketData.appointmentId || null,
                status: 'new',
                priority: ticketData.priority || 'regular',
                created_by: ticketData.createdBy
            }])
            .select()
            .single();

        if (error) throw error;

        // Add initial status history
        await supabase.from('ticket_status_history').insert([{
            ticket_id: data.id,
            old_status: null,
            new_status: 'new',
            message: 'Ticket created',
            changed_by: ticketData.createdBy
        }]);

        return {
            id: data.id,
            ticketNumber: data.ticket_number,
            status: data.status,
            priority: data.priority,
            openedAt: data.opened_at
        };
    },

    // Update ticket
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.deviceId !== undefined) dbUpdates.device_id = updates.deviceId;

        const { data, error } = await supabase
            .from('repair_tickets')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update status with history tracking
    updateStatus: async (id, newStatus, message = null, changedBy = null) => {
        // Get current status
        const { data: ticket } = await supabase
            .from('repair_tickets')
            .select('status')
            .eq('id', id)
            .single();

        const oldStatus = ticket?.status;

        // Update ticket
        const updates = { status: newStatus };
        if (newStatus === 'picked_up' || newStatus === 'canceled') {
            updates.closed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('repair_tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Record status change
        await supabase.from('ticket_status_history').insert([{
            ticket_id: id,
            old_status: oldStatus,
            new_status: newStatus,
            message: message,
            changed_by: changedBy
        }]);

        return data;
    },

    // Get status history
    getStatusHistory: async (ticketId) => {
        const { data, error } = await supabase
            .from('ticket_status_history')
            .select(`
                *,
                profiles:changed_by(full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data.map(h => ({
            id: h.id,
            oldStatus: h.old_status,
            newStatus: h.new_status,
            message: h.message,
            changedBy: h.profiles?.full_name,
            changedAt: h.created_at
        }));
    },

    // Assign technician
    assignTechnician: async (ticketId, techId) => {
        const { data, error } = await supabase
            .from('ticket_assignments')
            .insert([{
                ticket_id: ticketId,
                tech_id: techId
            }])
            .select(`
                tech_id,
                assigned_at,
                profiles(full_name)
            `)
            .single();

        if (error) {
            if (error.code === '23505') return { alreadyAssigned: true };
            throw error;
        }

        return {
            techId: data.tech_id,
            techName: data.profiles?.full_name,
            assignedAt: data.assigned_at
        };
    },

    // Unassign technician
    unassignTechnician: async (ticketId, techId) => {
        const { error } = await supabase
            .from('ticket_assignments')
            .update({ unassigned_at: new Date().toISOString() })
            .eq('ticket_id', ticketId)
            .eq('tech_id', techId);

        if (error) throw error;
        return true;
    },

    // Add note
    addNote: async (ticketId, note, isInternal = true, createdBy = null) => {
        const { data, error } = await supabase
            .from('ticket_notes')
            .insert([{
                ticket_id: ticketId,
                note: note,
                is_internal: isInternal,
                created_by: createdBy
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            note: data.note,
            isInternal: data.is_internal,
            createdAt: data.created_at
        };
    },

    // Get notes
    getNotes: async (ticketId, includeInternal = true) => {
        let query = supabase
            .from('ticket_notes')
            .select(`
                *,
                profiles:created_by(full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false });

        if (!includeInternal) {
            query = query.eq('is_internal', false);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(n => ({
            id: n.id,
            note: n.note,
            isInternal: n.is_internal,
            createdBy: n.profiles?.full_name,
            createdAt: n.created_at
        }));
    },

    // Add service to ticket
    addService: async (ticketId, serviceItemId, qty, unitPrice, discount = 0, tax = 0) => {
        const lineTotal = (qty * unitPrice) - discount + tax;

        const { data, error } = await supabase
            .from('ticket_services')
            .insert([{
                ticket_id: ticketId,
                service_item_id: serviceItemId,
                qty: qty,
                unit_price: unitPrice,
                discount_amount: discount,
                tax_amount: tax,
                line_total: lineTotal
            }])
            .select(`
                *,
                items(name, sku)
            `)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            serviceName: data.items?.name,
            qty: data.qty,
            unitPrice: data.unit_price,
            total: data.line_total
        };
    },

    // Add part used
    addPart: async (ticketId, partItemId, qty, unitPrice, costAtUse = null, usedBy = null) => {
        const { data, error } = await supabase
            .from('ticket_parts_used')
            .insert([{
                ticket_id: ticketId,
                part_item_id: partItemId,
                qty: qty,
                unit_price: unitPrice,
                cost_at_use: costAtUse,
                used_by: usedBy
            }])
            .select(`
                *,
                items(name, sku)
            `)
            .single();

        if (error) throw error;
        return {
            id: data.id,
            partName: data.items?.name,
            qty: data.qty,
            unitPrice: data.unit_price,
            cost: data.cost_at_use
        };
    },

    // Get tickets by customer
    getByCustomer: async (customerId) => {
        const { data, error } = await supabase
            .from('repair_tickets')
            .select(`
                *,
                devices(device_type, brand, model)
            `)
            .eq('customer_id', customerId)
            .is('deleted_at', null)
            .order('opened_at', { ascending: false });

        if (error) return [];
        return data.map(t => ({
            id: t.id,
            ticketNumber: t.ticket_number,
            device: t.devices ? `${t.devices.brand} ${t.devices.model}` : 'Unknown',
            status: t.status,
            priority: t.priority,
            openedAt: t.opened_at,
            closedAt: t.closed_at
        }));
    },

    // Search by ticket number
    getByTicketNumber: async (ticketNumber) => {
        const { data, error } = await supabase
            .from('repair_tickets')
            .select('*')
            .ilike('ticket_number', `%${ticketNumber}%`)
            .is('deleted_at', null)
            .limit(10);

        if (error) return [];
        return data;
    },

    // Get open tickets count
    getOpenCount: async () => {
        const { count, error } = await supabase
            .from('repair_tickets')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null)
            .not('status', 'in', '("picked_up","canceled")');

        if (error) return 0;
        return count || 0;
    },

    // Get ticket statuses (for dropdown)
    getStatuses: () => [
        { value: 'new', label: 'New' },
        { value: 'diagnosing', label: 'Diagnosing' },
        { value: 'awaiting_approval', label: 'Awaiting Approval' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'on_hold', label: 'On Hold' },
        { value: 'ready', label: 'Ready for Pickup' },
        { value: 'picked_up', label: 'Picked Up' },
        { value: 'canceled', label: 'Canceled' }
    ],

    // Get priorities (for dropdown)
    getPriorities: () => [
        { value: 'regular', label: 'Regular' },
        { value: 'premium', label: 'Premium' },
        { value: 'pro', label: 'Pro (Rush)' }
    ],

    // Delete ticket (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('repair_tickets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

export default ticketsApi;

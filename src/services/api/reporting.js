// Supabase API - Reporting & Analytics Module
import { supabase } from '../supabase';

export const reportingApi = {
    // ============== DAILY METRICS ==============

    // Get metrics for a specific date
    getDailyMetrics: async (date) => {
        const { data, error } = await supabase
            .from('daily_metrics')
            .select('*')
            .eq('metric_date', date);

        if (error) return [];
        return data.reduce((acc, m) => {
            acc[m.metric_name] = m.metric_value;
            return acc;
        }, {});
    },

    // Get metrics for a date range
    getMetricsRange: async (startDate, endDate) => {
        const { data, error } = await supabase
            .from('daily_metrics')
            .select('*')
            .gte('metric_date', startDate)
            .lte('metric_date', endDate)
            .order('metric_date');

        if (error) return [];

        // Group by date
        const grouped = {};
        data.forEach(m => {
            if (!grouped[m.metric_date]) {
                grouped[m.metric_date] = {};
            }
            grouped[m.metric_date][m.metric_name] = m.metric_value;
        });

        return Object.entries(grouped).map(([date, metrics]) => ({
            date,
            ...metrics
        }));
    },

    // Record daily metric
    recordMetric: async (date, metricName, value) => {
        // Upsert metric
        const { data, error } = await supabase
            .from('daily_metrics')
            .upsert([{
                metric_date: date,
                metric_name: metricName,
                metric_value: value
            }], {
                onConflict: 'metric_date,metric_name'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Calculate today's metrics (run periodically)
    calculateTodayMetrics: async () => {
        const today = new Date().toISOString().split('T')[0];
        const metrics = {};

        // Total sales
        const { data: sales } = await supabase
            .from('sales_orders')
            .select('total')
            .gte('closed_at', `${today}T00:00:00`)
            .lte('closed_at', `${today}T23:59:59`)
            .eq('status', 'completed');

        metrics.sales_count = sales?.length || 0;
        metrics.sales_total = sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;

        // New tickets
        const { count: ticketCount } = await supabase
            .from('repair_tickets')
            .select('*', { count: 'exact', head: true })
            .gte('opened_at', `${today}T00:00:00`)
            .lte('opened_at', `${today}T23:59:59`);

        metrics.tickets_created = ticketCount || 0;

        // Completed tickets
        const { count: completedCount } = await supabase
            .from('repair_tickets')
            .select('*', { count: 'exact', head: true })
            .gte('closed_at', `${today}T00:00:00`)
            .lte('closed_at', `${today}T23:59:59`)
            .eq('status', 'picked_up');

        metrics.tickets_completed = completedCount || 0;

        // New customers
        const { count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`);

        metrics.new_customers = customerCount || 0;

        // Store each metric
        for (const [name, value] of Object.entries(metrics)) {
            await reportingApi.recordMetric(today, name, value);
        }

        return metrics;
    },

    // ============== AUDIT LOG ==============

    // Get audit log entries
    getAuditLog: async (filters = {}) => {
        let query = supabase
            .from('audit_log')
            .select(`
                *,
                profiles:user_id(full_name)
            `)
            .order('created_at', { ascending: false });

        if (filters.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }
        if (filters.entityId) {
            query = query.eq('entity_id', filters.entityId);
        }
        if (filters.action) {
            query = query.eq('action', filters.action);
        }
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        } else {
            query = query.limit(100);
        }

        const { data, error } = await query;
        if (error) return [];

        return data.map(log => ({
            id: log.id,
            action: log.action,
            entityType: log.entity_type,
            entityId: log.entity_id,
            oldValues: log.old_values,
            newValues: log.new_values,
            ipAddress: log.ip_address,
            userId: log.user_id,
            userName: log.profiles?.full_name,
            createdAt: log.created_at
        }));
    },

    // Log an action
    logAction: async (actionData) => {
        const { data, error } = await supabase
            .from('audit_log')
            .insert([{
                action: actionData.action, // 'create', 'update', 'delete', etc.
                entity_type: actionData.entityType,
                entity_id: actionData.entityId,
                old_values: actionData.oldValues || null,
                new_values: actionData.newValues || null,
                user_id: actionData.userId || null,
                ip_address: actionData.ipAddress || null
            }])
            .select()
            .single();

        if (error) throw error;
        return { id: data.id };
    },

    // ============== DASHBOARD STATS ==============

    // Get dashboard summary
    getDashboardSummary: async () => {
        const today = new Date().toISOString().split('T')[0];
        const summary = {};

        // Open tickets
        const { count: openTickets } = await supabase
            .from('repair_tickets')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null)
            .not('status', 'in', '("picked_up","canceled")');
        summary.openTickets = openTickets || 0;

        // Today's appointments
        const { count: todayAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('scheduled_date', today)
            .in('status', ['scheduled', 'confirmed']);
        summary.todayAppointments = todayAppointments || 0;

        // Low stock items
        const { data: lowStock } = await supabase
            .from('stock_levels')
            .select(`
                qty_on_hand,
                items!inner(reorder_point)
            `)
            .lt('qty_on_hand', 'items.reorder_point');
        summary.lowStockItems = lowStock?.length || 0;

        // Today's revenue
        const { data: todaySales } = await supabase
            .from('sales_orders')
            .select('total')
            .gte('closed_at', `${today}T00:00:00`)
            .lte('closed_at', `${today}T23:59:59`)
            .eq('status', 'completed');
        summary.todayRevenue = todaySales?.reduce((s, o) => s + (o.total || 0), 0) || 0;

        // Pending invoices
        const { count: pendingInvoices } = await supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .in('status', ['sent', 'unpaid', 'partially_paid']);
        summary.pendingInvoices = pendingInvoices || 0;

        return summary;
    },

    // Get tickets by status (for charts)
    getTicketsByStatus: async () => {
        const { data, error } = await supabase
            .from('repair_tickets')
            .select('status')
            .is('deleted_at', null);

        if (error) return [];

        const counts = {};
        data.forEach(t => {
            counts[t.status] = (counts[t.status] || 0) + 1;
        });

        return Object.entries(counts).map(([status, count]) => ({
            status,
            count
        }));
    },

    // Get revenue by day (for charts)
    getRevenueByDay: async (days = 7) => {
        const results = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const { data } = await supabase
                .from('sales_orders')
                .select('total')
                .gte('closed_at', `${dateStr}T00:00:00`)
                .lte('closed_at', `${dateStr}T23:59:59`)
                .eq('status', 'completed');

            results.push({
                date: dateStr,
                revenue: data?.reduce((s, o) => s + (o.total || 0), 0) || 0
            });
        }

        return results;
    }
};

export default reportingApi;

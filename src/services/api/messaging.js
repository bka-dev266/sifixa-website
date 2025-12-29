// Supabase API - Messaging & Notifications Module
import { supabase } from '../supabase';

export const messagingApi = {
    // ============== CONVERSATIONS ==============

    // Get conversations for a customer
    getConversations: async (customerId) => {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                repair_tickets(ticket_number)
            `)
            .eq('customer_id', customerId)
            .order('updated_at', { ascending: false });

        if (error) return [];
        return data.map(c => ({
            id: c.id,
            customerId: c.customer_id,
            ticketId: c.ticket_id,
            ticketNumber: c.repair_tickets?.ticket_number,
            subject: c.subject,
            status: c.status,
            createdAt: c.created_at,
            updatedAt: c.updated_at
        }));
    },

    // Create conversation
    createConversation: async (customerId, ticketId = null, subject = null) => {
        const { data, error } = await supabase
            .from('conversations')
            .insert([{
                customer_id: customerId,
                ticket_id: ticketId,
                subject: subject,
                status: 'open'
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            customerId: data.customer_id,
            ticketId: data.ticket_id,
            subject: data.subject
        };
    },

    // Close conversation
    closeConversation: async (conversationId) => {
        const { error } = await supabase
            .from('conversations')
            .update({ status: 'closed' })
            .eq('id', conversationId);

        if (error) throw error;
        return true;
    },

    // ============== MESSAGES ==============

    // Get messages in a conversation
    getMessages: async (conversationId) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles:sender_id(full_name)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at');

        if (error) return [];
        return data.map(m => ({
            id: m.id,
            senderType: m.sender_type,
            senderId: m.sender_id,
            senderName: m.profiles?.full_name,
            channel: m.channel,
            subject: m.subject,
            body: m.body,
            status: m.status,
            sentAt: m.sent_at,
            readAt: m.read_at,
            createdAt: m.created_at
        }));
    },

    // Send message
    sendMessage: async (messageData) => {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: messageData.conversationId,
                sender_type: messageData.senderType, // 'customer' or 'staff'
                sender_id: messageData.senderId,
                channel: messageData.channel || 'in_app',
                subject: messageData.subject || null,
                body: messageData.body,
                status: 'sent',
                sent_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Update conversation timestamp
        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', messageData.conversationId);

        return {
            id: data.id,
            body: data.body,
            sentAt: data.sent_at
        };
    },

    // Mark message as read
    markAsRead: async (messageId) => {
        const { error } = await supabase
            .from('messages')
            .update({
                status: 'read',
                read_at: new Date().toISOString()
            })
            .eq('id', messageId);

        if (error) throw error;
        return true;
    },

    // Get unread message count
    getUnreadCount: async (customerId) => {
        const { count, error } = await supabase
            .from('messages')
            .select('*, conversations!inner(customer_id)', { count: 'exact', head: true })
            .eq('conversations.customer_id', customerId)
            .eq('sender_type', 'staff')
            .is('read_at', null);

        if (error) return 0;
        return count || 0;
    },

    // ============== NOTIFICATIONS ==============

    // Get notifications for a customer
    getNotifications: async (customerId, limit = 20) => {
        const { data, error } = await supabase
            .from('notification_events')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data.map(n => ({
            id: n.id,
            type: n.type,
            ticketId: n.ticket_id,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            readAt: n.read_at,
            createdAt: n.created_at
        }));
    },

    // Create notification
    createNotification: async (notificationData) => {
        const { data, error } = await supabase
            .from('notification_events')
            .insert([{
                customer_id: notificationData.customerId,
                ticket_id: notificationData.ticketId || null,
                type: notificationData.type, // 'repair', 'promo', 'reminder', 'system'
                title: notificationData.title,
                message: notificationData.message || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            createdAt: data.created_at
        };
    },

    // Mark notification as read
    markNotificationRead: async (notificationId) => {
        const { error } = await supabase
            .from('notification_events')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    },

    // Mark all notifications as read
    markAllNotificationsRead: async (customerId) => {
        const { error } = await supabase
            .from('notification_events')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('customer_id', customerId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    },

    // Get unread notification count
    getUnreadNotificationCount: async (customerId) => {
        const { count, error } = await supabase
            .from('notification_events')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('is_read', false);

        if (error) return 0;
        return count || 0;
    },

    // ============== MESSAGE TEMPLATES ==============

    // Get all templates
    getTemplates: async () => {
        const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) return [];
        return data.map(t => ({
            id: t.id,
            name: t.name,
            templateType: t.template_type,
            subject: t.subject,
            body: t.body,
            channels: t.channels,
            isActive: t.is_active
        }));
    },

    // Get template by type
    getTemplateByType: async (templateType) => {
        const { data, error } = await supabase
            .from('message_templates')
            .select('*')
            .eq('template_type', templateType)
            .eq('is_active', true)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            subject: data.subject,
            body: data.body,
            channels: data.channels
        };
    },

    // Create template
    createTemplate: async (templateData) => {
        const { data, error } = await supabase
            .from('message_templates')
            .insert([{
                name: templateData.name,
                template_type: templateData.templateType,
                subject: templateData.subject || null,
                body: templateData.body,
                channels: templateData.channels || [],
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update template
    updateTemplate: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.templateType !== undefined) dbUpdates.template_type = updates.templateType;
        if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
        if (updates.body !== undefined) dbUpdates.body = updates.body;
        if (updates.channels !== undefined) dbUpdates.channels = updates.channels;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('message_templates')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get notification types
    getNotificationTypes: () => [
        { value: 'repair', label: 'Repair Update' },
        { value: 'promo', label: 'Promotion' },
        { value: 'reminder', label: 'Reminder' },
        { value: 'system', label: 'System' }
    ],

    // Get message channels
    getChannels: () => [
        { value: 'in_app', label: 'In-App' },
        { value: 'sms', label: 'SMS' },
        { value: 'email', label: 'Email' }
    ]
};

export default messagingApi;

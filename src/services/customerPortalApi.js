// ====================================================
// SIFIXA Customer Portal API
// API service for customer portal features
// Connects to Supabase tables created by migration_customer_portal.sql
// ====================================================

import { supabase } from './supabase';

// ==================== NOTIFICATIONS API ====================
export const notificationsApi = {
    // Get all notifications for a customer
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_notifications')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data || [];
    },

    // Mark single notification as read
    async markAsRead(notificationId) {
        const { error } = await supabase
            .from('customer_notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw new Error(error.message);
        return true;
    },

    // Mark all notifications as read for a customer
    async markAllAsRead(customerId) {
        const { error } = await supabase
            .from('customer_notifications')
            .update({ read: true })
            .eq('customer_id', customerId)
            .eq('read', false);

        if (error) throw new Error(error.message);
        return true;
    },

    // Create a notification (for system use)
    async create(notificationData) {
        const { data, error } = await supabase
            .from('customer_notifications')
            .insert([notificationData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};

// ==================== LOYALTY API ====================
export const loyaltyApi = {
    // Get customer loyalty data
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_loyalty')
            .select('*')
            .eq('customer_id', customerId)
            .single();

        if (error) {
            // Return default loyalty if not found or table doesn't exist (406)
            // Silently handle - these tables are optional for v1
            return { points: 0, tier: 'Bronze', lifetime_points: 0 };
        }
        return data;
    },

    // Get available rewards
    async getRewards() {
        const { data, error } = await supabase
            .from('loyalty_rewards')
            .select('*')
            .eq('active', true)
            .order('points_cost', { ascending: true });

        if (error) {
            console.error('Error fetching rewards:', error);
            return [];
        }
        return data || [];
    },

    // Redeem a reward
    async redeemReward(customerId, rewardId) {
        // Get reward details
        const { data: reward, error: rewardError } = await supabase
            .from('loyalty_rewards')
            .select('*')
            .eq('id', rewardId)
            .single();

        if (rewardError) throw new Error('Reward not found');

        // Get customer loyalty
        const loyalty = await this.getByCustomer(customerId);
        if (!loyalty || loyalty.points < reward.points_cost) {
            throw new Error('Insufficient points');
        }

        // Create redemption record
        const { error: redemptionError } = await supabase
            .from('loyalty_redemptions')
            .insert([{
                customer_id: customerId,
                reward_id: rewardId,
                points_spent: reward.points_cost
            }]);

        if (redemptionError) throw new Error(redemptionError.message);

        // Deduct points
        const { error: updateError } = await supabase
            .from('customer_loyalty')
            .update({ points: loyalty.points - reward.points_cost })
            .eq('customer_id', customerId);

        if (updateError) throw new Error(updateError.message);

        return {
            reward,
            remainingPoints: loyalty.points - reward.points_cost
        };
    },

    // Get redemption history
    async getRedemptionHistory(customerId) {
        const { data, error } = await supabase
            .from('loyalty_redemptions')
            .select(`
                *,
                reward:loyalty_rewards(*)
            `)
            .eq('customer_id', customerId)
            .order('redeemed_at', { ascending: false });

        if (error) {
            console.error('Error fetching redemptions:', error);
            return [];
        }
        return data || [];
    }
};

// ==================== WARRANTIES API ====================
export const warrantiesApi = {
    // Get customer warranties
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_warranties')
            .select('*')
            .eq('customer_id', customerId)
            .order('warranty_expiry', { ascending: true });

        if (error) {
            console.error('Error fetching warranties:', error);
            return [];
        }
        return data || [];
    },

    // Claim a warranty
    async claimWarranty(warrantyId, description) {
        const { data, error } = await supabase
            .from('customer_warranties')
            .update({
                status: 'claimed',
                claim_date: new Date().toISOString().split('T')[0],
                claim_description: description
            })
            .eq('id', warrantyId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};

// ==================== INVOICES API ====================
export const invoicesApi = {
    // Get customer invoices
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_invoices')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            return [];
        }
        return data || [];
    },

    // Get single invoice
    async getById(invoiceId) {
        const { data, error } = await supabase
            .from('customer_invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};

// ==================== REVIEWS API ====================
export const reviewsApi = {
    // Get customer reviews
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_reviews')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
        return data || [];
    },

    // Submit a review
    async create(reviewData) {
        const { data, error } = await supabase
            .from('customer_reviews')
            .insert([reviewData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Get bookings available for review
    async getReviewableBookings(customerId) {
        // Get completed bookings that haven't been reviewed
        const { data: bookings, error: bookingsError } = await supabase
            .from('appointments')
            .select('*')
            .eq('customer_id', customerId)
            .eq('status', 'Completed');

        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return [];
        }

        const { data: reviews, error: reviewsError } = await supabase
            .from('customer_reviews')
            .select('booking_id')
            .eq('customer_id', customerId);

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
            return bookings || [];
        }

        const reviewedBookingIds = new Set(reviews?.map(r => r.booking_id) || []);
        return (bookings || []).filter(b => !reviewedBookingIds.has(b.id));
    }
};

// ==================== SETTINGS API ====================
export const settingsApi = {
    // Get customer settings
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_settings')
            .select('*')
            .eq('customer_id', customerId)
            .single();

        // Return defaults if not found or table doesn't exist (406)
        // Silently handle - these tables are optional for v1
        if (error) {
            return {
                email_notifications: true,
                sms_notifications: true,
                push_notifications: true,
                marketing_emails: false,
                language: 'en',
                timezone: 'America/New_York',
                two_factor_enabled: false,
                reminders: { appointmentReminder: true, repairUpdates: true, pickupReminder: true },
                privacy: { shareDataForAnalytics: false, allowMarketingCalls: false }
            };
        }
        return data;
    },

    // Update customer settings
    async update(customerId, updates) {
        const { data, error } = await supabase
            .from('customer_settings')
            .upsert({
                customer_id: customerId,
                ...updates,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};

// ==================== REFERRALS API ====================
export const referralsApi = {
    // Get or generate referral code for customer
    async getOrCreateCode(customerId) {
        try {
            // Check for existing referral record
            const { data: existing, error } = await supabase
                .from('customer_referrals')
                .select('referral_code')
                .eq('referrer_id', customerId)
                .limit(1);

            // If table doesn't exist (406/409), generate a local code
            if (error) {
                return 'SFX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            }

            if (existing && existing.length > 0) {
                return existing[0].referral_code;
            }

            // Generate new code
            const code = 'SFX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            // Try to create placeholder referral record (may fail if table doesn't exist)
            await supabase
                .from('customer_referrals')
                .insert([{
                    referrer_id: customerId,
                    referral_code: code,
                    status: 'pending'
                }]);

            return code;
        } catch {
            // Fallback if any error
            return 'SFX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        }
    },

    // Get all referrals for a customer
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_referrals')
            .select('*')
            .eq('referrer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching referrals:', error);
            return [];
        }
        return data || [];
    },

    // Send a referral invite
    async sendInvite(customerId, email, name) {
        const code = await this.getOrCreateCode(customerId);

        const { data, error } = await supabase
            .from('customer_referrals')
            .insert([{
                referrer_id: customerId,
                referral_code: code,
                referred_email: email,
                referred_name: name,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // TODO: Send actual email via edge function
        console.log(`Referral invite sent to ${email} with code ${code}`);

        return data;
    }
};

// ==================== FAVORITES API ====================
export const favoritesApi = {
    // Get customer favorites
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_favorites')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching favorites:', error);
            return [];
        }
        return data || [];
    },

    // Add a favorite
    async add(customerId, serviceData) {
        const { data, error } = await supabase
            .from('customer_favorites')
            .insert([{ customer_id: customerId, ...serviceData }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Remove a favorite
    async remove(customerId, favoriteId) {
        const { error } = await supabase
            .from('customer_favorites')
            .delete()
            .eq('id', favoriteId)
            .eq('customer_id', customerId);

        if (error) throw new Error(error.message);
        return true;
    }
};

// ==================== PAYMENT METHODS API ====================
export const paymentMethodsApi = {
    // Get customer payment methods
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('customer_payment_methods')
            .select('*')
            .eq('customer_id', customerId)
            .order('is_default', { ascending: false });

        if (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
        return data || [];
    },

    // Add a payment method
    async add(customerId, cardData) {
        // If setting as default, unset other defaults first
        if (cardData.is_default) {
            await supabase
                .from('customer_payment_methods')
                .update({ is_default: false })
                .eq('customer_id', customerId);
        }

        const { data, error } = await supabase
            .from('customer_payment_methods')
            .insert([{ customer_id: customerId, ...cardData }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Remove a payment method
    async remove(customerId, methodId) {
        const { error } = await supabase
            .from('customer_payment_methods')
            .delete()
            .eq('id', methodId)
            .eq('customer_id', customerId);

        if (error) throw new Error(error.message);
        return true;
    },

    // Set a payment method as default
    async setDefault(customerId, methodId) {
        // Unset all defaults first
        await supabase
            .from('customer_payment_methods')
            .update({ is_default: false })
            .eq('customer_id', customerId);

        // Set the new default
        const { error } = await supabase
            .from('customer_payment_methods')
            .update({ is_default: true })
            .eq('id', methodId);

        if (error) throw new Error(error.message);
        return true;
    }
};

// ==================== CHAT HISTORY API ====================
export const chatHistoryApi = {
    // Get customer chat history
    async getByCustomer(customerId, limit = 50) {
        const { data, error } = await supabase
            .from('customer_chat_history')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
        return data || [];
    },

    // Send a chat message
    async sendMessage(customerId, message, senderType = 'customer', attachmentUrl = null) {
        const { data, error } = await supabase
            .from('customer_chat_history')
            .insert([{
                customer_id: customerId,
                message,
                sender_type: senderType,
                attachment_url: attachmentUrl
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Mark messages as read
    async markAsRead(customerId) {
        const { error } = await supabase
            .from('customer_chat_history')
            .update({ read: true })
            .eq('customer_id', customerId)
            .eq('read', false);

        if (error) throw new Error(error.message);
        return true;
    }
};

// ==================== CUSTOMER DEVICES API ====================
// Uses existing devices table

// Helper to map frontend device types to database device types
const mapDeviceType = (frontendType) => {
    const typeMap = {
        'smartphone': 'phone',
        'smartwatch': 'watch',
        'phone': 'phone',
        'tablet': 'tablet',
        'laptop': 'laptop',
        'watch': 'watch',
        'desktop': 'desktop',
        'console': 'console',
        'other': 'other'
    };
    return typeMap[frontendType] || 'phone';
};

export const customerDevicesApi = {
    // Get devices for a customer
    // Maps database column names back to frontend field names
    async getByCustomer(customerId) {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching devices:', error);
            return [];
        }

        // Map database columns to frontend field names
        return (data || []).map(device => ({
            id: device.id,
            customer_id: device.customer_id,
            type: device.device_type === 'phone' ? 'smartphone' : device.device_type === 'watch' ? 'smartwatch' : device.device_type,
            brand: device.brand,
            model: device.model,
            name: device.model, // Use model as name for display
            color: device.color,
            serialNumber: device.serial_number,
            notes: device.condition_notes,
            addedDate: device.created_at,
            created_at: device.created_at
        }));
    },

    // Add a new device
    // Maps frontend field names to database column names
    async create(customerId, deviceData) {
        // Map frontend fields to database columns
        const dbData = {
            customer_id: customerId,
            device_type: mapDeviceType(deviceData.type), // frontend: type -> db: device_type with value mapping
            brand: deviceData.brand,
            model: deviceData.name ? `${deviceData.name} - ${deviceData.model}` : deviceData.model, // include name in model
            color: deviceData.color,
            serial_number: deviceData.serialNumber, // frontend: serialNumber -> db: serial_number
            condition_notes: deviceData.notes // frontend: notes -> db: condition_notes
        };

        const { data, error } = await supabase
            .from('devices')
            .insert([dbData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Update a device
    // Maps frontend field names to database column names
    async update(deviceId, updates) {
        // Map frontend fields to database columns
        const dbUpdates = {};
        if (updates.type !== undefined) dbUpdates.device_type = mapDeviceType(updates.type);
        if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
        if (updates.model !== undefined) dbUpdates.model = updates.name ? `${updates.name} - ${updates.model}` : updates.model;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber;
        if (updates.notes !== undefined) dbUpdates.condition_notes = updates.notes;

        const { data, error } = await supabase
            .from('devices')
            .update(dbUpdates)
            .eq('id', deviceId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Delete a device
    async delete(deviceId) {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', deviceId);

        if (error) throw new Error(error.message);
        return true;
    }
};

// ==================== SUPPORT TICKETS API ====================
export const supportTicketsApi = {
    // Get all tickets for a customer
    async getByCustomer(customerId) {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) {
                // Return empty array if table doesn't exist
                return [];
            }
            return data || [];
        } catch {
            return [];
        }
    },

    // Create a new ticket
    async create(customerId, ticketData) {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert([{
                customer_id: customerId,
                subject: ticketData.subject,
                description: ticketData.description,
                category: ticketData.category || 'general',
                priority: ticketData.priority || 'medium',
                status: 'open'
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Add initial message
        await this.addMessage(data.id, customerId, ticketData.description, 'customer');

        return data;
    },

    // Get messages for a ticket
    async getMessages(ticketId) {
        const { data, error } = await supabase
            .from('support_ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) {
            return [];
        }
        return data || [];
    },

    // Add a message to a ticket
    async addMessage(ticketId, senderId, message, senderType = 'customer') {
        const { data, error } = await supabase
            .from('support_ticket_messages')
            .insert([{
                ticket_id: ticketId,
                sender_id: senderId,
                sender_type: senderType,
                message: message
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Update ticket status
    async updateStatus(ticketId, status) {
        const updates = { status };
        if (status === 'resolved' || status === 'closed') {
            updates.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('id', ticketId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
};

// ==================== PROFILE API ====================
export const profileApi = {
    // Upload avatar image to Supabase Storage
    async uploadAvatar(customerId, file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${customerId}-${Date.now()}.${fileExt}`;
        const filePath = `${customerId}/${fileName}`;

        // Upload to storage bucket
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            // If bucket doesn't exist, return a helpful error
            if (uploadError.message.includes('not found')) {
                throw new Error('Avatar storage not configured. Please run the storage migration.');
            }
            throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', customerId);

        if (updateError) {
            console.warn('Could not update profile with avatar URL:', updateError);
        }

        return publicUrl;
    },

    // Get avatar URL for a customer
    async getAvatarUrl(customerId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', customerId)
            .single();

        if (error || !data?.avatar_url) {
            return null;
        }
        return data.avatar_url;
    },

    // Delete avatar
    async deleteAvatar(customerId) {
        // Get current avatar path
        const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', customerId)
            .single();

        if (data?.avatar_url) {
            // Extract file path from URL
            const urlParts = data.avatar_url.split('/avatars/');
            if (urlParts.length > 1) {
                const filePath = `avatars/${urlParts[1]}`;
                await supabase.storage.from('avatars').remove([filePath]);
            }
        }

        // Clear avatar URL in profile
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', customerId);

        if (error) throw new Error(error.message);
        return true;
    }
};

// ==================== UNIFIED EXPORT ====================
export const customerPortalApi = {
    notifications: notificationsApi,
    loyalty: loyaltyApi,
    warranties: warrantiesApi,
    invoices: invoicesApi,
    reviews: reviewsApi,
    settings: settingsApi,
    referrals: referralsApi,
    devices: customerDevicesApi,
    favorites: favoritesApi,
    paymentMethods: paymentMethodsApi,
    chat: chatHistoryApi,
    supportTickets: supportTicketsApi,
    profile: profileApi
};

export default customerPortalApi;

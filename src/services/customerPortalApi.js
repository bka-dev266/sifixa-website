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
            // Return default loyalty if not found
            if (error.code === 'PGRST116') {
                return { points: 0, tier: 'Bronze', lifetime_points: 0 };
            }
            console.error('Error fetching loyalty:', error);
            return null;
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

        if (error) {
            // Return defaults if not found
            if (error.code === 'PGRST116') {
                return {
                    email_notifications: true,
                    sms_notifications: true,
                    push_notifications: true,
                    marketing_emails: false,
                    language: 'en',
                    timezone: 'America/New_York',
                    two_factor_enabled: false
                };
            }
            console.error('Error fetching settings:', error);
            return null;
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
        // Check for existing referral record
        const { data: existing } = await supabase
            .from('customer_referrals')
            .select('referral_code')
            .eq('referrer_id', customerId)
            .limit(1);

        if (existing && existing.length > 0) {
            return existing[0].referral_code;
        }

        // Generate new code
        const code = 'SFX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create placeholder referral record to store the code
        await supabase
            .from('customer_referrals')
            .insert([{
                referrer_id: customerId,
                referral_code: code,
                status: 'pending'
            }]);

        return code;
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

// ==================== CUSTOMER DEVICES API ====================
// Uses existing devices table
export const customerDevicesApi = {
    // Get devices for a customer
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
        return data || [];
    },

    // Add a new device
    async create(customerId, deviceData) {
        const { data, error } = await supabase
            .from('devices')
            .insert([{
                customer_id: customerId,
                ...deviceData
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // Update a device
    async update(deviceId, updates) {
        const { data, error } = await supabase
            .from('devices')
            .update(updates)
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

// ==================== UNIFIED EXPORT ====================
export const customerPortalApi = {
    notifications: notificationsApi,
    loyalty: loyaltyApi,
    warranties: warrantiesApi,
    invoices: invoicesApi,
    reviews: reviewsApi,
    settings: settingsApi,
    referrals: referralsApi,
    devices: customerDevicesApi
};

export default customerPortalApi;

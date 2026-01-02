// Supabase API - Discounts & Coupons Module
import { supabase } from '../supabase';

export const discountsApi = {
    // Get all discounts
    getAll: async () => {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .order('name');

        if (error) return [];
        return data.map(d => ({
            id: d.id,
            name: d.name,
            discountType: d.discount_type,
            value: d.value,
            isActive: d.is_active,
            startAt: d.start_at,
            endAt: d.end_at,
            createdAt: d.created_at
        }));
    },

    // Get active discounts
    getActive: async () => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('is_active', true)
            .or(`start_at.is.null,start_at.lte.${now}`)
            .or(`end_at.is.null,end_at.gte.${now}`)
            .order('name');

        if (error) return [];
        return data.map(d => ({
            id: d.id,
            name: d.name,
            discountType: d.discount_type,
            value: d.value
        }));
    },

    // Create discount
    create: async (discountData) => {
        const { data, error } = await supabase
            .from('discounts')
            .insert([{
                name: discountData.name,
                discount_type: discountData.discountType, // 'percent' or 'fixed'
                value: discountData.value,
                is_active: discountData.isActive !== false,
                start_at: discountData.startAt || null,
                end_at: discountData.endAt || null
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            discountType: data.discount_type,
            value: data.value
        };
    },

    // Update discount
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
        if (updates.value !== undefined) dbUpdates.value = updates.value;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.startAt !== undefined) dbUpdates.start_at = updates.startAt;
        if (updates.endAt !== undefined) dbUpdates.end_at = updates.endAt;

        const { data, error } = await supabase
            .from('discounts')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete discount
    delete: async (id) => {
        const { error } = await supabase
            .from('discounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // ============== COUPONS ==============

    // Get all coupons
    getCoupons: async () => {
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                discounts(name, discount_type, value)
            `)
            .order('code');

        if (error) return [];
        return data.map(c => ({
            id: c.id,
            code: c.code,
            discountId: c.discount_id,
            discountName: c.discounts?.name,
            discountType: c.discounts?.discount_type,
            discountValue: c.discounts?.value,
            maxUses: c.max_uses,
            timesUsed: c.times_used,
            isActive: c.is_active,
            validFrom: c.valid_from,
            validTo: c.valid_to,
            createdAt: c.created_at
        }));
    },

    // Create coupon
    createCoupon: async (couponData) => {
        const { data, error } = await supabase
            .from('coupons')
            .insert([{
                code: couponData.code.toUpperCase(),
                discount_id: couponData.discountId,
                max_uses: couponData.maxUses || null,
                is_active: couponData.isActive !== false,
                valid_from: couponData.validFrom || null,
                valid_to: couponData.validTo || null
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Coupon code already exists');
            }
            throw error;
        }
        return {
            id: data.id,
            code: data.code,
            isActive: data.is_active
        };
    },

    // Validate coupon
    validateCoupon: async (code) => {

        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                discounts(name, discount_type, value, is_active)
            `)
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return { valid: false, error: 'Invalid coupon code' };
        }

        // Check if discount is active
        if (!data.discounts?.is_active) {
            return { valid: false, error: 'Discount is no longer active' };
        }

        // Check validity dates
        if (data.valid_from && new Date(data.valid_from) > new Date()) {
            return { valid: false, error: 'Coupon is not yet valid' };
        }
        if (data.valid_to && new Date(data.valid_to) < new Date()) {
            return { valid: false, error: 'Coupon has expired' };
        }

        // Check max uses
        if (data.max_uses && data.times_used >= data.max_uses) {
            return { valid: false, error: 'Coupon has reached maximum uses' };
        }

        return {
            valid: true,
            coupon: {
                id: data.id,
                code: data.code,
                discountType: data.discounts.discount_type,
                discountValue: data.discounts.value,
                discountName: data.discounts.name
            }
        };
    },

    // Update coupon
    updateCoupon: async (id, updates) => {
        const dbUpdates = {};
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.maxUses !== undefined) dbUpdates.max_uses = updates.maxUses;
        if (updates.validFrom !== undefined) dbUpdates.valid_from = updates.validFrom;
        if (updates.validTo !== undefined) dbUpdates.valid_to = updates.validTo;

        const { data, error } = await supabase
            .from('coupons')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete coupon
    deleteCoupon: async (id) => {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get coupon usage stats
    getCouponStats: async (couponId) => {
        const { data, error } = await supabase
            .from('coupon_redemptions')
            .select(`
                id,
                redeemed_at,
                sales_orders(order_number, total)
            `)
            .eq('coupon_id', couponId)
            .order('redeemed_at', { ascending: false });

        if (error) return [];
        return data.map(r => ({
            redeemedAt: r.redeemed_at,
            orderNumber: r.sales_orders?.order_number,
            orderTotal: r.sales_orders?.total
        }));
    },

    // Get discount types
    getDiscountTypes: () => [
        { value: 'percent', label: 'Percentage' },
        { value: 'fixed', label: 'Fixed Amount' }
    ]
};

export default discountsApi;

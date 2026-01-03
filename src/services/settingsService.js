// ====================================================
// Settings Service
// Database access for site settings, footer, and social
// ====================================================

import { supabase } from './supabase';

// Cache for footer data
const FOOTER_CACHE_KEY = 'sifixa_footer_cache';
const FOOTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached footer data if valid
 */
const getCachedFooter = () => {
    try {
        const cached = sessionStorage.getItem(FOOTER_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < FOOTER_CACHE_TTL) {
                return data;
            }
        }
    } catch (e) {
        console.error('Footer cache read error:', e);
    }
    return null;
};

/**
 * Cache footer data in sessionStorage
 */
const setCachedFooter = (data) => {
    try {
        sessionStorage.setItem(FOOTER_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Footer cache write error:', e);
    }
};

/**
 * Clear footer cache - call after admin updates
 */
export const clearFooterCache = () => {
    try {
        sessionStorage.removeItem(FOOTER_CACHE_KEY);
    } catch (e) {
        console.error('Failed to clear footer cache:', e);
    }
};

/**
 * Get all footer data in one call
 */
export const getFooterData = async () => {
    // Check cache first
    const cached = getCachedFooter();
    if (cached) return cached;

    try {
        const [settingsRes, socialRes, linksRes] = await Promise.all([
            // Get site settings
            supabase
                .from('site_settings')
                .select('setting_key, setting_value'),

            // Get social links
            supabase
                .from('social_links')
                .select('*')
                .eq('is_active', true)
                .order('display_order'),

            // Get footer links
            supabase
                .from('footer_links')
                .select('*')
                .eq('is_active', true)
                .order('display_order')
        ]);

        // Parse settings into object
        const settings = {};
        settingsRes.data?.forEach(item => {
            settings[item.setting_key] = item.setting_value;
        });

        // Group links by column_key
        const links = {
            quick_links: [],
            services: [],
            legal: []
        };
        linksRes.data?.forEach(link => {
            if (links[link.column_key]) {
                links[link.column_key].push(link);
            }
        });

        const result = {
            settings: {
                brand: settings.brand || {},
                contact: settings.contact || {},
                copyright: settings.copyright?.text || null
            },
            socialLinks: socialRes.data || [],
            links
        };

        // Cache result
        setCachedFooter(result);
        return result;
    } catch (error) {
        console.error('Failed to load footer data:', error);
        return null;
    }
};

/**
 * Get a single site setting
 */
export const getSetting = async (key) => {
    const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();

    if (error) return null;
    return data?.setting_value;
};

/**
 * Update a site setting (admin only)
 */
export const updateSetting = async (key, value) => {
    const { data, error } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: key,
            setting_value: value,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    clearFooterCache();
    return data;
};

/**
 * Get all social links (for admin)
 */
export const getSocialLinksAdmin = async () => {
    const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order');

    if (error) throw error;
    return data || [];
};

/**
 * Update social link (admin only)
 */
export const updateSocialLink = async (id, updates) => {
    const { data, error } = await supabase
        .from('social_links')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    clearFooterCache();
    return data;
};

/**
 * Create social link (admin only)
 */
export const createSocialLink = async (linkData) => {
    const { data, error } = await supabase
        .from('social_links')
        .insert([linkData])
        .select()
        .single();

    if (error) throw error;
    clearFooterCache();
    return data;
};

/**
 * Delete social link (admin only)
 */
export const deleteSocialLink = async (id) => {
    const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

    if (error) throw error;
    clearFooterCache();
    return true;
};

/**
 * Get all footer links (for admin)
 */
export const getFooterLinksAdmin = async () => {
    const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .order('column_key')
        .order('display_order');

    if (error) throw error;
    return data || [];
};

/**
 * Update footer link (admin only)
 */
export const updateFooterLink = async (id, updates) => {
    const { data, error } = await supabase
        .from('footer_links')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    clearFooterCache();
    return data;
};

/**
 * Create footer link (admin only)
 */
export const createFooterLink = async (linkData) => {
    const { data, error } = await supabase
        .from('footer_links')
        .insert([linkData])
        .select()
        .single();

    if (error) throw error;
    clearFooterCache();
    return data;
};

/**
 * Delete footer link (admin only)
 */
export const deleteFooterLink = async (id) => {
    const { error } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id);

    if (error) throw error;
    clearFooterCache();
    return true;
};

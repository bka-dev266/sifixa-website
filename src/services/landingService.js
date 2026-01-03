// ====================================================
// Landing Page CMS Service
// All database access for landing page content
// ====================================================

import { supabase } from './supabase';

// Cache key for sessionStorage
const LANDING_CACHE_KEY = 'sifixa_landing_cache';
const CACHE_TTL = 1 * 60 * 1000; // 1 minute (reduced for faster updates)

/**
 * Clear the landing page cache - call this after admin updates content
 */
export const clearLandingCache = () => {
    try {
        sessionStorage.removeItem(LANDING_CACHE_KEY);
        console.log('Landing cache cleared');
    } catch (e) {
        console.error('Failed to clear cache:', e);
    }
};

/**
 * Fetch with retry logic for reliability
 * @param {Function} queryFn - async function that returns { data, error }
 * @param {number} retries - number of retries (default 2)
 * @returns {Promise<any>} - resolved data or null
 */
const fetchWithRetry = async (queryFn, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            const { data, error } = await queryFn();
            if (error) {
                console.error(`Supabase query error (attempt ${i + 1}):`, error.message);
                if (i === retries) return null;
                await new Promise(r => setTimeout(r, 500 * (i + 1))); // Exponential backoff
                continue;
            }
            return data;
        } catch (e) {
            console.error(`Fetch error (attempt ${i + 1}):`, e.message);
            if (i === retries) return null;
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
    }
    return null;
};

/**
 * Get cached landing data if valid
 */
const getCachedLanding = () => {
    try {
        const cached = sessionStorage.getItem(LANDING_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                console.log('Using cached landing data');
                return data;
            }
        }
    } catch (e) {
        console.error('Cache read error:', e);
    }
    return null;
};

/**
 * Cache landing data in sessionStorage
 */
const setCachedLanding = (data) => {
    try {
        sessionStorage.setItem(LANDING_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Cache write error:', e);
    }
};

/**
 * Get all landing page content in parallel with retry and caching
 * Returns: { hero, services, testimonials, faq, sections, howItWorks, features, gallery }
 */
export const getLanding = async () => {
    // Check cache first
    const cached = getCachedLanding();
    if (cached) return cached;

    console.log('Fetching landing page data from Supabase...');

    // Fetch all data in parallel with retry logic
    const [heroData, servicesData, testimonialsData, faqData, sectionsData, howItWorksOptionsData, howItWorksStepsData, featuresData, galleryData] = await Promise.all([
        fetchWithRetry(() =>
            supabase.from('landing_hero').select('*').eq('is_active', true).maybeSingle()
        ),
        fetchWithRetry(() =>
            supabase.from('landing_services').select('*').eq('is_active', true).order('display_order')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_testimonials').select('*').eq('is_active', true).order('display_order')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_faq').select('*').eq('is_active', true).order('display_order')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_sections').select('*').eq('is_active', true)
        ),
        fetchWithRetry(() =>
            supabase.from('landing_how_it_works_options').select('*').eq('is_active', true).order('display_order')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_how_it_works_steps').select('*').eq('is_active', true).order('step_number')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_features').select('*').eq('is_active', true).order('display_order')
        ),
        fetchWithRetry(() =>
            supabase.from('landing_gallery').select('*').eq('is_active', true).order('display_order')
        )
    ]);

    // Combine How It Works options with their steps
    const howItWorksData = (howItWorksOptionsData || []).map(option => ({
        ...option,
        steps: (howItWorksStepsData || []).filter(step => step.option_id === option.id)
    }));

    const result = {
        hero: heroData || getDefaultHero(),
        services: servicesData || [],
        testimonials: testimonialsData || [],
        faq: faqData || [],
        sections: (sectionsData || []).reduce((acc, s) => {
            acc[s.section_key] = { ...s, content: s.content || {} };
            return acc;
        }, {}),
        howItWorks: howItWorksData,
        features: featuresData || [],
        gallery: galleryData || []
    };

    // Cache the result
    setCachedLanding(result);
    console.log('Landing data fetched and cached:', {
        hero: !!result.hero,
        services: result.services.length,
        testimonials: result.testimonials.length,
        faq: result.faq.length,
        sections: Object.keys(result.sections).length,
        howItWorks: result.howItWorks.length,
        features: result.features.length,
        gallery: result.gallery.length
    });

    return result;
};

/**
 * Get section by key
 */
export const getSection = async (sectionKey) => {
    const { data, error } = await supabase
        .from('landing_sections')
        .select('*')
        .eq('section_key', sectionKey)
        .single();

    if (error) return null;
    return data;
};

// ==================== ADMIN CRUD OPERATIONS ====================

// Hero
export const updateHero = async (updates) => {
    const { data, error } = await supabase
        .from('landing_hero')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('is_active', true)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Services
export const getServices = async () => {
    const { data, error } = await supabase
        .from('landing_services')
        .select('*')
        .order('display_order');
    if (error) throw error;
    return data || [];
};

export const createService = async (service) => {
    const { data, error } = await supabase
        .from('landing_services')
        .insert([service])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateService = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteService = async (id) => {
    const { error } = await supabase
        .from('landing_services')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

// Testimonials
export const getTestimonials = async () => {
    const { data, error } = await supabase
        .from('landing_testimonials')
        .select('*')
        .order('display_order');
    if (error) throw error;
    return data || [];
};

export const createTestimonial = async (testimonial) => {
    const { data, error } = await supabase
        .from('landing_testimonials')
        .insert([testimonial])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateTestimonial = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_testimonials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteTestimonial = async (id) => {
    const { error } = await supabase
        .from('landing_testimonials')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

// FAQ
export const getFaq = async () => {
    const { data, error } = await supabase
        .from('landing_faq')
        .select('*')
        .order('display_order');
    if (error) throw error;
    return data || [];
};

export const createFaq = async (faq) => {
    const { data, error } = await supabase
        .from('landing_faq')
        .insert([faq])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateFaq = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_faq')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteFaq = async (id) => {
    const { error } = await supabase
        .from('landing_faq')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

// Sections
export const updateSection = async (sectionKey, updates) => {
    const { data, error } = await supabase
        .from('landing_sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('section_key', sectionKey)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// ==================== SETTINGS ====================
export const getSettings = async () => {
    const { data, error } = await supabase
        .from('landing_settings')
        .select('*');
    if (error) return {};
    return data?.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
    }, {}) || {};
};

export const getSetting = async (key) => {
    const { data, error } = await supabase
        .from('landing_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();
    if (error) return null;
    return data?.setting_value;
};

export const updateSetting = async (key, value) => {
    const { data, error } = await supabase
        .from('landing_settings')
        .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
};

// ==================== PRICING ====================
export const getPricing = async () => {
    const { data: categories } = await supabase
        .from('landing_pricing')
        .select('*, items:landing_pricing_items(*)')
        .eq('is_active', true)
        .order('display_order');
    return categories || [];
};

export const getPricingAdmin = async () => {
    const { data } = await supabase
        .from('landing_pricing')
        .select('*, items:landing_pricing_items(*)')
        .order('display_order');
    return data || [];
};

export const createPricingCategory = async (category) => {
    const { data, error } = await supabase
        .from('landing_pricing')
        .insert([category])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updatePricingCategory = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_pricing')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deletePricingCategory = async (id) => {
    const { error } = await supabase.from('landing_pricing').delete().eq('id', id);
    if (error) throw error;
    return true;
};

export const createPricingItem = async (item) => {
    const { data, error } = await supabase
        .from('landing_pricing_items')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updatePricingItem = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_pricing_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deletePricingItem = async (id) => {
    const { error } = await supabase.from('landing_pricing_items').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// ==================== GALLERY ====================
export const getGallery = async () => {
    const { data } = await supabase
        .from('landing_gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    return data || [];
};

export const getGalleryAdmin = async () => {
    const { data } = await supabase
        .from('landing_gallery')
        .select('*')
        .order('display_order');
    return data || [];
};

export const createGalleryItem = async (item) => {
    const { data, error } = await supabase
        .from('landing_gallery')
        .insert([item])
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateGalleryItem = async (id, updates) => {
    const { data, error } = await supabase
        .from('landing_gallery')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteGalleryItem = async (id) => {
    const { error } = await supabase.from('landing_gallery').delete().eq('id', id);
    if (error) throw error;
    return true;
};

// ==================== LEGAL PAGES ====================
export const getLegalPages = async () => {
    const { data } = await supabase
        .from('landing_legal')
        .select('*')
        .order('page_key');
    return data || [];
};

export const getLegalPage = async (pageKey) => {
    const { data, error } = await supabase
        .from('landing_legal')
        .select('*')
        .eq('page_key', pageKey)
        .single();
    if (error) return null;
    return data;
};

export const updateLegalPage = async (pageKey, updates) => {
    const { data, error } = await supabase
        .from('landing_legal')
        .upsert({ page_key: pageKey, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
    if (error) throw error;
    return data;
};

// ==================== DEFAULTS ====================
const getDefaultHero = () => ({
    title: 'Professional Device Repair You Can Trust',
    subtitle: 'Fast, reliable repairs for phones, tablets, and computers.',
    cta_text: 'Book Repair Now',
    cta_link: '/booking',
    secondary_cta_text: 'Track Repair',
    secondary_cta_link: '/track'
});

// Export all as object for convenience
export const landingService = {
    getLanding,
    getSection,
    updateHero,
    getServices,
    createService,
    updateService,
    deleteService,
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getFaq,
    createFaq,
    updateFaq,
    deleteFaq,
    updateSection,
    // Settings
    getSettings,
    getSetting,
    updateSetting,
    // Pricing
    getPricing,
    getPricingAdmin,
    createPricingCategory,
    updatePricingCategory,
    deletePricingCategory,
    createPricingItem,
    updatePricingItem,
    deletePricingItem,
    // Gallery
    getGallery,
    getGalleryAdmin,
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    // Legal
    getLegalPages,
    getLegalPage,
    updateLegalPage
};

export default landingService;


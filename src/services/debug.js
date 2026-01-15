/**
 * Debug utilities for SIFIXA
 * Access from browser console via window.sifixaDebug
 */

import { supabase } from './supabase';

const debug = {
    // Clear all cached data
    clearCache: () => {
        sessionStorage.clear();
        localStorage.removeItem('sifixa_landing_cache');
        console.log('✅ Cache cleared');
    },

    // Force logout and clear session
    forceLogout: async () => {
        await supabase.auth.signOut();
        sessionStorage.clear();
        // Clear Supabase auth tokens
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase')) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ Logged out and session cleared');
        window.location.reload();
    },

    // Clear everything and reload
    hardReset: () => {
        sessionStorage.clear();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase') || key.startsWith('sifixa')) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ All SIFIXA data cleared, reloading...');
        window.location.reload();
    },

    // Check Supabase connection
    testConnection: async () => {
        try {
            const start = Date.now();
            const { data, error } = await supabase.from('landing_hero').select('id').limit(1);
            const elapsed = Date.now() - start;
            if (error) {
                console.error('❌ Supabase error:', error.message);
                return false;
            }
            console.log(`✅ Supabase connected (${elapsed}ms)`);
            return true;
        } catch (e) {
            console.error('❌ Connection failed:', e.message);
            return false;
        }
    },

    // Get current auth state
    getAuthState: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth session:', session);
        return session;
    }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
    window.sifixaDebug = debug;
}

export default debug;

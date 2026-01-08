/**
 * Auth Service - Supabase Authentication
 * Handles login, signup, session management, and profile/role loading
 */

import { supabase } from './supabase';

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
};

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: metadata.fullName || '',
                username: metadata.username || email.split('@')[0]
            }
        }
    });

    if (error) throw error;
    return data;
};

/**
 * Sign out current user
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

/**
 * Get current session
 */
export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
};

/**
 * Get user profile from database
 */
export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

/**
 * Get user roles from database
 */
export const getUserRoles = async (userId) => {
    const { data, error } = await supabase
        .from('user_roles')
        .select(`
            role_id,
            roles (
                id,
                name,
                is_staff,
                permissions
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching roles:', error);
        return [];
    }

    return data?.map(r => r.roles) || [];
};

/**
 * Get user's primary role (highest privilege)
 * Returns: { name: string, isStaff: boolean }
 */
export const getPrimaryRole = async (userId) => {
    const roles = await getUserRoles(userId);

    if (!roles || roles.length === 0) {
        return { name: 'customer', isStaff: false };
    }

    // Priority: admin > manager > other staff > customer
    const admin = roles.find(r => r.name === 'admin');
    if (admin) return { name: 'admin', isStaff: true };

    const manager = roles.find(r => r.name === 'manager');
    if (manager) return { name: 'manager', isStaff: true };

    // Any other staff role (technician, cashier, support)
    const staffRole = roles.find(r => r.is_staff === true);
    if (staffRole) return { name: staffRole.name, isStaff: true };

    // Customer or unknown
    const customerRole = roles.find(r => r.name === 'customer');
    if (customerRole) return { name: 'customer', isStaff: false };

    return { name: 'customer', isStaff: false };
};

/**
 * Check if user is staff (admin or employee)
 */
export const isStaff = async (userId) => {
    const roles = await getUserRoles(userId);
    return roles.some(r => r.is_staff === true);
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Assign role to user (admin only)
 */
export const assignRole = async (userId, roleId, assignedBy) => {
    const { data, error } = await supabase
        .from('user_roles')
        .upsert({
            user_id: userId,
            role_id: roleId,
            assigned_by: assignedBy
        });

    if (error) throw error;
    return data;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};

/**
 * Request password reset email
 */
export const resetPasswordRequest = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`
    });

    if (error) throw error;
    return data;
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/login`
        }
    });

    if (error) throw error;
    return data;
};

/**
 * Sign in with Apple OAuth
 */
export const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: `${window.location.origin}/login`
        }
    });

    if (error) throw error;
    return data;
};

export default {
    signIn,
    signUp,
    signOut,
    getSession,
    getProfile,
    getUserRoles,
    getPrimaryRole,
    isStaff,
    updateProfile,
    assignRole,
    onAuthStateChange,
    resetPasswordRequest,
    signInWithGoogle,
    signInWithApple
};

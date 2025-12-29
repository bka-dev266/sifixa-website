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
 */
export const getPrimaryRole = async (userId) => {
    const roles = await getUserRoles(userId);

    // Priority: admin > employee > customer
    if (roles.some(r => r.name === 'admin')) return 'admin';
    if (roles.some(r => r.name === 'employee')) return 'employee';
    if (roles.some(r => r.name === 'customer')) return 'customer';

    return 'customer'; // default
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
    onAuthStateChange
};

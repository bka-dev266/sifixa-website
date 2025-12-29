// Supabase API - Users/Profiles Module (Supabase Only)
// Enhanced with role management via user_roles junction table
import { supabase } from '../supabase';

export const usersApi = {
    // Get all users with their roles
    getAll: async () => {
        try {
            // Simple query that doesn't require user_roles table
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (error) {
                console.error('Users fetch error:', error);
                return [];
            }

            return data.map(p => {
                return {
                    id: p.id,
                    username: p.username,
                    name: p.full_name || p.username || 'Unknown',
                    email: p.email,
                    phone: p.phone || null,
                    avatarUrl: p.avatar_url || null,
                    role: p.is_staff ? 'admin' : 'user',
                    roles: [],
                    isStaff: p.is_staff || false,
                    isActive: p.is_active !== false,
                    createdAt: p.created_at
                };
            });
        } catch (err) {
            console.error('Users error:', err);
            return [];
        }
    },

    // Get staff only (users with is_staff roles)
    getStaff: async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_roles!inner(
                        role_id,
                        roles!inner(id, name, is_staff, permissions)
                    )
                `)
                .eq('is_active', true)
                .eq('user_roles.roles.is_staff', true)
                .is('deleted_at', null)
                .order('full_name');

            if (error) {
                console.error('Staff fetch error:', error);
                return [];
            }

            return data.map(p => {
                const roles = p.user_roles?.map(ur => ur.roles).filter(Boolean) || [];
                const primaryRole = roles[0]?.name || 'staff';

                return {
                    id: p.id,
                    username: p.username,
                    name: p.full_name,
                    email: p.email,
                    phone: p.phone,
                    avatarUrl: p.avatar_url,
                    role: primaryRole,
                    roles: roles,
                    isStaff: true,
                    createdAt: p.created_at
                };
            });
        } catch (err) {
            console.error('Staff error:', err);
            return [];
        }
    },

    // Get single user by ID with roles
    getById: async (id) => {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                user_roles(
                    role_id,
                    assigned_at,
                    roles(id, name, is_staff, permissions)
                )
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        const roles = data.user_roles?.map(ur => ur.roles).filter(Boolean) || [];
        const isStaff = roles.some(r => r.is_staff);

        return {
            id: data.id,
            username: data.username,
            name: data.full_name,
            email: data.email,
            phone: data.phone,
            avatarUrl: data.avatar_url,
            role: roles[0]?.name || 'user',
            roles: roles,
            isStaff: isStaff,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    // Create user (profile)
    create: async (userData) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .insert([{
                username: userData.username,
                full_name: userData.name,
                email: userData.email,
                phone: userData.phone || null,
                avatar_url: userData.avatarUrl || null,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        // Assign role if provided
        if (userData.roleId) {
            await supabase.from('user_roles').insert([{
                user_id: profile.id,
                role_id: userData.roleId
            }]);
        }

        return {
            id: profile.id,
            username: profile.username,
            name: profile.full_name,
            email: profile.email,
            role: userData.role || 'user'
        };
    },

    // Update user profile
    update: async (id, updates) => {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.full_name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.username !== undefined) dbUpdates.username = updates.username;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            username: data.username,
            name: data.full_name,
            email: data.email,
            phone: data.phone,
            avatarUrl: data.avatar_url
        };
    },

    // Deactivate user (soft delete)
    delete: async (id) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: false, deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Get available roles
    getRoles: async () => {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');
        if (error) return [];
        return data.map(r => ({
            id: r.id,
            name: r.name,
            isStaff: r.is_staff,
            permissions: r.permissions
        }));
    },

    // Get roles assigned to a user
    getUserRoles: async (userId) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
                role_id,
                assigned_at,
                assigned_by,
                roles(id, name, is_staff, permissions)
            `)
            .eq('user_id', userId);

        if (error) return [];
        return data.map(ur => ({
            roleId: ur.role_id,
            assignedAt: ur.assigned_at,
            assignedBy: ur.assigned_by,
            role: ur.roles
        }));
    },

    // Assign a role to a user
    assignRole: async (userId, roleId, assignedBy = null) => {
        const { data, error } = await supabase
            .from('user_roles')
            .insert([{
                user_id: userId,
                role_id: roleId,
                assigned_by: assignedBy
            }])
            .select(`
                role_id,
                assigned_at,
                roles(id, name, is_staff)
            `)
            .single();

        if (error) {
            // Check if already assigned (duplicate key)
            if (error.code === '23505') {
                return { alreadyAssigned: true };
            }
            throw error;
        }

        return {
            roleId: data.role_id,
            assignedAt: data.assigned_at,
            role: data.roles
        };
    },

    // Remove a role from a user
    removeRole: async (userId, roleId) => {
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role_id', roleId);

        if (error) throw error;
        return true;
    },

    // Check if a user is staff
    isStaff: async (userId) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
                roles!inner(is_staff)
            `)
            .eq('user_id', userId)
            .eq('roles.is_staff', true)
            .limit(1);

        if (error) return false;
        return data && data.length > 0;
    },

    // Check if user has a specific permission
    hasPermission: async (userId, permission) => {
        const { data, error } = await supabase
            .from('user_roles')
            .select(`
                roles(permissions)
            `)
            .eq('user_id', userId);

        if (error) return false;

        // Check if any role has the permission
        for (const ur of data) {
            const perms = ur.roles?.permissions || {};
            if (perms[permission] === true || perms['*'] === true) {
                return true;
            }
        }
        return false;
    }
};

export default usersApi;

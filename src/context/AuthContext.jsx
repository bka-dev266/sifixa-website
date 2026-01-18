import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);           // Supabase auth user
    const [profile, setProfile] = useState(null);     // DB profile
    const [role, setRole] = useState(null);           // Primary role (admin/employee/customer)
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState(null);

    // FIX: Use lazy initialization for Date.now() to avoid impure function call during render
    const [lastActivity, setLastActivity] = useState(() => Date.now());

    // FIX: Use ref to store logout function for effects to avoid circular dependency
    const logoutRef = useRef(null);

    // Load user profile and role from database
    const loadUserData = useCallback(async (authUser) => {
        console.log('loadUserData called with:', authUser?.id);

        if (!authUser) {
            console.log('No authUser, setting null');
            setProfile(null);
            setRole(null);
            return;
        }

        try {
            console.log('Fetching profile and role...');

            const userProfile = await authService.getProfile(authUser.id);
            console.log('Profile fetched:', userProfile);

            const roleData = await authService.getPrimaryRole(authUser.id);
            console.log('Role fetched:', roleData);

            setProfile(userProfile);
            setRole(roleData);
            console.log('Auth data set successfully');
        } catch (error) {
            console.error('Error loading user data:', error);
            setProfile(null);
            setRole({ name: 'customer', isStaff: false }); // Default fallback
        }
    }, []);

    // Define logout function first
    const logout = useCallback(async () => {
        try {
            await authService.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setProfile(null);
            setRole(null);
            setSessionExpiry(null);
        }
    }, []);

    // Store logout in ref for use in effects
    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    // Initialize auth state from Supabase session
    useEffect(() => {
        const initAuth = async () => {
            try {
                const session = await authService.getSession();
                if (session?.user) {
                    setUser(session.user);
                    await loadUserData(session.user);
                    setSessionExpiry(Date.now() + SESSION_TIMEOUT);
                }
            } catch (error) {
                console.error('Auth init error:', error);
            }
            setLoading(false);
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    await loadUserData(session.user);
                    setSessionExpiry(Date.now() + SESSION_TIMEOUT);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setRole(null);
                    setSessionExpiry(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [loadUserData]);

    // Session expiry checker - using ref to avoid dependency issues
    useEffect(() => {
        if (!user) return;

        const checkSession = () => {
            const now = Date.now();
            const inactivityTime = now - lastActivity;

            if (inactivityTime >= SESSION_TIMEOUT) {
                // Use ref to call logout to avoid stale closure
                logoutRef.current?.();
                return;
            }

            // Update session expiry
            const newExpiry = now + SESSION_TIMEOUT;
            setSessionExpiry(newExpiry);
        };

        const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [user, lastActivity]);

    // Activity listener - extend session on user activity
    useEffect(() => {
        if (!user) return;

        const updateActivity = () => {
            const now = Date.now();
            setLastActivity(now);
            const newExpiry = now + SESSION_TIMEOUT;
            setSessionExpiry(newExpiry);
        };

        // Listen for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
        };
    }, [user]);

    const login = async (email, password) => {
        try {
            const { user: authUser, session, error } = await authService.signIn(email, password);

            if (error) {
                return { success: false, error: error.message };
            }

            if (authUser) {
                setUser({
                    ...authUser,
                    name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0]
                });

                // Load profile and role
                await loadUserData(authUser);

                // Set session expiry
                const now = Date.now();
                setSessionExpiry(now + SESSION_TIMEOUT);
                setLastActivity(now);

                return {
                    success: true,
                    user: authUser,
                    role: await authService.getPrimaryRole(authUser.id)
                };
            }

            return { success: false, error: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    };

    const signup = async (email, password, metadata = {}) => {
        try {
            const { user: authUser } = await authService.signUp(email, password, metadata);

            // Note: User may need to verify email depending on Supabase settings
            if (authUser) {
                setUser(authUser);
                await loadUserData(authUser);
            }

            return { success: true, user: authUser };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    };

    const updateUser = async (updates) => {
        if (!user) return;

        try {
            const updatedProfile = await authService.updateProfile(user.id, updates);
            setProfile(updatedProfile);
            return { success: true, profile: updatedProfile };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const getSessionInfo = () => {
        if (!sessionExpiry) return null;
        const remainingMs = sessionExpiry - Date.now();
        const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
        return {
            expiresAt: new Date(sessionExpiry).toLocaleTimeString(),
            remainingMinutes
        };
    };

    // Computed properties for convenience
    const isAuthenticated = !!user;
    const roleName = role?.name || 'customer';
    const isAdmin = roleName === 'admin';
    const isStaff = role?.isStaff === true;
    const isEmployee = isStaff; // Any staff member
    const isCustomer = !isStaff;

    return (
        <AuthContext.Provider value={{
            // State
            user,
            profile,
            role,
            loading,
            sessionExpiry,

            // Computed
            isAuthenticated,
            isAdmin,
            isEmployee,
            isStaff,
            isCustomer,

            // Actions
            login,
            signup,
            logout,
            updateUser,
            getSessionInfo
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

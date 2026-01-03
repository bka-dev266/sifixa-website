import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, role, loading, isStaff, isAdmin } = useAuth();

    // Wait for auth to load
    if (loading) {
        return <div className="loading-state">Loading...</div>;
    }

    if (!user) {
        // Redirect to appropriate login page based on allowed roles
        if (allowedRoles.includes('customer')) {
            return <Navigate to="/login" replace />;
        }
        return <Navigate to="/staff/login" replace />;
    }

    const roleName = role?.name || 'customer';

    // CROSS-PORTAL BLOCKING
    // Block staff from customer-only routes
    const isCustomerOnlyRoute = allowedRoles.includes('customer') &&
        !allowedRoles.includes('employee') &&
        !allowedRoles.includes('admin');

    if (isCustomerOnlyRoute && isStaff) {
        console.log('ProtectedRoute: Blocking staff from customer route, redirecting to dashboard');
        if (isAdmin) return <Navigate to="/admin" replace />;
        return <Navigate to="/employee" replace />;
    }

    // Block customers from staff-only routes
    const isStaffOnlyRoute = (allowedRoles.includes('employee') || allowedRoles.includes('admin')) &&
        !allowedRoles.includes('customer');

    if (isStaffOnlyRoute && !isStaff) {
        console.log('ProtectedRoute: Blocking customer from staff route, redirecting to profile');
        return <Navigate to="/customer/profile" replace />;
    }

    // Check if user has permission
    // Map 'employee' allowedRole to all staff roles for backwards compatibility
    const hasPermission = allowedRoles.some(allowed => {
        if (allowed === 'employee') {
            // 'employee' means any staff member
            return isStaff;
        }
        if (allowed === 'admin') {
            return roleName === 'admin';
        }
        if (allowed === 'customer') {
            return !isStaff;
        }
        // Direct role name match (support, technician, cashier, manager, inventory, sales)
        return roleName === allowed || (isStaff && ['support', 'technician', 'cashier', 'manager', 'inventory', 'sales'].includes(allowed) && isAdmin);
    });

    if (allowedRoles.length > 0 && !hasPermission) {
        // Redirect to appropriate dashboard if logged in but wrong role
        if (isAdmin) return <Navigate to="/admin" replace />;
        if (isStaff) return <Navigate to="/employee" replace />;
        return <Navigate to="/customer/profile" replace />;
    }

    return children;
};

export default ProtectedRoute;


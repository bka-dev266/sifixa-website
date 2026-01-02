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

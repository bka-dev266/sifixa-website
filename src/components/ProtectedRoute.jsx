import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, role, loading } = useAuth();

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

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard if logged in but wrong role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'employee') return <Navigate to="/employee" replace />;
        if (role === 'customer') return <Navigate to="/customer/profile" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

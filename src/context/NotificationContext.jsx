import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Also show as toast
        setToasts(prev => [...prev, newNotification]);

        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newNotification.id));
        }, 5000);

        return newNotification;
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            toasts,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            dismissToast
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

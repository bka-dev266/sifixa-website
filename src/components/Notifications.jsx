import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Package, AlertCircle, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

// Notification Bell with dropdown
export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'new_booking': return <Package size={16} />;
            case 'status_change': return <AlertCircle size={16} />;
            default: return <Bell size={16} />;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} title="Mark all as read">
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={clearNotifications} title="Clear all">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={32} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className={`notification-icon ${notification.type}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-title">{notification.title}</p>
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            <Clock size={12} /> {formatTime(notification.timestamp)}
                                        </span>
                                    </div>
                                    {!notification.read && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Toast Container for popup notifications
export const ToastContainer = () => {
    const { toasts, dismissToast } = useNotifications();

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast ${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === 'new_booking' && <Package size={20} />}
                        {toast.type === 'status_change' && <AlertCircle size={20} />}
                        {!['new_booking', 'status_change'].includes(toast.type) && <Bell size={20} />}
                    </div>
                    <div className="toast-content">
                        <strong>{toast.title}</strong>
                        <p>{toast.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => dismissToast(toast.id)}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationBell } from '../../../components/Notifications';
import Button from '../../../components/Button';
import {
    Users, Calendar, DollarSign, TrendingUp, Trash2, Download,
    Plus, Edit2, X, Settings, Package, UserPlus, RefreshCw,
    Clock, CheckCircle, AlertCircle, Activity, Search, Timer,
    BarChart3, PieChart, ShoppingBag, UserCheck, ChevronLeft,
    ChevronRight, Filter, CalendarDays, Minus, AlertTriangle,
    FileText, Send, PackageCheck, XCircle, Layers, TrendingDown, History,
    Shield, Cookie, ChevronDown, ChevronUp, Eye, ExternalLink, Mail,
    Receipt, CreditCard
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import ThemeToggle from '../../../components/ThemeToggle';
import { validateName, validateUsername, validatePhone, validateText, validatePrice } from '../../../utils/validation';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [bookings, setBookings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [stats, setStats] = useState({});
    const [settings, setSettings] = useState({});
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const previousBookingsRef = useRef([]);

    // New state for customers, inventory, analytics
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [revenueByService, setRevenueByService] = useState([]);
    const [bookingsByStatus, setBookingsByStatus] = useState([]);

    // Purchase orders and inventory analytics state
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [reorderAlerts, setReorderAlerts] = useState([]);
    const [inventoryAnalytics, setInventoryAnalytics] = useState(null);
    const [inventoryViewMode, setInventoryViewMode] = useState('items'); // 'items', 'orders', 'analytics'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Activity log state
    const [activityLog, setActivityLog] = useState([]);
    const [activityStats, setActivityStats] = useState(null);
    const [activityFilters, setActivityFilters] = useState({ category: '', search: '', startDate: '', endDate: '' });
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotal, setActivityTotal] = useState(0);

    // Sales History state
    const [salesHistory, setSalesHistory] = useState([]);
    const [salesStats, setSalesStats] = useState(null);
    const [salesFilter, setSalesFilter] = useState({ type: 'all', dateFrom: '', dateTo: '' });

    // Website content CMS state
    const [websiteContent, setWebsiteContent] = useState(null);
    const [activeContentSection, setActiveContentSection] = useState('hero');
    const [contentSaving, setContentSaving] = useState(false);
    const [expandedLegalPages, setExpandedLegalPages] = useState({ privacyPolicy: true });

    // Tab-specific search/filter state
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [serviceSearch, setServiceSearch] = useState('');
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
    const [customerSearch, setCustomerSearch] = useState('');
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [statusFilter, setStatusFilter] = useState('all');

    // Calendar view state
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const loadData = useCallback(async (showLoading = false, isInitialLoad = false) => {
        if (showLoading) setLoading(true);
        try {
            const [bookingsData, usersData, servicesData, statsData, settingsData, timeSlotsData, customersData, inventoryData, analyticsDataRes, revenueData, statusData, purchaseOrdersData, reorderAlertsData, inventoryAnalyticsData] = await Promise.all([
                api.bookings.list(),
                mockApi.getUsers(),
                api.services.list(),
                mockApi.getStats(),
                mockApi.getSettings(),
                api.timeSlots.list(),
                api.customers.list(),
                api.inventory.list(),
                mockApi.getAnalyticsData(),
                mockApi.getRevenueByService(),
                mockApi.getBookingsByStatus(),
                mockApi.getPurchaseOrders(),
                mockApi.getReorderAlerts(),
                mockApi.getInventoryAnalytics()
            ]);

            // Check for new bookings (only after initial load)
            if (!isInitialLoad && previousBookingsRef.current.length > 0) {
                const previousIds = previousBookingsRef.current.map(b => b.id);
                const newBookings = bookingsData.filter(b => !previousIds.includes(b.id));

                newBookings.forEach(booking => {
                    // Handle device as object or string
                    const deviceName = typeof booking.device === 'object'
                        ? booking.device?.name || 'Device'
                        : booking.device || 'Device';
                    addNotification({
                        type: 'new_booking',
                        title: 'New Booking',
                        message: `${booking.customer?.name || 'Customer'} booked ${deviceName} for ${booking.scheduledDate || booking.date || 'N/A'}`
                    });
                });
            }

            previousBookingsRef.current = bookingsData;
            setBookings(bookingsData);
            setEmployees(usersData);
            setServices(servicesData);
            setStats(statsData);
            setSettings(settingsData);
            setTimeSlots(timeSlotsData);
            setCustomers(customersData);
            setInventory(inventoryData);
            setAnalyticsData(analyticsDataRes);
            setRevenueByService(revenueData);
            setBookingsByStatus(statusData);
            setPurchaseOrders(purchaseOrdersData);
            setReorderAlerts(reorderAlertsData);
            setInventoryAnalytics(inventoryAnalyticsData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    // Load activity log
    const loadActivityLog = useCallback(async () => {
        try {
            const [logResult, statsResult] = await Promise.all([
                mockApi.getActivityLog({
                    ...activityFilters,
                    page: activityPage,
                    limit: 20
                }),
                mockApi.getActivityStats()
            ]);
            setActivityLog(logResult.activities);
            setActivityTotal(logResult.total);
            setActivityStats(statsResult);
        } catch (error) {
            console.error('Failed to load activity log', error);
        }
    }, [activityFilters, activityPage]);

    // Load sales data
    const loadSalesData = useCallback(async () => {
        try {
            const [sales, stats] = await Promise.all([
                mockApi.getSales(),
                mockApi.getSalesStats(salesFilter.dateFrom, salesFilter.dateTo)
            ]);
            setSalesHistory(sales);
            setSalesStats(stats);
        } catch (error) {
            console.error('Failed to load sales data', error);
        }
    }, [salesFilter]);

    // Load activity log when tab is active or filters change
    useEffect(() => {
        if (activeTab === 'activity') {
            loadActivityLog();
        }
    }, [activeTab, loadActivityLog]);

    // Load sales data when sales tab is active
    useEffect(() => {
        if (activeTab === 'sales') {
            loadSalesData();
        }
    }, [activeTab, loadSalesData]);

    // Load website content when content tab is active
    useEffect(() => {
        if (activeTab === 'content' && !websiteContent) {
            loadWebsiteContent();
        }
    }, [activeTab]);

    const loadWebsiteContent = async () => {
        try {
            const content = await mockApi.getWebsiteContent();
            setWebsiteContent(content);
        } catch (error) {
            console.error('Failed to load website content:', error);
        }
    };

    const handleSaveContent = async (section, data) => {
        setContentSaving(true);
        try {
            const updated = await mockApi.updateWebsiteContent(section, data);
            setWebsiteContent(updated);
            alert('Content saved successfully!');
        } catch (error) {
            alert('Failed to save content: ' + error.message);
        }
        setContentSaving(false);
    };

    const handleResetLegalContent = async () => {
        if (window.confirm('This will reset all legal pages to the default content. Any custom changes will be lost. Continue?')) {
            setContentSaving(true);
            try {
                const freshContent = await mockApi.resetWebsiteContent();
                setWebsiteContent(freshContent);
                alert('Legal pages content has been reset to defaults with all sections populated!');
            } catch (error) {
                alert('Failed to reset content: ' + error.message);
            }
            setContentSaving(false);
        }
    };

    useEffect(() => {
        loadData(true, true); // Initial load
    }, [loadData]);

    // Auto-refresh every 15 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        // Refresh immediately when auto-refresh is enabled
        loadData(false);

        const interval = setInterval(() => {
            loadData(false);
        }, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh, loadData]);


    // ========== BOOKING HANDLERS ==========
    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;
        try {
            await mockApi.deleteBooking(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete booking', error);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await mockApi.updateBookingStatus(id, newStatus);

            // Find the booking to get details for notification
            const booking = bookings.find(b => b.id === id);
            if (booking) {
                addNotification({
                    type: 'status_change',
                    title: 'Status Updated',
                    message: `${getDeviceName(booking.device)} status changed to "${newStatus}"`
                });
            }

            loadData();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    // ========== USER HANDLERS ==========
    const handleSaveUser = async (userData) => {
        try {
            if (editingItem) {
                await mockApi.updateUser(editingItem.id, userData);
            } else {
                await mockApi.addUser(userData);
            }
            setShowUserModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await mockApi.deleteUser(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleResetPassword = async (id) => {
        const newPassword = prompt('Enter new password:');
        if (newPassword) {
            try {
                await mockApi.resetUserPassword(id, newPassword);
                alert('Password reset successfully');
            } catch (error) {
                alert(error.message);
            }
        }
    };

    // ========== SERVICE HANDLERS ==========
    const handleSaveService = async (serviceData) => {
        try {
            if (editingItem) {
                await mockApi.updateService(editingItem.id, serviceData);
            } else {
                await mockApi.addService(serviceData);
            }
            setShowServiceModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await mockApi.deleteService(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleToggleService = async (id) => {
        try {
            await mockApi.toggleServiceActive(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    // ========== SETTINGS HANDLERS ==========
    const handleSaveSettings = async (newSettings) => {
        try {
            await mockApi.updateSettings(newSettings);
            setShowSettingsModal(false);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    // ========== CUSTOMER HANDLERS ==========
    const handleSaveCustomer = async (customerData) => {
        try {
            if (editingItem) {
                await mockApi.updateCustomer(editingItem.id, customerData);
            } else {
                await mockApi.addCustomer(customerData);
            }
            setShowCustomerModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await mockApi.deleteCustomer(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleResetCustomerPassword = async (customer) => {
        // Find the customer's user account by email
        const customerUser = await mockApi.getCustomerUserByEmail(customer.email);
        if (!customerUser) {
            alert(`No login account found for ${customer.email}. The customer may not have registered yet.`);
            return;
        }

        const newPassword = prompt(`Enter new password for ${customer.name}:`);
        if (newPassword) {
            try {
                await mockApi.resetUserPassword(customerUser.id, newPassword);
                alert('Password reset successfully');
            } catch (error) {
                alert(error.message);
            }
        }
    };

    // ========== INVENTORY HANDLERS ==========
    const handleSaveInventory = async (itemData) => {
        try {
            if (editingItem) {
                await mockApi.updateInventoryItem(editingItem.id, itemData);
            } else {
                await mockApi.addInventoryItem(itemData);
            }
            setShowInventoryModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteInventory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await mockApi.deleteInventoryItem(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleAdjustStock = async (id, adjustment) => {
        try {
            await mockApi.adjustStock(id, adjustment);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    // ========== PURCHASE ORDER HANDLERS ==========
    const handleCreatePurchaseOrder = async (orderData) => {
        try {
            await mockApi.createPurchaseOrder(orderData);
            setShowPurchaseOrderModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleUpdatePurchaseOrder = async (id, updates) => {
        try {
            await mockApi.updatePurchaseOrder(id, updates);
            setShowPurchaseOrderModal(false);
            setEditingItem(null);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSubmitPurchaseOrder = async (id) => {
        if (!window.confirm('Submit this purchase order?')) return;
        try {
            await mockApi.submitPurchaseOrder(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleReceivePurchaseOrder = async (id) => {
        if (!window.confirm('Mark this order as received? This will update inventory quantities.')) return;
        try {
            await mockApi.receivePurchaseOrder(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCancelPurchaseOrder = async (id) => {
        if (!window.confirm('Cancel this purchase order?')) return;
        try {
            await mockApi.cancelPurchaseOrder(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeletePurchaseOrder = async (id) => {
        if (!window.confirm('Delete this purchase order?')) return;
        try {
            await mockApi.deletePurchaseOrder(id);
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleCreatePOFromReorderAlerts = async () => {
        if (reorderAlerts.length === 0) {
            alert('No items need reordering');
            return;
        }
        // Group by supplier
        const bySupplier = reorderAlerts.reduce((acc, item) => {
            if (!acc[item.supplier]) acc[item.supplier] = [];
            acc[item.supplier].push({
                itemId: item.id,
                name: item.name,
                quantity: item.shortfall,
                cost: item.cost
            });
            return acc;
        }, {});

        // Create POs for each supplier
        for (const [supplier, items] of Object.entries(bySupplier)) {
            await mockApi.createPurchaseOrder({
                supplier,
                items,
                notes: 'Auto-generated from reorder alerts'
            });
        }
        loadData();
    };

    // ========== EXPORT ==========
    const exportToCSV = () => {
        const headers = ['ID', 'Device', 'Issue', 'Date', 'Time', 'Customer', 'Email', 'Phone', 'Status'];
        const csvContent = [
            headers.join(','),
            ...bookings.map(b => [
                b.id,
                `"${getDeviceName(b.device)}"`,
                `"${b.issue || b.notes || ''}"`,
                getBookingDate(b),
                b.timeSlot?.name || b.scheduledStart || b.time || '',
                `"${getCustomerName(b.customer)}"`,
                b.customer?.email || '',
                b.customer?.phone || '',
                b.status || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings_export.csv';
        a.click();
    };

    const exportAllData = async () => {
        try {
            const data = await mockApi.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sifixa_backup.json';
            a.click();
        } catch (error) {
            alert('Failed to export data');
        }
    };

    const handleResetAllData = async () => {
        if (window.confirm('This will reset ALL data to default values. Are you sure you want to continue?')) {
            try {
                await mockApi.resetAllData();
                alert('Data reset successful! Reloading page...');
                window.location.reload();
            } catch (error) {
                alert('Failed to reset data: ' + error.message);
            }
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    // Chart colors
    const CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#06b6d4', '#ec4899'];

    // Filter bookings with enhanced filters
    const getFilteredBookings = () => {
        let filtered = bookings;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                (b.id?.toString() || '').toLowerCase().includes(search) ||
                getCustomerName(b.customer).toLowerCase().includes(search) ||
                (b.customer?.email || '').toLowerCase().includes(search) ||
                (b.customer?.phone || '').includes(search) ||
                getDeviceName(b.device).toLowerCase().includes(search) ||
                (b.status || '').toLowerCase().includes(search)
            );
        }

        // Date range filter
        const bookingDate = (b) => b.scheduledDate || b.scheduled_date || b.date;
        if (dateFilter.from) {
            filtered = filtered.filter(b => bookingDate(b) >= dateFilter.from);
        }
        if (dateFilter.to) {
            filtered = filtered.filter(b => bookingDate(b) <= dateFilter.to);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        return filtered;
    };

    const filteredBookings = getFilteredBookings();

    // Filter users - exclude customer accounts (they appear in Customers tab)
    const getFilteredUsers = () => {
        // First, filter out customer accounts - they belong to Customers tab, not Users tab
        let filtered = employees.filter(u => u.role !== 'customer');
        if (userSearch) {
            const search = userSearch.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(search) ||
                u.username?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search) ||
                u.role?.toLowerCase().includes(search)
            );
        }
        if (userRoleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === userRoleFilter);
        }
        return filtered;
    };

    // Filter services
    const getFilteredServices = () => {
        let filtered = services;
        if (serviceSearch) {
            const search = serviceSearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.name?.toLowerCase().includes(search) ||
                s.description?.toLowerCase().includes(search)
            );
        }
        if (serviceCategoryFilter !== 'all') {
            filtered = filtered.filter(s => s.category === serviceCategoryFilter);
        }
        return filtered;
    };

    // Filter customers - also merge with customer login account info from users
    const getFilteredCustomers = () => {
        // Get customer login accounts from users table
        const customerAccounts = employees.filter(u => u.role === 'customer');

        // Merge customer data with their account info
        let filtered = customers.map(c => {
            const account = customerAccounts.find(a => a.email === c.email);
            return {
                ...c,
                hasAccount: !!account,
                username: account?.username || null,
                accountId: account?.id || null
            };
        });

        if (customerSearch) {
            const search = customerSearch.toLowerCase();
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(search) ||
                c.email?.toLowerCase().includes(search) ||
                c.phone?.includes(search) ||
                c.username?.toLowerCase().includes(search)
            );
        }
        return filtered;
    };

    // Filter inventory
    const getFilteredInventory = () => {
        let filtered = inventory;
        if (inventorySearch) {
            const search = inventorySearch.toLowerCase();
            filtered = filtered.filter(i =>
                i.name?.toLowerCase().includes(search) ||
                i.sku?.toLowerCase().includes(search) ||
                i.supplier?.toLowerCase().includes(search)
            );
        }
        if (inventoryCategoryFilter !== 'all') {
            filtered = filtered.filter(i => i.category === inventoryCategoryFilter);
        }
        return filtered;
    };

    // Export functions
    const exportUsersCSV = () => {
        const headers = ['ID', 'Name', 'Username', 'Email', 'Role'];
        const csvContent = [
            headers.join(','),
            ...getFilteredUsers().map(u => [u.id, `"${u.name}"`, u.username, u.email, u.role].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'users_export.csv');
    };

    const exportServicesCSV = () => {
        const headers = ['ID', 'Name', 'Description', 'Price Min', 'Price Max', 'Category', 'Active'];
        const csvContent = [
            headers.join(','),
            ...getFilteredServices().map(s => [s.id, `"${s.name}"`, `"${s.description}"`, s.priceMin, s.priceMax, s.category, s.active].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'services_export.csv');
    };

    const exportCustomersCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent'];
        const csvContent = [
            headers.join(','),
            ...getFilteredCustomers().map(c => [c.id, `"${c.name}"`, c.email, c.phone, c.totalBookings, c.totalSpent].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'customers_export.csv');
    };

    const exportInventoryCSV = () => {
        const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Min Stock', 'Cost', 'Supplier'];
        const csvContent = [
            headers.join(','),
            ...getFilteredInventory().map(i => [i.id, `"${i.name}"`, i.sku, i.category, i.quantity, i.minStock, i.cost, `"${i.supplier}"`].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'inventory_export.csv');
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    // Pagination
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty days for the first week
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getBookingsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(b => b.date === dateStr);
    };

    // Low stock items count
    const lowStockCount = inventory.filter(i => i.quantity <= i.minStock).length;

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <button
                    className="sidebar-toggle"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                <div className="sidebar-header">
                    <h2 className="sidebar-logo">SIFIXA</h2>
                    <span className="sidebar-subtitle">Admin Panel</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <TrendingUp size={20} />
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <BarChart3 size={20} />
                        <span>Analytics</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        <Calendar size={20} />
                        <span>Bookings</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        <UserCheck size={20} />
                        <span>Customers</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <ShoppingBag size={20} />
                        <span>Inventory</span>
                        {lowStockCount > 0 && <span className="badge-alert">{lowStockCount}</span>}
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        <Receipt size={20} />
                        <span>Sales History</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <Users size={20} />
                        <span>Users</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'services' ? 'active' : ''}`}
                        onClick={() => setActiveTab('services')}
                    >
                        <Package size={20} />
                        <span>Services</span>
                    </button>
                    <Link
                        to="/admin/landing"
                        className="sidebar-link"
                    >
                        <FileText size={20} />
                        <span>Website Content</span>
                    </Link>
                    <button
                        className={`sidebar-link ${activeTab === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        <History size={20} />
                        <span>Activity Log</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        <Settings size={20} />
                        <span>System</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Administrator</span>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={logout}>
                        <X size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <div className="admin-topbar">
                    <div className="topbar-left">
                        <h1 className="page-title">
                            {activeTab === 'dashboard' && 'Dashboard Overview'}
                            {activeTab === 'analytics' && 'Analytics & Reports'}
                            {activeTab === 'bookings' && 'Bookings Management'}
                            {activeTab === 'customers' && 'Customer Management'}
                            {activeTab === 'inventory' && 'Inventory Management'}
                            {activeTab === 'sales' && 'Sales History'}
                            {activeTab === 'employees' && 'User Management'}
                            {activeTab === 'services' && 'Service Management'}
                            {activeTab === 'content' && 'Website Content'}
                            {activeTab === 'activity' && 'Activity Log'}
                            {activeTab === 'system' && 'System Settings'}
                        </h1>
                    </div>
                    <div className="topbar-actions">
                        <div className="refresh-controls">
                            <button
                                className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                            >
                                <Activity size={20} />
                            </button>
                            <button className="refresh-btn" onClick={() => loadData(false)} title="Refresh now">
                                <RefreshCw size={20} />
                            </button>
                            <span className="last-update">
                                {lastUpdate.toLocaleTimeString()}
                            </span>
                        </div>
                        <NotificationBell />
                        <ThemeToggle />
                    </div>
                </div>

                <div className="admin-content">
                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-overview">
                            {/* Stats Cards */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon blue"><Calendar size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.totalBookings || 0}</span>
                                        <span className="stat-label">Total Bookings</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orange"><Clock size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.pending || 0}</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan"><AlertCircle size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{bookings.filter(b => b.status === 'In Progress').length}</span>
                                        <span className="stat-label">In Progress</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.completed || 0}</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="stats-grid secondary">
                                <div className="stat-card mini">
                                    <div className="stat-info">
                                        <span className="stat-value">{bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length}</span>
                                        <span className="stat-label">Today's Bookings</span>
                                    </div>
                                </div>
                                <div className="stat-card mini">
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.totalEmployees || 0}</span>
                                        <span className="stat-label">Employees</span>
                                    </div>
                                </div>
                                <div className="stat-card mini">
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.activeServices || 0}/{stats.totalServices || 0}</span>
                                        <span className="stat-label">Active Services</span>
                                    </div>
                                </div>
                                <div className="stat-card mini">
                                    <div className="stat-info">
                                        <span className="stat-value">
                                            {stats.totalBookings > 0 ? Math.round(((stats.completed || 0) / stats.totalBookings) * 100) : 0}%
                                        </span>
                                        <span className="stat-label">Completion Rate</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Bookings */}
                            <div className="dashboard-section">
                                <div className="section-header">
                                    <h2>Recent Bookings</h2>
                                    <Button variant="secondary" onClick={() => setActiveTab('bookings')}>
                                        View All
                                    </Button>
                                </div>
                                <div className="recent-bookings-list">
                                    {bookings.slice(0, 5).map(booking => (
                                        <div key={booking.id} className="recent-booking-item">
                                            <div className="booking-info">
                                                <strong>{getDeviceName(booking.device)}</strong>
                                                <span>{getCustomerName(booking.customer)}</span>
                                            </div>
                                            <div className="booking-meta">
                                                <span className="booking-date">{getBookingDate(booking)}</span>
                                                <span className={`status-badge ${booking.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {bookings.length === 0 && (
                                        <p className="no-data">No bookings yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="analytics-section">
                            {/* Revenue Overview */}
                            <div className="analytics-grid">
                                <div className="chart-card full-width">
                                    <h3><DollarSign size={18} /> Revenue Trend (Last 30 Days)</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={analyticsData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="var(--text-secondary)"
                                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                                                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                                />
                                                <Legend />
                                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
                                                <Line type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={2} name="Bookings" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <h3><PieChart size={18} /> Bookings by Status</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <RechartsPie>
                                                <Pie
                                                    data={bookingsByStatus.filter(s => s.count > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    dataKey="count"
                                                    nameKey="name"
                                                    label={({ name, count }) => `${name}: ${count}`}
                                                >
                                                    {bookingsByStatus.map((entry, index) => (
                                                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <h3><BarChart3 size={18} /> Service Performance</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={revenueByService}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" angle={-45} textAnchor="end" height={80} />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} />
                                                <Bar dataKey="value" fill="#a855f7" name="Revenue ($)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="analytics-summary">
                                <div className="summary-card">
                                    <h4>Total Revenue (Est.)</h4>
                                    <p className="summary-value">${analyticsData.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}</p>
                                </div>
                                <div className="summary-card">
                                    <h4>Total Bookings</h4>
                                    <p className="summary-value">{analyticsData.reduce((acc, d) => acc + d.bookings, 0)}</p>
                                </div>
                                <div className="summary-card">
                                    <h4>Avg Daily Revenue</h4>
                                    <p className="summary-value">${Math.round(analyticsData.reduce((acc, d) => acc + d.revenue, 0) / 30)}</p>
                                </div>
                                <div className="summary-card">
                                    <h4>Top Service</h4>
                                    <p className="summary-value">{revenueByService[0]?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <div className="bookings-section">
                            <div className="section-header table-header-pro">
                                <h2>All Bookings ({filteredBookings.length} of {bookings.length})</h2>
                                <div className="table-actions">
                                    <div className="view-toggle">
                                        <button
                                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                            onClick={() => setViewMode('table')}
                                        >
                                            <Calendar size={16} /> Table
                                        </button>
                                        <button
                                            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                                            onClick={() => setViewMode('calendar')}
                                        >
                                            <CalendarDays size={16} /> Calendar
                                        </button>
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        className="filter-select"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    <div className="search-wrapper">
                                        <Search className="search-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search bookings..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                            className="search-input"
                                        />
                                    </div>
                                    <Button variant="secondary" onClick={exportToCSV}>
                                        <Download size={16} /> Export CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showFilters && (
                                <div className="filters-panel">
                                    <div className="filter-group">
                                        <label>Date From</label>
                                        <input
                                            type="date"
                                            value={dateFilter.from}
                                            onChange={(e) => { setDateFilter({ ...dateFilter, from: e.target.value }); setCurrentPage(1); }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Date To</label>
                                        <input
                                            type="date"
                                            value={dateFilter.to}
                                            onChange={(e) => { setDateFilter({ ...dateFilter, to: e.target.value }); setCurrentPage(1); }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <button
                                        className="clear-filters-btn"
                                        onClick={() => { setDateFilter({ from: '', to: '' }); setStatusFilter('all'); setSearchTerm(''); }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <>
                                    <div className="table-container">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Tracking #</th>
                                                    <th>Device</th>
                                                    <th>Customer</th>
                                                    <th>Date</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedBookings.length > 0 ? (
                                                    paginatedBookings.map(booking => (
                                                        <tr key={booking.id}>
                                                            <td>
                                                                <span className="booking-id">#{booking.id}</span>
                                                            </td>
                                                            <td>
                                                                <span className="tracking-number">{booking.trackingNumber || 'N/A'}</span>
                                                            </td>
                                                            <td>
                                                                <div className="device-cell">
                                                                    <span className="device-name">{getDeviceName(booking.device)}</span>
                                                                    <span className="issue-text">{booking.issue || booking.notes || ''}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="user-cell">
                                                                    <div className="user-avatar-small">{getCustomerName(booking.customer).charAt(0) || '?'}</div>
                                                                    <div className="customer-info-cell">
                                                                        <span className="user-name">{getCustomerName(booking.customer)}</span>
                                                                        <span className="customer-email-cell">{booking.customer?.email || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="date-cell">
                                                                    <span className="date-text">{getBookingDate(booking)}</span>
                                                                    <span className="time-text">{booking.timeSlot?.name || booking.scheduledStart || booking.time || ''}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <select
                                                                    value={booking.status}
                                                                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                                                                    className={`status-select-pro ${booking.status?.toLowerCase().replace(' ', '-')}`}
                                                                >
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Confirmed">Confirmed</option>
                                                                    <option value="In Progress">In Progress</option>
                                                                    <option value="Completed">Completed</option>
                                                                    <option value="Cancelled">Cancelled</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <div className="action-buttons">
                                                                    <button className="icon-btn danger" onClick={() => handleDeleteBooking(booking.id)} title="Delete">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="empty-message">
                                                            {searchTerm || statusFilter !== 'all' || dateFilter.from || dateFilter.to
                                                                ? 'No bookings found matching your filters'
                                                                : 'No bookings available'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <span className="pagination-info">
                                                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
                                            </span>
                                            <div className="pagination-controls">
                                                <button
                                                    className="pagination-btn"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    className="pagination-btn"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Calendar View */}
                            {viewMode === 'calendar' && (
                                <div className="calendar-view">
                                    <div className="calendar-header">
                                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>
                                            <ChevronLeft size={20} />
                                        </button>
                                        <h3>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                                        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                    <div className="calendar-grid">
                                        <div className="calendar-day-header">Sun</div>
                                        <div className="calendar-day-header">Mon</div>
                                        <div className="calendar-day-header">Tue</div>
                                        <div className="calendar-day-header">Wed</div>
                                        <div className="calendar-day-header">Thu</div>
                                        <div className="calendar-day-header">Fri</div>
                                        <div className="calendar-day-header">Sat</div>
                                        {getDaysInMonth(calendarMonth).map((day, index) => {
                                            const dayBookings = day ? getBookingsForDate(day) : [];
                                            const isToday = day && day.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={index} className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}>
                                                    {day && (
                                                        <>
                                                            <span className="day-number">{day.getDate()}</span>
                                                            {dayBookings.length > 0 && (
                                                                <div className="day-bookings">
                                                                    {dayBookings.slice(0, 2).map(b => (
                                                                        <div key={b.id} className={`booking-chip ${b.status?.toLowerCase().replace(' ', '-')}`}>
                                                                            {getDeviceName(b.device)}
                                                                        </div>
                                                                    ))}
                                                                    {dayBookings.length > 2 && (
                                                                        <div className="booking-chip more">+{dayBookings.length - 2} more</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'employees' && (
                        <div className="users-section">
                            <div className="section-header table-header-pro">
                                <h2>User Management ({getFilteredUsers().length} of {employees.length})</h2>
                                <div className="table-actions">
                                    <div className="search-wrapper">
                                        <Search className="search-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <select
                                        value={userRoleFilter}
                                        onChange={(e) => setUserRoleFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="admin">Administrator</option>
                                        <option value="technician">Technician</option>
                                        <option value="support">Support</option>
                                        <option value="inventory">Inventory</option>
                                        <option value="sales">Sales</option>
                                    </select>
                                    <Button variant="secondary" onClick={exportUsersCSV}>
                                        <Download size={16} /> Export CSV
                                    </Button>
                                    <Button variant="primary" onClick={() => { setEditingItem(null); setShowUserModal(true); }}>
                                        <UserPlus size={16} /> Add User
                                    </Button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredUsers().map(emp => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar-small">{emp.name?.charAt(0) || '?'}</div>
                                                        <span className="user-name">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="username-cell">@{emp.username}</td>
                                                <td>{emp.email}</td>
                                                <td>
                                                    <span className={`role-badge ${emp.role}`}>{emp.role}</span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="icon-btn" onClick={() => { setEditingItem(emp); setShowUserModal(true); }} title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="icon-btn" onClick={() => handleResetPassword(emp.id)} title="Reset Password">
                                                            <RefreshCw size={14} />
                                                        </button>
                                                        <button className="icon-btn danger" onClick={() => handleDeleteUser(emp.id)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {getFilteredUsers().length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="empty-message">No users found matching your criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div className="services-section">
                            <div className="section-header table-header-pro">
                                <h2>Service Management ({getFilteredServices().length} of {services.length})</h2>
                                <div className="table-actions">
                                    <div className="search-wrapper">
                                        <Search className="search-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search services..."
                                            value={serviceSearch}
                                            onChange={(e) => setServiceSearch(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <select
                                        value={serviceCategoryFilter}
                                        onChange={(e) => setServiceCategoryFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="phone">Phone</option>
                                        <option value="computer">Computer</option>
                                        <option value="both">Both</option>
                                    </select>
                                    <Button variant="secondary" onClick={exportServicesCSV}>
                                        <Download size={16} /> Export CSV
                                    </Button>
                                    <Button variant="primary" onClick={() => { setEditingItem(null); setShowServiceModal(true); }}>
                                        <Plus size={16} /> Add Service
                                    </Button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Service Name</th>
                                            <th>Description</th>
                                            <th>Price Range</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredServices().map(service => (
                                            <tr key={service.id} className={!service.active ? 'inactive-row' : ''}>
                                                <td className="service-name-cell">{service.name}</td>
                                                <td className="description-cell">{service.description}</td>
                                                <td className="price-cell">${service.priceMin} - ${service.priceMax}</td>
                                                <td><span className={`category-badge ${service.category}`}>{service.category}</span></td>
                                                <td>
                                                    <button
                                                        className={`toggle-btn-small ${service.active ? 'active' : ''}`}
                                                        onClick={() => handleToggleService(service.id)}
                                                    >
                                                        {service.active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="icon-btn" onClick={() => { setEditingItem(service); setShowServiceModal(true); }} title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="icon-btn danger" onClick={() => handleDeleteService(service.id)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {getFilteredServices().length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="empty-message">No services found matching your criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CUSTOMERS TAB */}
                    {activeTab === 'customers' && (
                        <div className="customers-section">
                            <div className="section-header table-header-pro">
                                <h2>Customer Management ({getFilteredCustomers().length} of {customers.length})</h2>
                                <div className="table-actions">
                                    <div className="search-wrapper">
                                        <Search className="search-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search customers..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <Button variant="secondary" onClick={exportCustomersCSV}>
                                        <Download size={16} /> Export CSV
                                    </Button>
                                    <Button variant="primary" onClick={() => { setEditingItem(null); setShowCustomerModal(true); }}>
                                        <UserPlus size={16} /> Add Customer
                                    </Button>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Bookings</th>
                                            <th>Total Spent</th>
                                            <th>Tags</th>
                                            <th>Portal Account</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredCustomers().map(customer => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar-small">{customer.name?.charAt(0) || '?'}</div>
                                                        <span className="user-name">{customer.name}</span>
                                                    </div>
                                                </td>
                                                <td>{customer.email}</td>
                                                <td>{customer.phone}</td>
                                                <td className="center-cell">{customer.totalBookings}</td>
                                                <td className="amount">${customer.totalSpent}</td>
                                                <td>
                                                    <div className="tags-cell">
                                                        {customer.tags?.slice(0, 2).map(tag => (
                                                            <span key={tag} className={`customer-tag ${tag}`}>{tag}</span>
                                                        ))}
                                                        {customer.tags?.length > 2 && <span className="more-tags">+{customer.tags.length - 2}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    {customer.hasAccount ? (
                                                        <span className="account-badge active" title={`Username: @${customer.username}`}>
                                                            <CheckCircle size={12} /> @{customer.username}
                                                        </span>
                                                    ) : (
                                                        <span className="account-badge inactive">No Account</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="icon-btn" onClick={() => { setEditingItem(customer); setShowCustomerModal(true); }} title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        {customer.hasAccount && (
                                                            <button className="icon-btn" onClick={() => handleResetCustomerPassword(customer)} title="Reset Password">
                                                                <RefreshCw size={14} />
                                                            </button>
                                                        )}
                                                        <button className="icon-btn danger" onClick={() => handleDeleteCustomer(customer.id)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {getFilteredCustomers().length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="empty-message">No customers found matching your criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* INVENTORY TAB */}
                    {activeTab === 'inventory' && (
                        <div className="inventory-section">
                            <div className="section-header">
                                <h2>Inventory Management</h2>
                                <div className="inventory-tabs">
                                    <button
                                        className={`inv-tab-btn ${inventoryViewMode === 'items' ? 'active' : ''}`}
                                        onClick={() => setInventoryViewMode('items')}
                                    >
                                        <Package size={16} /> Items
                                    </button>
                                    <button
                                        className={`inv-tab-btn ${inventoryViewMode === 'orders' ? 'active' : ''}`}
                                        onClick={() => setInventoryViewMode('orders')}
                                    >
                                        <FileText size={16} /> Purchase Orders
                                        {purchaseOrders.filter(o => o.status === 'Submitted').length > 0 && (
                                            <span className="badge-small">{purchaseOrders.filter(o => o.status === 'Submitted').length}</span>
                                        )}
                                    </button>
                                    <button
                                        className={`inv-tab-btn ${inventoryViewMode === 'analytics' ? 'active' : ''}`}
                                        onClick={() => setInventoryViewMode('analytics')}
                                    >
                                        <BarChart3 size={16} /> Analytics
                                    </button>
                                </div>
                                {inventoryViewMode === 'items' && (
                                    <Button variant="primary" onClick={() => { setEditingItem(null); setShowInventoryModal(true); }}>
                                        <Plus size={16} /> Add Item
                                    </Button>
                                )}
                                {inventoryViewMode === 'orders' && (
                                    <Button variant="primary" onClick={() => { setEditingItem(null); setShowPurchaseOrderModal(true); }}>
                                        <Plus size={16} /> New PO
                                    </Button>
                                )}
                            </div>

                            {/* Reorder Alerts Banner */}
                            {reorderAlerts.length > 0 && inventoryViewMode === 'items' && (
                                <div className="reorder-alerts-banner">
                                    <div className="alert-header">
                                        <AlertTriangle size={18} />
                                        <span><strong>{reorderAlerts.length}</strong> items need reordering</span>
                                    </div>
                                    <div className="alert-items">
                                        {reorderAlerts.slice(0, 3).map(item => (
                                            <span key={item.id} className={`alert-item ${item.urgency}`}>
                                                {item.name} ({item.quantity} left)
                                            </span>
                                        ))}
                                        {reorderAlerts.length > 3 && <span className="more-items">+{reorderAlerts.length - 3} more</span>}
                                    </div>
                                    <Button variant="secondary" onClick={handleCreatePOFromReorderAlerts}>
                                        <FileText size={14} /> Create PO from Alerts
                                    </Button>
                                </div>
                            )}

                            {/* Items View */}
                            {inventoryViewMode === 'items' && (
                                <div className="inventory-grid">
                                    {inventory.map(item => {
                                        const isLowStock = item.quantity <= item.minStock;
                                        return (
                                            <div key={item.id} className={`inventory-card ${isLowStock ? 'low-stock' : ''}`}>
                                                <div className="inventory-header">
                                                    <h3>{item.name}</h3>
                                                    <span className="sku-badge">{item.sku}</span>
                                                </div>
                                                <div className="inventory-details">
                                                    <p><strong>Category:</strong> {item.category}</p>
                                                    <p><strong>Cost:</strong> ${item.cost}</p>
                                                    <p><strong>Supplier:</strong> {item.supplier}</p>
                                                    <p><strong>Last Restocked:</strong> {item.lastRestocked}</p>
                                                </div>
                                                <div className="inventory-stock">
                                                    <div className="stock-level">
                                                        <span className={`stock-count ${isLowStock ? 'low' : 'ok'}`}>
                                                            {item.quantity}
                                                        </span>
                                                        <span className="stock-label">in stock (min: {item.minStock})</span>
                                                    </div>
                                                    <div className="stock-controls">
                                                        <button
                                                            className="stock-btn minus"
                                                            onClick={() => handleAdjustStock(item.id, -1)}
                                                            disabled={item.quantity === 0}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <button
                                                            className="stock-btn plus"
                                                            onClick={() => handleAdjustStock(item.id, 1)}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="inventory-actions">
                                                    <button className="icon-btn" onClick={() => { setEditingItem(item); setShowInventoryModal(true); }}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={() => handleDeleteInventory(item.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Purchase Orders View */}
                            {inventoryViewMode === 'orders' && (
                                <div className="purchase-orders-section">
                                    <table className="po-table">
                                        <thead>
                                            <tr>
                                                <th>PO #</th>
                                                <th>Date</th>
                                                <th>Supplier</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseOrders.map(order => (
                                                <tr key={order.id}>
                                                    <td><strong>{order.id}</strong></td>
                                                    <td>{order.date}</td>
                                                    <td>{order.supplier}</td>
                                                    <td>
                                                        <span className="item-count">{order.items.length} items</span>
                                                        <div className="item-preview">
                                                            {order.items.slice(0, 2).map(i => i.name).join(', ')}
                                                            {order.items.length > 2 && '...'}
                                                        </div>
                                                    </td>
                                                    <td><strong>${order.total.toLocaleString()}</strong></td>
                                                    <td>
                                                        <span className={`po-status ${order.status.toLowerCase()}`}>
                                                            {order.status === 'Draft' && <Edit2 size={12} />}
                                                            {order.status === 'Submitted' && <Send size={12} />}
                                                            {order.status === 'Received' && <PackageCheck size={12} />}
                                                            {order.status === 'Cancelled' && <XCircle size={12} />}
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="po-actions">
                                                            {order.status === 'Draft' && (
                                                                <>
                                                                    <button className="po-action-btn submit" onClick={() => handleSubmitPurchaseOrder(order.id)} title="Submit">
                                                                        <Send size={14} />
                                                                    </button>
                                                                    <button className="po-action-btn edit" onClick={() => { setEditingItem(order); setShowPurchaseOrderModal(true); }} title="Edit">
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {order.status === 'Submitted' && (
                                                                <>
                                                                    <button className="po-action-btn receive" onClick={() => handleReceivePurchaseOrder(order.id)} title="Mark Received">
                                                                        <PackageCheck size={14} />
                                                                    </button>
                                                                    <button className="po-action-btn cancel" onClick={() => handleCancelPurchaseOrder(order.id)} title="Cancel">
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(order.status === 'Received' || order.status === 'Cancelled') && (
                                                                <button className="po-action-btn delete" onClick={() => handleDeletePurchaseOrder(order.id)} title="Delete">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {purchaseOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="no-data">No purchase orders yet</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Analytics View */}
                            {inventoryViewMode === 'analytics' && inventoryAnalytics && (
                                <div className="inventory-analytics">
                                    <div className="inv-stats-row">
                                        <div className="inv-stat-card">
                                            <DollarSign size={24} />
                                            <div>
                                                <span className="stat-value">${inventoryAnalytics.totalValue.toLocaleString()}</span>
                                                <span className="stat-label">Total Inventory Value</span>
                                            </div>
                                        </div>
                                        <div className="inv-stat-card">
                                            <Layers size={24} />
                                            <div>
                                                <span className="stat-value">{inventoryAnalytics.totalItems}</span>
                                                <span className="stat-label">Total SKUs</span>
                                            </div>
                                        </div>
                                        <div className="inv-stat-card">
                                            <TrendingDown size={24} />
                                            <div>
                                                <span className="stat-value">${inventoryAnalytics.totalSpent.toLocaleString()}</span>
                                                <span className="stat-label">Spent on Orders (MTD)</span>
                                            </div>
                                        </div>
                                        <div className="inv-stat-card">
                                            <FileText size={24} />
                                            <div>
                                                <span className="stat-value">{inventoryAnalytics.pendingOrders}</span>
                                                <span className="stat-label">Pending Orders</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="inv-charts-row">
                                        <div className="chart-card">
                                            <h3><PieChart size={18} /> Value by Category</h3>
                                            <div className="chart-container">
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <RechartsPie>
                                                        <Pie
                                                            data={inventoryAnalytics.valueByCategory}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            label={({ name, value }) => `${name}: $${value}`}
                                                        >
                                                            {inventoryAnalytics.valueByCategory.map((entry, index) => (
                                                                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value) => `$${value}`} />
                                                    </RechartsPie>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="chart-card">
                                            <h3><BarChart3 size={18} /> Stock Level Distribution</h3>
                                            <div className="stock-distribution">
                                                <div className="stock-bar">
                                                    <div className="bar-segment critical" style={{ width: `${(inventoryAnalytics.stockLevels.critical / inventoryAnalytics.totalItems) * 100}%` }}></div>
                                                    <div className="bar-segment low" style={{ width: `${(inventoryAnalytics.stockLevels.low / inventoryAnalytics.totalItems) * 100}%` }}></div>
                                                    <div className="bar-segment adequate" style={{ width: `${(inventoryAnalytics.stockLevels.adequate / inventoryAnalytics.totalItems) * 100}%` }}></div>
                                                    <div className="bar-segment high" style={{ width: `${(inventoryAnalytics.stockLevels.high / inventoryAnalytics.totalItems) * 100}%` }}></div>
                                                </div>
                                                <div className="stock-legend">
                                                    <span><span className="dot critical"></span> Out of Stock ({inventoryAnalytics.stockLevels.critical})</span>
                                                    <span><span className="dot low"></span> Low ({inventoryAnalytics.stockLevels.low})</span>
                                                    <span><span className="dot adequate"></span> Adequate ({inventoryAnalytics.stockLevels.adequate})</span>
                                                    <span><span className="dot high"></span> High ({inventoryAnalytics.stockLevels.high})</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="chart-card">
                                            <h3><TrendingUp size={18} /> Top Moving Items</h3>
                                            <div className="top-items-list">
                                                {inventoryAnalytics.topMoving.map((item, index) => (
                                                    <div key={item.name} className="top-item">
                                                        <span className="rank">#{index + 1}</span>
                                                        <span className="name">{item.name}</span>
                                                        <span className="usage">{item.avgUsage.toFixed(1)}/week avg</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* WEBSITE CONTENT TAB */}
                    {activeTab === 'content' && websiteContent && (
                        <div className="content-editor-section">
                            <div className="content-tabs">
                                <button className={`content-tab ${activeContentSection === 'hero' ? 'active' : ''}`} onClick={() => setActiveContentSection('hero')}>Hero</button>
                                <button className={`content-tab ${activeContentSection === 'services' ? 'active' : ''}`} onClick={() => setActiveContentSection('services')}>Services</button>
                                <button className={`content-tab ${activeContentSection === 'howItWorks' ? 'active' : ''}`} onClick={() => setActiveContentSection('howItWorks')}>How It Works</button>
                                <button className={`content-tab ${activeContentSection === 'whyChooseUs' ? 'active' : ''}`} onClick={() => setActiveContentSection('whyChooseUs')}>Why Choose Us</button>
                                <button className={`content-tab ${activeContentSection === 'cta' ? 'active' : ''}`} onClick={() => setActiveContentSection('cta')}>CTAs</button>
                                <button className={`content-tab ${activeContentSection === 'contact' ? 'active' : ''}`} onClick={() => setActiveContentSection('contact')}>Contact</button>
                                <button className={`content-tab ${activeContentSection === 'legal' ? 'active' : ''}`} onClick={() => setActiveContentSection('legal')}>Legal Pages</button>
                            </div>

                            <div className="content-editor-panel">
                                {/* HERO SECTION EDITOR */}
                                {activeContentSection === 'hero' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                                                <Layers size={24} />
                                            </div>
                                            <div>
                                                <h3>Hero Section</h3>
                                                <p className="editor-description">Customize the main hero banner that visitors see first on your homepage.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Edit2 size={16} /> Headlines</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Main Title</label>
                                                        <input type="text" value={websiteContent.hero?.title || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, hero: { ...websiteContent.hero, title: e.target.value } })} placeholder="Enter main headline..." />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Subtitle</label>
                                                        <input type="text" value={websiteContent.hero?.subtitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, hero: { ...websiteContent.hero, subtitle: e.target.value } })} placeholder="Enter subtitle..." />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><Edit2 size={14} /> Description</label>
                                                        <textarea rows={3} value={websiteContent.hero?.description || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, hero: { ...websiteContent.hero, description: e.target.value } })} placeholder="Enter hero description..." />
                                                        <span className="char-count">{(websiteContent.hero?.description || '').length} characters</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Plus size={16} /> Action Buttons</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Primary Button Text</label>
                                                            <input type="text" value={websiteContent.hero?.primaryButtonText || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, hero: { ...websiteContent.hero, primaryButtonText: e.target.value } })} placeholder="e.g., Book Repair Now" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Secondary Button Text</label>
                                                            <input type="text" value={websiteContent.hero?.secondaryButtonText || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, hero: { ...websiteContent.hero, secondaryButtonText: e.target.value } })} placeholder="e.g., Get Quote" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => handleSaveContent('hero', websiteContent.hero)} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save Hero Section</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SERVICES SECTION EDITOR */}
                                {activeContentSection === 'services' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                                                <Settings size={24} />
                                            </div>
                                            <div>
                                                <h3>Services Section</h3>
                                                <p className="editor-description">Manage the service cards displayed on your homepage.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Edit2 size={16} /> Section Header</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Section Title</label>
                                                        <input type="text" value={websiteContent.services?.sectionTitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, services: { ...websiteContent.services, sectionTitle: e.target.value } })} placeholder="Enter section title..." />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><Edit2 size={14} /> Section Subtitle</label>
                                                        <textarea rows={2} value={websiteContent.services?.sectionSubtitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, services: { ...websiteContent.services, sectionSubtitle: e.target.value } })} placeholder="Enter section subtitle..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Package size={16} /> Service Cards</h4>
                                                    <span className="section-badge">{websiteContent.services?.cards?.length || 0} cards</span>
                                                </div>
                                                <div className="cms-cards-list">
                                                    {websiteContent.services?.cards?.map((card, idx) => (
                                                        <div key={idx} className="cms-card-editor">
                                                            <div className="cms-card-header">
                                                                <span className="card-number">Card {idx + 1}</span>
                                                            </div>
                                                            <div className="cms-form-grid">
                                                                <div className="form-group">
                                                                    <label>Title</label>
                                                                    <input type="text" value={card.title} onChange={(e) => {
                                                                        const newCards = [...websiteContent.services.cards];
                                                                        newCards[idx] = { ...newCards[idx], title: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, services: { ...websiteContent.services, cards: newCards } });
                                                                    }} placeholder="Service title..." />
                                                                </div>
                                                                <div className="form-group full-width">
                                                                    <label>Description</label>
                                                                    <textarea rows={2} value={card.description} onChange={(e) => {
                                                                        const newCards = [...websiteContent.services.cards];
                                                                        newCards[idx] = { ...newCards[idx], description: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, services: { ...websiteContent.services, cards: newCards } });
                                                                    }} placeholder="Service description..." />
                                                                </div>
                                                                <div className="form-group full-width">
                                                                    <label>Image URL</label>
                                                                    <input type="text" value={card.image} onChange={(e) => {
                                                                        const newCards = [...websiteContent.services.cards];
                                                                        newCards[idx] = { ...newCards[idx], image: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, services: { ...websiteContent.services, cards: newCards } });
                                                                    }} placeholder="/path/to/image.png" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => handleSaveContent('services', websiteContent.services)} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save Services</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* HOW IT WORKS EDITOR */}
                                {activeContentSection === 'howItWorks' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                                <Activity size={24} />
                                            </div>
                                            <div>
                                                <h3>How It Works Section</h3>
                                                <p className="editor-description">Edit the step-by-step process shown to customers.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Edit2 size={16} /> Section Header</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Section Title</label>
                                                        <input type="text" value={websiteContent.howItWorks?.sectionTitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, howItWorks: { ...websiteContent.howItWorks, sectionTitle: e.target.value } })} placeholder="Enter section title..." />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Section Subtitle</label>
                                                        <input type="text" value={websiteContent.howItWorks?.sectionSubtitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, howItWorks: { ...websiteContent.howItWorks, sectionSubtitle: e.target.value } })} placeholder="Enter section subtitle..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Layers size={16} /> Process Steps</h4>
                                                    <span className="section-badge">{websiteContent.howItWorks?.steps?.length || 0} steps</span>
                                                </div>
                                                <div className="cms-cards-list">
                                                    {websiteContent.howItWorks?.steps?.map((step, idx) => (
                                                        <div key={idx} className="cms-card-editor">
                                                            <div className="cms-card-header">
                                                                <span className="card-number">Step {idx + 1}</span>
                                                            </div>
                                                            <div className="cms-form-grid">
                                                                <div className="form-group">
                                                                    <label>Title</label>
                                                                    <input type="text" value={step.title} onChange={(e) => {
                                                                        const newSteps = [...websiteContent.howItWorks.steps];
                                                                        newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, howItWorks: { ...websiteContent.howItWorks, steps: newSteps } });
                                                                    }} placeholder="Step title..." />
                                                                </div>
                                                                <div className="form-group full-width">
                                                                    <label>Description</label>
                                                                    <textarea rows={2} value={step.description} onChange={(e) => {
                                                                        const newSteps = [...websiteContent.howItWorks.steps];
                                                                        newSteps[idx] = { ...newSteps[idx], description: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, howItWorks: { ...websiteContent.howItWorks, steps: newSteps } });
                                                                    }} placeholder="Step description..." />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => handleSaveContent('howItWorks', websiteContent.howItWorks)} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save How It Works</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* WHY CHOOSE US EDITOR */}
                                {activeContentSection === 'whyChooseUs' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h3>Why Choose Us Section</h3>
                                                <p className="editor-description">Highlight your competitive advantages and features.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Edit2 size={16} /> Section Header</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Section Title</label>
                                                        <input type="text" value={websiteContent.whyChooseUs?.sectionTitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, whyChooseUs: { ...websiteContent.whyChooseUs, sectionTitle: e.target.value } })} placeholder="Enter section title..." />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Section Subtitle</label>
                                                        <input type="text" value={websiteContent.whyChooseUs?.sectionSubtitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, whyChooseUs: { ...websiteContent.whyChooseUs, sectionSubtitle: e.target.value } })} placeholder="Enter section subtitle..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><CheckCircle size={16} /> Features</h4>
                                                    <span className="section-badge">{websiteContent.whyChooseUs?.features?.length || 0} features</span>
                                                </div>
                                                <div className="cms-cards-list">
                                                    {websiteContent.whyChooseUs?.features?.map((feature, idx) => (
                                                        <div key={idx} className="cms-card-editor">
                                                            <div className="cms-card-header">
                                                                <span className="card-number">Feature {idx + 1}</span>
                                                            </div>
                                                            <div className="cms-form-grid">
                                                                <div className="form-group">
                                                                    <label>Title</label>
                                                                    <input type="text" value={feature.title} onChange={(e) => {
                                                                        const newFeatures = [...websiteContent.whyChooseUs.features];
                                                                        newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, whyChooseUs: { ...websiteContent.whyChooseUs, features: newFeatures } });
                                                                    }} placeholder="Feature title..." />
                                                                </div>
                                                                <div className="form-group full-width">
                                                                    <label>Description</label>
                                                                    <textarea rows={2} value={feature.description} onChange={(e) => {
                                                                        const newFeatures = [...websiteContent.whyChooseUs.features];
                                                                        newFeatures[idx] = { ...newFeatures[idx], description: e.target.value };
                                                                        setWebsiteContent({ ...websiteContent, whyChooseUs: { ...websiteContent.whyChooseUs, features: newFeatures } });
                                                                    }} placeholder="Feature description..." />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => handleSaveContent('whyChooseUs', websiteContent.whyChooseUs)} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save Why Choose Us</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CTA SECTIONS EDITOR */}
                                {activeContentSection === 'cta' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <h3>Call to Action Sections</h3>
                                                <p className="editor-description">Manage the promotional CTAs on your website.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><DollarSign size={16} /> Sell Device CTA</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Title</label>
                                                        <input type="text" value={websiteContent.sellCta?.title || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, sellCta: { ...websiteContent.sellCta, title: e.target.value } })} placeholder="CTA title..." />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><Edit2 size={14} /> Description</label>
                                                        <textarea rows={2} value={websiteContent.sellCta?.description || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, sellCta: { ...websiteContent.sellCta, description: e.target.value } })} placeholder="CTA description..." />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Button Text</label>
                                                        <input type="text" value={websiteContent.sellCta?.buttonText || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, sellCta: { ...websiteContent.sellCta, buttonText: e.target.value } })} placeholder="e.g., Get a Quote" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><TrendingUp size={16} /> Main CTA Section</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Title</label>
                                                        <input type="text" value={websiteContent.ctaSection?.title || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, ctaSection: { ...websiteContent.ctaSection, title: e.target.value } })} placeholder="CTA title..." />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Subtitle</label>
                                                        <input type="text" value={websiteContent.ctaSection?.subtitle || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, ctaSection: { ...websiteContent.ctaSection, subtitle: e.target.value } })} placeholder="CTA subtitle..." />
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Primary Button</label>
                                                            <input type="text" value={websiteContent.ctaSection?.primaryButtonText || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, ctaSection: { ...websiteContent.ctaSection, primaryButtonText: e.target.value } })} placeholder="Primary button text" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Secondary Button</label>
                                                            <input type="text" value={websiteContent.ctaSection?.secondaryButtonText || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, ctaSection: { ...websiteContent.ctaSection, secondaryButtonText: e.target.value } })} placeholder="Secondary button text" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => { handleSaveContent('sellCta', websiteContent.sellCta); handleSaveContent('ctaSection', websiteContent.ctaSection); }} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save All CTAs</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONTACT INFO EDITOR */}
                                {activeContentSection === 'contact' && (
                                    <div className="editor-card professional-cms">
                                        <div className="cms-header">
                                            <div className="cms-header-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                                                <Send size={24} />
                                            </div>
                                            <div>
                                                <h3>Contact & Footer</h3>
                                                <p className="editor-description">Manage your business contact details and footer content.</p>
                                            </div>
                                        </div>

                                        <div className="cms-content">
                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Send size={16} /> Contact Information</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><RefreshCw size={14} /> Phone</label>
                                                        <input type="text" value={websiteContent.contact?.phone || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, contact: { ...websiteContent.contact, phone: e.target.value } })} placeholder="(555) 123-4567" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Send size={14} /> Support Email</label>
                                                        <input type="email" value={websiteContent.contact?.supportEmail || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, contact: { ...websiteContent.contact, supportEmail: e.target.value } })} placeholder="support@sifixa.com" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Mail size={14} /> Info Email</label>
                                                        <input type="email" value={websiteContent.contact?.infoEmail || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, contact: { ...websiteContent.contact, infoEmail: e.target.value } })} placeholder="info@sifixa.com" />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><Edit2 size={14} /> Address</label>
                                                        <textarea rows={2} value={websiteContent.contact?.address || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, contact: { ...websiteContent.contact, address: e.target.value } })} placeholder="Full business address..." />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><Clock size={14} /> Business Hours</label>
                                                        <input type="text" value={websiteContent.contact?.hours || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, contact: { ...websiteContent.contact, hours: e.target.value } })} placeholder="Mon-Sat: 9AM - 7PM" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-section">
                                                <div className="cms-section-header">
                                                    <h4><Layers size={16} /> Footer Content</h4>
                                                </div>
                                                <div className="cms-form-grid">
                                                    <div className="form-group">
                                                        <label><FileText size={14} /> Company Name</label>
                                                        <input type="text" value={websiteContent.footer?.companyName || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, footer: { ...websiteContent.footer, companyName: e.target.value } })} placeholder="Your Company Name" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Edit2 size={14} /> Tagline</label>
                                                        <input type="text" value={websiteContent.footer?.tagline || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, footer: { ...websiteContent.footer, tagline: e.target.value } })} placeholder="Your company tagline" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Send size={14} /> Footer Support Email</label>
                                                        <input type="email" value={websiteContent.footer?.supportEmail || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, footer: { ...websiteContent.footer, supportEmail: e.target.value } })} placeholder="support@sifixa.com" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Mail size={14} /> Footer Info Email</label>
                                                        <input type="email" value={websiteContent.footer?.infoEmail || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, footer: { ...websiteContent.footer, infoEmail: e.target.value } })} placeholder="info@sifixa.com" />
                                                    </div>
                                                    <div className="form-group full-width">
                                                        <label><FileText size={14} /> Copyright Text</label>
                                                        <input type="text" value={websiteContent.footer?.copyright || ''} onChange={(e) => setWebsiteContent({ ...websiteContent, footer: { ...websiteContent.footer, copyright: e.target.value } })} placeholder="© 2025 Company. All rights reserved." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cms-actions">
                                                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-preview"><Eye size={16} /> Preview</a>
                                                <button className="btn-save-cms" onClick={() => { handleSaveContent('contact', websiteContent.contact); handleSaveContent('footer', websiteContent.footer); }} disabled={contentSaving}>
                                                    {contentSaving ? 'Saving...' : <><CheckCircle size={18} /> Save Contact & Footer</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* LEGAL PAGES EDITOR */}
                                {activeContentSection === 'legal' && (
                                    <div className="editor-card legal-cms">
                                        <div className="legal-cms-header">
                                            <div>
                                                <h3><FileText size={24} /> Legal Pages CMS</h3>
                                                <p className="editor-description">Manage your legal and policy pages. Click on a policy to expand and edit its content.</p>
                                            </div>
                                            <button
                                                className="btn-reset-defaults"
                                                onClick={handleResetLegalContent}
                                                disabled={contentSaving}
                                                title="Reset all legal pages to default content"
                                            >
                                                <RefreshCw size={16} /> Load Default Content
                                            </button>
                                        </div>

                                        {/* Policy configuration */}
                                        {[
                                            { key: 'privacyPolicy', title: 'Privacy Policy', icon: Shield, color: '#3b82f6', path: '/privacy' },
                                            { key: 'termsOfUse', title: 'Terms of Use', icon: FileText, color: '#8b5cf6', path: '/terms' },
                                            { key: 'refundPolicy', title: 'Refund Policy', icon: DollarSign, color: '#10b981', path: '/refund' },
                                            { key: 'warrantyPolicy', title: 'Warranty Policy', icon: Shield, color: '#f59e0b', path: '/warranty' },
                                            { key: 'cookiePolicy', title: 'Cookie Policy', icon: Cookie, color: '#ec4899', path: '/cookies' }
                                        ].map(({ key, title, icon: Icon, color, path }) => (
                                            <div key={key} className={`legal-accordion ${expandedLegalPages[key] ? 'expanded' : ''}`}>
                                                <div
                                                    className="legal-accordion-header"
                                                    onClick={() => setExpandedLegalPages(prev => ({ ...prev, [key]: !prev[key] }))}
                                                >
                                                    <div className="legal-accordion-title">
                                                        <div className="legal-icon-wrapper" style={{ background: `${color}20`, color: color }}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="legal-title-info">
                                                            <span className="legal-title-text">{title}</span>
                                                            <span className="legal-section-count">
                                                                {websiteContent.legalPages?.[key]?.sections?.length || 0} sections
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="legal-accordion-actions">
                                                        <a
                                                            href={path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="preview-link"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Preview page"
                                                        >
                                                            <Eye size={16} />
                                                        </a>
                                                        {expandedLegalPages[key] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </div>
                                                </div>

                                                {expandedLegalPages[key] && (
                                                    <div className="legal-accordion-content">
                                                        <div className="legal-form-grid">
                                                            <div className="form-group">
                                                                <label><FileText size={14} /> Page Title</label>
                                                                <input
                                                                    type="text"
                                                                    value={websiteContent.legalPages?.[key]?.title || ''}
                                                                    onChange={(e) => setWebsiteContent({
                                                                        ...websiteContent,
                                                                        legalPages: {
                                                                            ...websiteContent.legalPages,
                                                                            [key]: { ...websiteContent.legalPages?.[key], title: e.target.value }
                                                                        }
                                                                    })}
                                                                    placeholder="Enter page title..."
                                                                />
                                                            </div>
                                                            <div className="form-row">
                                                                <div className="form-group">
                                                                    <label><Calendar size={14} /> Last Updated</label>
                                                                    <input
                                                                        type="text"
                                                                        value={websiteContent.legalPages?.[key]?.lastUpdated || ''}
                                                                        onChange={(e) => setWebsiteContent({
                                                                            ...websiteContent,
                                                                            legalPages: {
                                                                                ...websiteContent.legalPages,
                                                                                [key]: { ...websiteContent.legalPages?.[key], lastUpdated: e.target.value }
                                                                            }
                                                                        })}
                                                                        placeholder="e.g., December 2025"
                                                                    />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label><Send size={14} /> Contact Email</label>
                                                                    <input
                                                                        type="email"
                                                                        value={websiteContent.legalPages?.[key]?.contactEmail || ''}
                                                                        onChange={(e) => setWebsiteContent({
                                                                            ...websiteContent,
                                                                            legalPages: {
                                                                                ...websiteContent.legalPages,
                                                                                [key]: { ...websiteContent.legalPages?.[key], contactEmail: e.target.value }
                                                                            }
                                                                        })}
                                                                        placeholder="contact@example.com"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group full-width">
                                                                <label><Edit2 size={14} /> Introduction</label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={websiteContent.legalPages?.[key]?.intro || ''}
                                                                    onChange={(e) => setWebsiteContent({
                                                                        ...websiteContent,
                                                                        legalPages: {
                                                                            ...websiteContent.legalPages,
                                                                            [key]: { ...websiteContent.legalPages?.[key], intro: e.target.value }
                                                                        }
                                                                    })}
                                                                    placeholder="Enter the introduction paragraph for this policy..."
                                                                />
                                                                <span className="char-count">{(websiteContent.legalPages?.[key]?.intro || '').length} characters</span>
                                                            </div>
                                                        </div>

                                                        <div className="sections-header">
                                                            <h5><Layers size={16} /> Content Sections</h5>
                                                            <button
                                                                className="btn-add-section"
                                                                onClick={() => {
                                                                    const currentSections = websiteContent.legalPages?.[key]?.sections || [];
                                                                    setWebsiteContent({
                                                                        ...websiteContent,
                                                                        legalPages: {
                                                                            ...websiteContent.legalPages,
                                                                            [key]: {
                                                                                ...websiteContent.legalPages?.[key],
                                                                                sections: [...currentSections, { heading: '', content: '' }]
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                            >
                                                                <Plus size={16} /> Add Section
                                                            </button>
                                                        </div>

                                                        <div className="sections-list">
                                                            {websiteContent.legalPages?.[key]?.sections?.map((section, idx) => (
                                                                <div key={idx} className="section-editor">
                                                                    <div className="section-editor-header">
                                                                        <span className="section-number">Section {idx + 1}</span>
                                                                        <button
                                                                            className="btn-remove-section"
                                                                            onClick={() => {
                                                                                const newSections = [...(websiteContent.legalPages?.[key]?.sections || [])];
                                                                                newSections.splice(idx, 1);
                                                                                setWebsiteContent({
                                                                                    ...websiteContent,
                                                                                    legalPages: {
                                                                                        ...websiteContent.legalPages,
                                                                                        [key]: {
                                                                                            ...websiteContent.legalPages?.[key],
                                                                                            sections: newSections
                                                                                        }
                                                                                    }
                                                                                });
                                                                            }}
                                                                            title="Remove this section"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Heading</label>
                                                                        <input
                                                                            type="text"
                                                                            value={section.heading}
                                                                            onChange={(e) => {
                                                                                const newSections = [...(websiteContent.legalPages?.[key]?.sections || [])];
                                                                                newSections[idx] = { ...newSections[idx], heading: e.target.value };
                                                                                setWebsiteContent({
                                                                                    ...websiteContent,
                                                                                    legalPages: {
                                                                                        ...websiteContent.legalPages,
                                                                                        [key]: { ...websiteContent.legalPages?.[key], sections: newSections }
                                                                                    }
                                                                                });
                                                                            }}
                                                                            placeholder="Section heading..."
                                                                        />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Content</label>
                                                                        <textarea
                                                                            rows={4}
                                                                            value={section.content}
                                                                            onChange={(e) => {
                                                                                const newSections = [...(websiteContent.legalPages?.[key]?.sections || [])];
                                                                                newSections[idx] = { ...newSections[idx], content: e.target.value };
                                                                                setWebsiteContent({
                                                                                    ...websiteContent,
                                                                                    legalPages: {
                                                                                        ...websiteContent.legalPages,
                                                                                        [key]: { ...websiteContent.legalPages?.[key], sections: newSections }
                                                                                    }
                                                                                });
                                                                            }}
                                                                            placeholder="Section content..."
                                                                        />
                                                                        <span className="char-count">{(section.content || '').length} characters</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!websiteContent.legalPages?.[key]?.sections || websiteContent.legalPages?.[key]?.sections.length === 0) && (
                                                                <div className="no-sections">
                                                                    <Layers size={32} />
                                                                    <p>No sections yet. Click "Add Section" to create your first content section.</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="legal-actions">
                                                            <button
                                                                className="btn-save-policy"
                                                                onClick={() => handleSaveContent('legalPages', websiteContent.legalPages)}
                                                                disabled={contentSaving}
                                                            >
                                                                {contentSaving ? (
                                                                    <>Saving...</>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle size={18} />
                                                                        Save {title}
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ACTIVITY LOG TAB */}
                    {activeTab === 'activity' && (
                        <div className="activity-section">
                            {/* Activity Stats */}
                            {activityStats && (
                                <div className="activity-stats-grid">
                                    <div className="activity-stat-card">
                                        <div className="stat-icon blue"><History size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{activityStats.totalActivities}</span>
                                            <span className="stat-label">Total Activities</span>
                                        </div>
                                    </div>
                                    <div className="activity-stat-card">
                                        <div className="stat-icon green"><Activity size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{activityStats.activitiesToday}</span>
                                            <span className="stat-label">Today</span>
                                        </div>
                                    </div>
                                    <div className="activity-stat-card">
                                        <div className="stat-icon purple"><Calendar size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">{activityStats.activitiesThisWeek}</span>
                                            <span className="stat-label">This Week</span>
                                        </div>
                                    </div>
                                    <div className="activity-stat-card">
                                        <div className="stat-icon orange"><DollarSign size={24} /></div>
                                        <div className="stat-info">
                                            <span className="stat-value">${activityStats.totalRevenue?.toFixed(2) || '0.00'}</span>
                                            <span className="stat-label">Revenue Tracked</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div className="activity-filters">
                                <div className="filter-group">
                                    <div className="search-box">
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search activities..."
                                            value={activityFilters.search}
                                            onChange={(e) => setActivityFilters({ ...activityFilters, search: e.target.value })}
                                        />
                                    </div>
                                    <select
                                        value={activityFilters.category}
                                        onChange={(e) => setActivityFilters({ ...activityFilters, category: e.target.value })}
                                        className="filter-select"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="auth">Authentication</option>
                                        <option value="booking">Bookings</option>
                                        <option value="inventory">Inventory</option>
                                        <option value="sales">Sales</option>
                                        <option value="customer">Customer</option>
                                        <option value="employee">Employee</option>
                                        <option value="system">System</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={activityFilters.startDate}
                                        onChange={(e) => setActivityFilters({ ...activityFilters, startDate: e.target.value })}
                                        className="date-input"
                                        placeholder="From"
                                    />
                                    <input
                                        type="date"
                                        value={activityFilters.endDate}
                                        onChange={(e) => setActivityFilters({ ...activityFilters, endDate: e.target.value })}
                                        className="date-input"
                                        placeholder="To"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={() => setActivityFilters({ category: '', search: '', startDate: '', endDate: '' })}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            {/* Activity Timeline */}
                            <div className="activity-timeline">
                                <h3><History size={18} /> Recent Activity ({activityTotal} total)</h3>
                                {activityLog.length === 0 ? (
                                    <div className="empty-state">
                                        <History size={48} />
                                        <p>No activities found</p>
                                    </div>
                                ) : (
                                    <div className="activity-list">
                                        {activityLog.map((activity) => (
                                            <div key={activity.id} className={`activity-item category-${activity.category}`}>
                                                <div className="activity-avatar">
                                                    {activity.userName?.charAt(0) || '?'}
                                                </div>
                                                <div className="activity-content">
                                                    <div className="activity-header">
                                                        <span className="activity-user">{activity.userName}</span>
                                                        <span className={`activity-role role-${activity.userRole}`}>{activity.userRole}</span>
                                                        <span className={`activity-category cat-${activity.category}`}>{activity.category}</span>
                                                    </div>
                                                    <div className="activity-action">{activity.action}</div>
                                                    <div className="activity-details">{activity.details}</div>
                                                    {activity.metadata?.amount && (
                                                        <div className="activity-amount">
                                                            <DollarSign size={14} /> ${activity.metadata.amount.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="activity-time">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {activityTotal > 20 && (
                                    <div className="activity-pagination">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                                            disabled={activityPage === 1}
                                        >
                                            <ChevronLeft size={16} /> Previous
                                        </Button>
                                        <span className="page-info">
                                            Page {activityPage} of {Math.ceil(activityTotal / 20)}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setActivityPage(p => p + 1)}
                                            disabled={activityPage >= Math.ceil(activityTotal / 20)}
                                        >
                                            Next <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Top Users */}
                            {activityStats?.topUsers && activityStats.topUsers.length > 0 && (
                                <div className="top-users-section">
                                    <h3><Users size={18} /> Most Active Users</h3>
                                    <div className="top-users-list">
                                        {activityStats.topUsers.map((user, index) => (
                                            <div key={user.name} className="top-user-item">
                                                <span className="user-rank">#{index + 1}</span>
                                                <span className="user-name">{user.name}</span>
                                                <span className="user-count">{user.count} actions</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SALES HISTORY TAB */}
                    {activeTab === 'sales' && (
                        <div className="sales-history-section">
                            {/* Sales Stats */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon blue"><DollarSign size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">${salesStats?.totalRevenue?.toFixed(2) || '0.00'}</span>
                                        <span className="stat-label">Total Revenue</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon green"><Receipt size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{salesStats?.totalTransactions || 0}</span>
                                        <span className="stat-label">Transactions</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orange"><ShoppingBag size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">${salesStats?.retailRevenue?.toFixed(2) || '0.00'}</span>
                                        <span className="stat-label">Retail Sales</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan"><CheckCircle size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">${salesStats?.repairRevenue?.toFixed(2) || '0.00'}</span>
                                        <span className="stat-label">Repair Pickups</span>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="section-header">
                                <h2>Transaction History</h2>
                                <div className="filter-row">
                                    <select
                                        value={salesFilter.type}
                                        onChange={(e) => setSalesFilter({ ...salesFilter, type: e.target.value })}
                                        className="filter-select"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="retail">Retail Sales</option>
                                        <option value="repair-pickup">Repair Pickups</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={salesFilter.dateFrom}
                                        onChange={(e) => setSalesFilter({ ...salesFilter, dateFrom: e.target.value })}
                                        className="filter-input"
                                        placeholder="From Date"
                                    />
                                    <input
                                        type="date"
                                        value={salesFilter.dateTo}
                                        onChange={(e) => setSalesFilter({ ...salesFilter, dateTo: e.target.value })}
                                        className="filter-input"
                                        placeholder="To Date"
                                    />
                                    <Button variant="secondary" onClick={loadSalesData}>
                                        <RefreshCw size={16} /> Refresh
                                    </Button>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Receipt #</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Payment</th>
                                            <th>Total</th>
                                            <th>Employee</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesHistory
                                            .filter(sale => {
                                                if (salesFilter.type !== 'all' && sale.type !== salesFilter.type) return false;
                                                if (salesFilter.dateFrom && sale.date < salesFilter.dateFrom) return false;
                                                if (salesFilter.dateTo && sale.date > salesFilter.dateTo) return false;
                                                return true;
                                            })
                                            .map(sale => (
                                                <tr key={sale.id}>
                                                    <td className="receipt-number">{sale.receiptNumber || sale.id}</td>
                                                    <td>{sale.date}</td>
                                                    <td>{sale.time}</td>
                                                    <td>
                                                        <span className={`type-badge ${sale.type === 'retail' ? 'retail' : 'repair'}`}>
                                                            {sale.type === 'retail' ? 'Retail' : 'Repair Pickup'}
                                                        </span>
                                                    </td>
                                                    <td>{sale.customerName || 'Walk-in'}</td>
                                                    <td>
                                                        {sale.items?.length > 0 ? (
                                                            <div className="items-list">
                                                                {sale.items.slice(0, 2).map((item, idx) => (
                                                                    <span key={idx} className="item-name">{item.name || item.serviceName}</span>
                                                                ))}
                                                                {sale.items.length > 2 && (
                                                                    <span className="more-items">+{sale.items.length - 2} more</span>
                                                                )}
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td>
                                                        <span className="payment-method">
                                                            <CreditCard size={14} /> {sale.paymentMethod || 'Cash'}
                                                        </span>
                                                    </td>
                                                    <td className="amount">${sale.total?.toFixed(2) || '0.00'}</td>
                                                    <td>{sale.employeeName || '-'}</td>
                                                </tr>
                                            ))}
                                        {salesHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="9" className="empty-message">
                                                    No sales transactions found. Complete a sale in POS to see it here.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            {salesHistory.length > 0 && (
                                <div className="sales-summary">
                                    <div className="summary-item">
                                        <span>Average Transaction:</span>
                                        <strong>${salesStats?.averageTransactionValue?.toFixed(2) || '0.00'}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Retail Transactions:</span>
                                        <strong>{salesStats?.retailTransactions || 0}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Repair Pickups:</span>
                                        <strong>{salesStats?.repairPickups || 0}</strong>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SYSTEM TAB */}
                    {activeTab === 'system' && (
                        <div className="system-section">
                            <h2>System Management</h2>
                            <div className="system-grid">
                                <div className="system-card">
                                    <h3>Business Settings</h3>
                                    <div className="settings-info">
                                        <p><strong>Name:</strong> {settings.businessName}</p>
                                        <p><strong>Email:</strong> {settings.email}</p>
                                        <p><strong>Phone:</strong> {settings.phone}</p>
                                        <p><strong>Address:</strong> {settings.address}</p>
                                    </div>
                                    <Button variant="secondary" onClick={() => setShowSettingsModal(true)}>
                                        <Settings size={16} /> Edit Settings
                                    </Button>
                                </div>
                                <div className="system-card">
                                    <h3>Data Management</h3>
                                    <p>Export or reset all system data.</p>
                                    <div className="system-actions">
                                        <Button variant="secondary" onClick={exportAllData}>
                                            <Download size={16} /> Export All Data
                                        </Button>
                                        <Button variant="danger" onClick={handleResetAllData}>
                                            <RefreshCw size={16} /> Reset All Data
                                        </Button>
                                    </div>
                                </div>
                                <div className="system-card">
                                    <h3>Statistics Summary</h3>
                                    <div className="stats-summary">
                                        <p><strong>Total Bookings:</strong> {stats.totalBookings}</p>
                                        <p><strong>Completed:</strong> {stats.completed}</p>
                                        <p><strong>Admins:</strong> {stats.totalAdmins}</p>
                                        <p><strong>Employees:</strong> {stats.totalEmployees}</p>
                                        <p><strong>Services:</strong> {stats.totalServices} ({stats.activeServices} active)</p>
                                    </div>
                                </div>
                                <div className="system-card time-slots-card">
                                    <h3><Timer size={18} /> Time Slot Availability</h3>
                                    <p>Configure booking time slots and capacity.</p>
                                    <div className="time-slots-list">
                                        {timeSlots.map(slot => (
                                            <div key={slot.id} className={`time-slot-item ${slot.active ? '' : 'inactive'}`}>
                                                <div className="slot-info">
                                                    <strong>{slot.name}</strong>
                                                    <span>{slot.startTime} - {slot.endTime}</span>
                                                </div>
                                                <div className="slot-capacity">
                                                    <span className="capacity-badge">{slot.maxBookings} slots</span>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={slot.active}
                                                            onChange={async (e) => {
                                                                await mockApi.updateTimeSlot(slot.id, { active: e.target.checked });
                                                                loadData();
                                                            }}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="secondary" onClick={() => setShowTimeSlotsModal(true)}>
                                        <Edit2 size={16} /> Edit Time Slots
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {showUserModal && (
                <UserModal
                    user={editingItem}
                    onSave={handleSaveUser}
                    onClose={() => { setShowUserModal(false); setEditingItem(null); }}
                />
            )}

            {showServiceModal && (
                <ServiceModal
                    service={editingItem}
                    onSave={handleSaveService}
                    onClose={() => { setShowServiceModal(false); setEditingItem(null); }}
                />
            )}

            {showSettingsModal && (
                <SettingsModal
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {showTimeSlotsModal && (
                <TimeSlotsModal
                    timeSlots={timeSlots}
                    onSave={() => { setShowTimeSlotsModal(false); loadData(); }}
                    onClose={() => setShowTimeSlotsModal(false)}
                />
            )}

            {showCustomerModal && (
                <CustomerModal
                    customer={editingItem}
                    onSave={handleSaveCustomer}
                    onClose={() => { setShowCustomerModal(false); setEditingItem(null); }}
                />
            )}

            {showInventoryModal && (
                <InventoryModal
                    item={editingItem}
                    onSave={handleSaveInventory}
                    onClose={() => { setShowInventoryModal(false); setEditingItem(null); }}
                />
            )}

            {showPurchaseOrderModal && (
                <PurchaseOrderModal
                    order={editingItem}
                    inventory={inventory}
                    onSave={(orderData) => {
                        if (editingItem) {
                            handleUpdatePurchaseOrder(editingItem.id, orderData);
                        } else {
                            handleCreatePurchaseOrder(orderData);
                        }
                    }}
                    onClose={() => { setShowPurchaseOrderModal(false); setEditingItem(null); }}
                />
            )}
        </div>
    );
};

// ========== MODAL COMPONENTS ==========

const UserModal = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        role: user?.role || 'technician',
        password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData };
        if (!data.password) delete data.password;
        onSave(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Edit User' : 'Add New User'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: validateName(e.target.value) })}
                            placeholder="Letters only"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: validateUsername(e.target.value) })}
                            placeholder="Lowercase, no spaces"
                            required
                            disabled={!!user}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="admin">Administrator</option>
                            <option value="technician">Technician</option>
                            <option value="support">Support Team</option>
                            <option value="inventory">Inventory Staff</option>
                            <option value="sales">Sales / Cashier (POS)</option>
                        </select>
                    </div>
                    {!user && (
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Default: password123" />
                        </div>
                    )}
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">{user ? 'Update' : 'Add'} User</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ServiceModal = ({ service, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: service?.name || '',
        description: service?.description || '',
        priceMin: service?.priceMin || '',
        priceMax: service?.priceMax || '',
        category: service?.category || 'phone'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            priceMin: Number(formData.priceMin),
            priceMax: Number(formData.priceMax)
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{service ? 'Edit Service' : 'Add New Service'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Service Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: validateText(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: validateText(e.target.value) })}
                            rows="3"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Min Price ($)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={formData.priceMin}
                                onChange={e => setFormData({ ...formData, priceMin: validatePrice(e.target.value) })}
                                placeholder="Numbers only"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Price ($)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={formData.priceMax}
                                onChange={e => setFormData({ ...formData, priceMax: validatePrice(e.target.value) })}
                                placeholder="Numbers only"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            <option value="phone">Phone</option>
                            <option value="computer">Computer</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">{service ? 'Update' : 'Add'} Service</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SettingsModal = ({ settings, onSave, onClose }) => {
    const [formData, setFormData] = useState({ ...settings });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Business Settings</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Business Name</label>
                        <input type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: validateText(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: validatePhone(e.target.value) })}
                            placeholder="Numbers only"
                        />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: validateText(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Business Hours</label>
                        <input type="text" value={formData.businessHours} onChange={e => setFormData({ ...formData, businessHours: validateText(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Tax Rate (%)</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={formData.taxRate}
                            onChange={e => setFormData({ ...formData, taxRate: validatePrice(e.target.value) })}
                            placeholder="0-100"
                        />
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Settings</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TimeSlotsModal = ({ timeSlots, onSave, onClose }) => {
    const [slots, setSlots] = useState(timeSlots.map(s => ({ ...s })));

    const handleSlotChange = (id, field, value) => {
        setSlots(slots.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        for (const slot of slots) {
            await mockApi.updateTimeSlot(slot.id, slot);
        }
        onSave();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Time Slots</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="time-slots-editor">
                        {slots.map(slot => (
                            <div key={slot.id} className="time-slot-edit-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={slot.name}
                                        onChange={e => handleSlotChange(slot.id, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input
                                        type="text"
                                        value={slot.startTime}
                                        onChange={e => handleSlotChange(slot.id, 'startTime', e.target.value)}
                                        placeholder="e.g. 8:00 AM"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input
                                        type="text"
                                        value={slot.endTime}
                                        onChange={e => handleSlotChange(slot.id, 'endTime', e.target.value)}
                                        placeholder="e.g. 12:00 PM"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Max Bookings</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={slot.maxBookings}
                                        onChange={e => handleSlotChange(slot.id, 'maxBookings', parseInt(e.target.value) || 1)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Active</label>
                                    <label className="toggle-switch inline">
                                        <input
                                            type="checkbox"
                                            checked={slot.active}
                                            onChange={e => handleSlotChange(slot.id, 'active', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Time Slots</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerModal = ({ customer, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        notes: customer?.notes || '',
        tags: customer?.tags?.join(', ') || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: validatePhone(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="vip, business, repeat"
                        />
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">{customer ? 'Update' : 'Add'} Customer</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InventoryModal = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        sku: item?.sku || '',
        category: item?.category || 'screens',
        quantity: item?.quantity || 0,
        minStock: item?.minStock || 5,
        cost: item?.cost || '',
        supplier: item?.supplier || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            quantity: Number(formData.quantity),
            minStock: Number(formData.minStock),
            cost: Number(formData.cost)
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{item ? 'Edit Inventory Item' : 'Add New Item'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Item Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>SKU</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                placeholder="e.g. SCR-IP15"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="screens">Screens</option>
                                <option value="batteries">Batteries</option>
                                <option value="components">Components</option>
                                <option value="storage">Storage</option>
                                <option value="tools">Tools</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Min Stock Alert</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.minStock}
                                onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Cost ($)</label>
                            <input
                                type="text"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: validatePrice(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Supplier</label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">{item ? 'Update' : 'Add'} Item</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PurchaseOrderModal = ({ order, inventory, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        supplier: order?.supplier || '',
        notes: order?.notes || '',
        items: order?.items || [{ itemId: '', name: '', quantity: 1, cost: 0 }]
    });

    const suppliers = [...new Set(inventory.map(i => i.supplier))];

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemId: '', name: '', quantity: 1, cost: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // If itemId changes, update name and cost from inventory
        if (field === 'itemId' && value) {
            const invItem = inventory.find(i => i.id === parseInt(value));
            if (invItem) {
                newItems[index].name = invItem.name;
                newItems[index].cost = invItem.cost;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.items.length === 0 || !formData.items[0].itemId) {
            alert('Please add at least one item');
            return;
        }
        onSave({
            ...formData,
            items: formData.items.filter(i => i.itemId).map(i => ({
                ...i,
                itemId: parseInt(i.itemId),
                quantity: parseInt(i.quantity),
                cost: parseFloat(i.cost)
            }))
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{order ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Supplier</label>
                            <select
                                value={formData.supplier}
                                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                required
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <div className="po-items-section">
                        <h4>Order Items</h4>
                        <table className="po-items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Unit Cost</th>
                                    <th>Subtotal</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                value={item.itemId}
                                                onChange={e => handleItemChange(index, 'itemId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Item</option>
                                                {inventory
                                                    .filter(i => !formData.supplier || i.supplier === formData.supplier)
                                                    .map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                                                    ))
                                                }
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td>${item.cost}</td>
                                        <td><strong>${(item.quantity * item.cost).toFixed(2)}</strong></td>
                                        <td>
                                            {formData.items.length > 1 && (
                                                <button type="button" className="icon-btn danger" onClick={() => handleRemoveItem(index)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'right' }}><strong>Total:</strong></td>
                                    <td><strong>${calculateTotal().toFixed(2)}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                        <Button type="button" variant="secondary" onClick={handleAddItem}>
                            <Plus size={14} /> Add Item
                        </Button>
                    </div>

                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">{order ? 'Update' : 'Create'} Order</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;

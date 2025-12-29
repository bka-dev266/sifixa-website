import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationBell } from '../../../components/Notifications';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import {
    MessageSquare, Send, Phone, Mail, Clock, User, Search,
    FileText, CheckCircle, AlertCircle, XCircle, Filter,
    ChevronDown, ChevronRight, ChevronLeft, RefreshCw, Bell, Calendar,
    Smartphone, Laptop, Package, MessageCircle, LogOut,
    Home, Users, Inbox, Settings, LayoutDashboard, Timer
} from 'lucide-react';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import './SupportDashboard.css';

const SupportDashboard = () => {
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Message composition state
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [messageChannel, setMessageChannel] = useState('email');
    const [messageSubject, setMessageSubject] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            loadData(false);
        }, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [statsData, bookingsData, customersData, messagesData, templatesData] = await Promise.all([
                mockApi.getSupportStats(),
                api.bookings.list(),
                api.customers.list(),
                mockApi.getCustomerMessages(),
                mockApi.getMessageTemplates()
            ]);
            setStats(statsData);
            setBookings(bookingsData);
            setCustomers(customersData);
            setMessages(messagesData);
            setTemplates(templatesData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading data:', error);
        }
        if (showLoading) setLoading(false);
    };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'status-pending';
            case 'Confirmed': return 'status-confirmed';
            case 'In Progress': return 'status-progress';
            case 'Completed': return 'status-completed';
            case 'Cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const filteredBookings = bookings
        .filter(b => statusFilter === 'all' || b.status === statusFilter)
        .filter(b =>
            searchTerm === '' ||
            getDeviceName(b.device).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCustomerName(b.customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.issue || b.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(getBookingDate(b)) - new Date(getBookingDate(a)));

    const openMessageModal = (customer, booking = null) => {
        setSelectedCustomer(customer);
        setSelectedBooking(booking);
        setSelectedTemplate(null);
        setMessageSubject('');
        setMessageContent('');
        setMessageChannel('email');
        setShowMessageModal(true);
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);

        // Get data for template placeholders
        const data = {
            customerName: getCustomerName(selectedCustomer),
            deviceName: getDeviceName(selectedBooking?.device),
            serviceName: selectedBooking?.issue || selectedBooking?.notes || '',
            estimatedDate: selectedBooking?.estimatedCompletion || 'TBD',
            appointmentDate: getBookingDate(selectedBooking),
            appointmentTime: selectedBooking?.timeSlot?.name || selectedBooking?.scheduledStart || selectedBooking?.time || ''
        };

        const filled = mockApi.fillMessageTemplate(template, data);
        setMessageSubject(filled.subject);
        setMessageContent(filled.message);
    };

    const handleSendMessage = async () => {
        if (!selectedCustomer || !messageContent) return;

        setSending(true);
        try {
            const messageData = {
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                customerEmail: selectedCustomer.email,
                customerPhone: selectedCustomer.phone,
                bookingId: selectedBooking?.id || null,
                employeeId: user.id,
                employeeName: user.name,
                type: selectedTemplate?.type || 'custom',
                subject: messageSubject,
                message: messageContent,
                channel: messageChannel
            };

            await mockApi.sendCustomerMessage(messageData);
            await loadData(); // Refresh messages
            setShowMessageModal(false);
            alert('Message sent successfully!');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
        setSending(false);
    };

    const renderSidebar = () => (
        <aside className={`support-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <div className="sidebar-header">
                <div className="logo">
                    <MessageSquare size={28} />
                    <span>Support</span>
                </div>
            </div>


            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    <Package size={20} />
                    <span>Repairs</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('customers')}
                >
                    <Users size={20} />
                    <span>Customers</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('messages')}
                >
                    <Inbox size={20} />
                    <span>Messages</span>
                </button>
                <button
                    className={`nav-item ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    <FileText size={20} />
                    <span>Templates</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        <User size={20} />
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">Support</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );

    const renderDashboard = () => (
        <div className="support-dashboard-content">
            <div className="dashboard-header">
                <h1>Support Dashboard</h1>
                <div className="header-actions">
                    <div className="refresh-controls">
                        <button className="refresh-btn" onClick={() => loadData(false)} title="Refresh now">
                            <RefreshCw size={18} />
                        </button>
                        <button
                            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                        >
                            <Timer size={18} />
                        </button>
                        <span className="last-update">
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                    <NotificationBell />
                </div>
            </div>


            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.pendingRepairs || 0}</span>
                        <span className="stat-label">Pending Repairs</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon progress">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.inProgressRepairs || 0}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon completed">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.completedToday || 0}</span>
                        <span className="stat-label">Completed Today</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pickup">
                        <Package size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.awaitingPickup || 0}</span>
                        <span className="stat-label">Awaiting Pickup</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon messages">
                        <MessageCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats?.messagesToday || 0}</span>
                        <span className="stat-label">Messages Today</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon total">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{customers.length}</span>
                        <span className="stat-label">Total Customers</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <section className="dashboard-section">
                    <h2>Recent Repairs</h2>
                    <div className="recent-list">
                        {bookings.slice(0, 5).map(booking => {
                            const deviceName = getDeviceName(booking.device);
                            const customerName = getCustomerName(booking.customer);
                            return (
                                <div key={booking.id} className="recent-item">
                                    <div className="item-icon">
                                        {deviceName.includes('MacBook') || deviceName.includes('Laptop')
                                            ? <Laptop size={20} />
                                            : <Smartphone size={20} />
                                        }
                                    </div>
                                    <div className="item-info">
                                        <span className="item-title">{deviceName}</span>
                                        <span className="item-subtitle">{customerName} - {booking.issue || booking.notes || ''}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                    <button
                                        className="action-btn"
                                        onClick={() => {
                                            const customer = customers.find(c => c.name === customerName || c.email === booking.customer?.email);
                                            if (customer) openMessageModal(customer, booking);
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="dashboard-section">
                    <h2>Recent Messages</h2>
                    <div className="recent-list">
                        {messages.slice(0, 5).map(msg => (
                            <div key={msg.id} className="recent-item">
                                <div className={`item-icon ${msg.channel}`}>
                                    {msg.channel === 'email' ? <Mail size={20} /> : <Phone size={20} />}
                                </div>
                                <div className="item-info">
                                    <span className="item-title">{msg.customerName}</span>
                                    <span className="item-subtitle">{msg.subject}</span>
                                </div>
                                <span className="message-time">
                                    {new Date(msg.sentAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );

    const renderBookings = () => (
        <div className="support-content">
            <div className="content-header">
                <h1>Repair Orders</h1>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search repairs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bookings-list">
                {filteredBookings.map(booking => {
                    const deviceName = getDeviceName(booking.device);
                    const customerName = getCustomerName(booking.customer);
                    return (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <div className="booking-device">
                                    {deviceName.includes('MacBook') || deviceName.includes('Laptop')
                                        ? <Laptop size={24} />
                                        : <Smartphone size={24} />
                                    }
                                    <div>
                                        <h3>{deviceName}</h3>
                                        <p>{booking.issue || booking.notes || ''}</p>
                                    </div>
                                </div>
                                <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                            <div className="booking-details">
                                <div className="detail">
                                    <User size={16} />
                                    <span>{customerName}</span>
                                </div>
                                <div className="detail">
                                    <Calendar size={16} />
                                    <span>{getBookingDate(booking)}</span>
                                </div>
                                <div className="detail">
                                    <Clock size={16} />
                                    <span>{booking.timeSlot?.name || booking.scheduledStart || booking.time || ''}</span>
                                </div>
                            </div>
                            <div className="booking-actions">
                                <button
                                    className="btn-contact"
                                    onClick={() => {
                                        const customer = customers.find(c => c.name === customerName || c.email === booking.customer?.email);
                                        if (customer) openMessageModal(customer, booking);
                                    }}
                                >
                                    <Send size={16} />
                                    Contact Customer
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderCustomers = () => (
        <div className="support-content">
            <div className="content-header">
                <h1>Customers</h1>
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="customers-grid">
                {customers
                    .filter(c =>
                        searchTerm === '' ||
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(customer => (
                        <div key={customer.id} className="customer-card">
                            <div className="customer-avatar">
                                <User size={32} />
                            </div>
                            <div className="customer-info">
                                <h3>{customer.name}</h3>
                                <p className="customer-email">
                                    <Mail size={14} />
                                    {customer.email}
                                </p>
                                <p className="customer-phone">
                                    <Phone size={14} />
                                    {customer.phone}
                                </p>
                            </div>
                            <div className="customer-stats">
                                <div className="stat">
                                    <span className="stat-value">{customer.totalBookings}</span>
                                    <span className="stat-label">Repairs</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">${customer.totalSpent}</span>
                                    <span className="stat-label">Spent</span>
                                </div>
                            </div>
                            <div className="customer-actions">
                                <button
                                    className="btn-message"
                                    onClick={() => openMessageModal(customer)}
                                >
                                    <MessageSquare size={16} />
                                    Message
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );

    const renderMessages = () => (
        <div className="support-content">
            <div className="content-header">
                <h1>Message History</h1>
            </div>

            <div className="messages-list">
                {messages.map(msg => (
                    <div key={msg.id} className="message-card">
                        <div className="message-header">
                            <div className="message-recipient">
                                <div className={`channel-badge ${msg.channel}`}>
                                    {msg.channel === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                                    {msg.channel.toUpperCase()}
                                </div>
                                <h3>{msg.customerName}</h3>
                            </div>
                            <span className="message-time">
                                {new Date(msg.sentAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="message-content">
                            <p className="message-subject">{msg.subject}</p>
                            <p className="message-body">{msg.message}</p>
                        </div>
                        <div className="message-meta">
                            <span className="sent-by">Sent by: {msg.employeeName}</span>
                            <span className={`message-status ${msg.status}`}>
                                {msg.status === 'sent' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                {msg.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTemplates = () => (
        <div className="support-content">
            <div className="content-header">
                <h1>Message Templates</h1>
            </div>

            <div className="templates-grid">
                {templates.map(template => (
                    <div key={template.id} className="template-card">
                        <div className="template-header">
                            <h3>{template.name}</h3>
                            <div className="template-channels">
                                {template.channels.map(ch => (
                                    <span key={ch} className={`channel-tag ${ch}`}>
                                        {ch === 'email' ? <Mail size={12} /> : <Phone size={12} />}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="template-content">
                            <p className="template-subject">{template.subject}</p>
                            <p className="template-body">{template.message}</p>
                        </div>
                        <div className="template-type">
                            <span className={`type-badge ${template.type}`}>{template.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMessageModal = () => (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Send Message</h2>
                    <button className="modal-close" onClick={() => setShowMessageModal(false)}>
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="recipient-info">
                        <User size={20} />
                        <span>{selectedCustomer?.name}</span>
                        {selectedBooking && (
                            <span className="booking-ref">Re: {getDeviceName(selectedBooking.device)} - {selectedBooking.issue || selectedBooking.notes || ''}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Channel</label>
                        <div className="channel-options">
                            <button
                                className={`channel-btn ${messageChannel === 'email' ? 'active' : ''}`}
                                onClick={() => setMessageChannel('email')}
                            >
                                <Mail size={18} />
                                Email
                            </button>
                            <button
                                className={`channel-btn ${messageChannel === 'sms' ? 'active' : ''}`}
                                onClick={() => setMessageChannel('sms')}
                            >
                                <Phone size={18} />
                                SMS
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Use Template</label>
                        <select
                            value={selectedTemplate?.id || ''}
                            onChange={(e) => {
                                const template = templates.find(t => t.id === parseInt(e.target.value));
                                if (template) handleTemplateSelect(template);
                            }}
                        >
                            <option value="">Select a template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={messageSubject}
                            onChange={(e) => setMessageSubject(e.target.value)}
                            placeholder="Message subject..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder="Type your message..."
                            rows={6}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setShowMessageModal(false)}>
                        Cancel
                    </button>
                    <button
                        className="btn-send"
                        onClick={handleSendMessage}
                        disabled={sending || !messageContent}
                    >
                        {sending ? 'Sending...' : 'Send Message'}
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="support-loading">
                <div className="loader"></div>
                <p>Loading Support Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="support-dashboard">
            {renderSidebar()}
            <main className={`support-main ${sidebarCollapsed ? 'expanded' : ''}`}>

                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'bookings' && renderBookings()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'messages' && renderMessages()}
                {activeTab === 'templates' && renderTemplates()}
            </main>
            {showMessageModal && renderMessageModal()}
        </div>
    );
};

export default SupportDashboard;

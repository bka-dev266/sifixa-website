import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationBell } from '../../../components/Notifications';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import { RefreshCw, Activity, Calendar, Clipboard, User, MessageSquare, Search, DollarSign, Clock, AlertTriangle, Play, Square, TrendingUp, CheckCircle, X, LogOut, ChevronLeft, ChevronRight, Camera, Upload, Trash2 } from 'lucide-react';
import { validateText } from '../../../utils/validation';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const { user, logout } = useAuth();
    const { addNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [costEstimateInput, setCostEstimateInput] = useState('');
    const previousBookingsRef = useRef([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Gallery state
    const [galleryItems, setGalleryItems] = useState([]);
    const [newGalleryItem, setNewGalleryItem] = useState({
        title: '',
        description: '',
        beforeImage: '',
        afterImage: ''
    });

    // Filter bookings based on search and status
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = searchQuery.trim() === '' ||
            getDeviceName(booking.device).toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCustomerName(booking.customer).toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const loadBookings = useCallback(async (showLoading = false, isInitialLoad = false) => {
        if (showLoading) setLoading(true);
        try {
            const data = await api.bookings.list();

            // Check for new bookings (only after initial load)
            if (!isInitialLoad && previousBookingsRef.current.length > 0) {
                const previousIds = previousBookingsRef.current.map(b => b.id);
                const newBookings = data.filter(b => !previousIds.includes(b.id));

                newBookings.forEach(booking => {
                    addNotification({
                        type: 'new_booking',
                        title: 'New Booking',
                        message: `${getCustomerName(booking.customer)} booked ${getDeviceName(booking.device)} for ${getBookingDate(booking)}`
                    });
                });
            }

            previousBookingsRef.current = data;
            setBookings(data);
            setLastUpdate(new Date());
            if (selectedBooking) {
                const updated = data.find(b => b.id === selectedBooking.id);
                if (updated) setSelectedBooking(updated);
            }
        } catch (error) {
            console.error('Failed to load bookings', error);
        } finally {
            setLoading(false);
        }
    }, [selectedBooking, addNotification]);

    useEffect(() => {
        loadBookings(true, true); // Initial load
        // Load gallery items from localStorage
        const stored = localStorage.getItem('galleryItems');
        if (stored) {
            setGalleryItems(JSON.parse(stored));
        }
    }, []);

    // Auto-refresh every 15 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        // Refresh immediately when enabled
        loadBookings(false);

        const interval = setInterval(() => {
            loadBookings(false);
        }, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh, loadBookings]);

    const handleStatusChange = async (id, newStatus) => {
        // Confirm critical status changes
        if (newStatus === 'Cancelled') {
            if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be easily undone.')) {
                return;
            }
        }
        if (newStatus === 'Completed') {
            if (!window.confirm('Mark this repair as completed? The customer will be notified.')) {
                return;
            }
        }

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

            loadBookings(false);
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking({ ...selectedBooking, status: newStatus });
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim() || !selectedBooking) return;

        try {
            await mockApi.addBookingNote(selectedBooking.id, noteText, user.name);
            setNoteText('');
            loadBookings(false);
            const updatedBooking = {
                ...selectedBooking,
                notes: [...selectedBooking.notes, {
                    id: Date.now(),
                    text: noteText,
                    author: user.name,
                    date: new Date().toISOString().split('T')[0]
                }]
            };
            setSelectedBooking(updatedBooking);
        } catch (error) {
            console.error('Failed to add note', error);
        }
    };

    const handlePriorityChange = async (id, priority) => {
        try {
            await mockApi.updateBookingPriority(id, priority);
            loadBookings(false);
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking({ ...selectedBooking, priority });
            }
        } catch (error) {
            console.error('Failed to update priority', error);
        }
    };

    const handleCostEstimateUpdate = async (e) => {
        e.preventDefault();
        if (!selectedBooking || costEstimateInput === '') return;

        const cost = parseFloat(costEstimateInput);
        if (isNaN(cost) || cost < 0) {
            alert('Please enter a valid cost amount');
            return;
        }

        try {
            await mockApi.updateBookingCostEstimate(selectedBooking.id, cost);
            loadBookings(false);
            setSelectedBooking({ ...selectedBooking, costEstimate: cost });
        } catch (error) {
            console.error('Failed to update cost estimate', error);
        }
    };

    const handleStartTimer = async () => {
        if (!selectedBooking) return;
        try {
            const updated = await mockApi.startRepairTimer(selectedBooking.id);
            setSelectedBooking(updated);
            loadBookings(false);
        } catch (error) {
            console.error('Failed to start timer', error);
        }
    };

    const handleStopTimer = async () => {
        if (!selectedBooking) return;
        try {
            const updated = await mockApi.stopRepairTimer(selectedBooking.id);
            setSelectedBooking(updated);
            loadBookings(false);
        } catch (error) {
            console.error('Failed to stop timer', error);
        }
    };

    const formatTime = (minutes) => {
        if (!minutes) return '0m';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const isTimerRunning = (booking) => {
        return booking?.timeTracking?.startTime && !booking?.timeTracking?.endTime;
    };

    if (loading) return <div className="loading">Loading...</div>;

    // Calculate stats for dashboard
    const pendingCount = bookings.filter(b => b.status === 'Pending').length;
    const inProgressCount = bookings.filter(b => b.status === 'In Progress').length;
    const completedCount = bookings.filter(b => b.status === 'Completed').length;
    const todaysBookings = bookings.filter(b => getBookingDate(b) === new Date().toISOString().split('T')[0]).length;

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
                    <span className="sidebar-subtitle">Employee Panel</span>
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
                        className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        <Clipboard size={20} />
                        <span>My Bookings</span>
                    </button>
                    <button
                        className={`sidebar-link ${activeTab === 'gallery' ? 'active' : ''}`}
                        onClick={() => setActiveTab('gallery')}
                    >
                        <Camera size={20} />
                        <span>Gallery</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{user?.name?.charAt(0) || 'E'}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">Employee</span>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={logout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <div className="admin-topbar">
                    <div className="topbar-left">
                        <h1 className="page-title">
                            {activeTab === 'dashboard' && 'Dashboard Overview'}
                            {activeTab === 'bookings' && 'My Bookings'}
                            {activeTab === 'gallery' && 'Before & After Gallery'}
                        </h1>
                    </div>
                    <div className="topbar-actions">
                        <div className="refresh-controls">
                            <button
                                className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                            >
                                <Activity size={16} />
                            </button>
                            <button className="refresh-btn" onClick={() => loadBookings(false)} title="Refresh now">
                                <RefreshCw size={16} />
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
                                    <div className="stat-icon blue"><Clipboard size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{bookings.length}</span>
                                        <span className="stat-label">Total Assigned</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon orange"><Clock size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{pendingCount}</span>
                                        <span className="stat-label">Pending</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon cyan"><AlertTriangle size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-value">{inProgressCount}</span>
                                        <span className="stat-label">In Progress</span>
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
                                        <div key={booking.id} className="recent-booking-item" onClick={() => { setSelectedBooking(booking); setActiveTab('bookings'); }}>
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
                                        <p className="no-data">No bookings assigned yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOOKINGS TAB */}
                    {activeTab === 'bookings' && (
                        <div className="bookings-section">
                            <div className="table-header">
                                <h2><Clipboard size={20} /> Assigned Bookings</h2>
                                <span className="booking-count">{filteredBookings.length} of {bookings.length} bookings</span>
                            </div>

                            {/* Search and Filter Controls */}
                            <div className="filter-controls">
                                <div className="search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by device, customer, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="status-filter">
                                    <label>Status:</label>
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                        <option value="all">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="dashboard-grid">
                                <div className="bookings-list">
                                    <div className="bookings-container">
                                        {filteredBookings.length === 0 ? (
                                            <div className="empty-state">
                                                <p>{bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your search.'}</p>
                                            </div>
                                        ) : (
                                            filteredBookings.map(booking => (
                                                <div
                                                    key={booking.id}
                                                    className={`booking-card ${selectedBooking?.id === booking.id ? 'active' : ''} ${booking.priority === 'urgent' ? 'priority-urgent' : ''}`}
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    <div className="booking-card-header">
                                                        <div className="device-with-priority">
                                                            <span className="device-name">{getDeviceName(booking.device)}</span>
                                                            {(booking.priority === 'urgent' || booking.priority === 'high') && (
                                                                <span className={`priority-badge ${booking.priority}`}>
                                                                    <AlertTriangle size={12} />
                                                                    {booking.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`status-badge ${booking.status?.toLowerCase().replace(' ', '-')}`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                    <p className="booking-date">
                                                        <Calendar size={14} /> {getBookingDate(booking)} • {booking.timeSlot?.name || booking.scheduledStart || booking.time || ''}
                                                    </p>
                                                    <div className="booking-card-footer">
                                                        <p className="customer-name">
                                                            <User size={14} /> {getCustomerName(booking.customer)}
                                                        </p>
                                                        {booking.costEstimate && (
                                                            <span className="cost-badge">
                                                                <DollarSign size={12} />${booking.costEstimate}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="booking-details">
                                    {selectedBooking ? (
                                        <div className="details-content">
                                            <div className="details-header">
                                                <div>
                                                    <h2>Booking Details</h2>
                                                    <span className="booking-id">#{selectedBooking.id}</span>
                                                </div>
                                                <div className="header-controls">
                                                    <div className="priority-select">
                                                        <AlertTriangle size={16} />
                                                        <select
                                                            value={selectedBooking.priority || 'normal'}
                                                            onChange={(e) => handlePriorityChange(selectedBooking.id, e.target.value)}
                                                            className={`priority-dropdown ${selectedBooking.priority || 'normal'}`}
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="normal">Normal</option>
                                                            <option value="high">High</option>
                                                            <option value="urgent">Urgent</option>
                                                        </select>
                                                    </div>
                                                    <div className="status-actions">
                                                        <select
                                                            value={selectedBooking.status}
                                                            onChange={(e) => handleStatusChange(selectedBooking.id, e.target.value)}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Confirmed">Confirmed</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time Tracking Bar */}
                                            <div className="time-tracking-bar">
                                                <div className="time-info">
                                                    <Clock size={18} />
                                                    <span className="time-label">Time Tracked:</span>
                                                    <span className="time-value">{formatTime(selectedBooking.timeTracking?.totalMinutes)}</span>
                                                    {isTimerRunning(selectedBooking) && (
                                                        <span className="timer-running">
                                                            <span className="pulse-dot"></span>
                                                            Timer running...
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="timer-controls">
                                                    {!isTimerRunning(selectedBooking) ? (
                                                        <button className="timer-btn start" onClick={handleStartTimer} title="Start Timer">
                                                            <Play size={16} /> Start
                                                        </button>
                                                    ) : (
                                                        <button className="timer-btn stop" onClick={handleStopTimer} title="Stop Timer">
                                                            <Square size={16} /> Stop
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="details-grid">
                                                <div className="info-card">
                                                    <h3><Clipboard size={16} /> Device Info</h3>
                                                    <p><strong>Model:</strong> {getDeviceName(selectedBooking.device)}</p>
                                                    <p><strong>Issue:</strong> {selectedBooking.issue || selectedBooking.notes || 'N/A'}</p>
                                                </div>

                                                <div className="info-card">
                                                    <h3><User size={16} /> Customer Info</h3>
                                                    <p><strong>Name:</strong> {getCustomerName(selectedBooking.customer)}</p>
                                                    <p><strong>Email:</strong> {selectedBooking.customer?.email || 'N/A'}</p>
                                                    <p><strong>Phone:</strong> {selectedBooking.customer?.phone || 'N/A'}</p>
                                                </div>

                                                <div className="info-card">
                                                    <h3><Calendar size={16} /> Appointment</h3>
                                                    <p><strong>Date:</strong> {getBookingDate(selectedBooking)}</p>
                                                    <p><strong>Time:</strong> {selectedBooking.timeSlot?.name || selectedBooking.scheduledStart || selectedBooking.time || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Cost Estimate Section */}
                                            <div className="cost-estimate-section">
                                                <h3><DollarSign size={16} /> Cost Estimate</h3>
                                                <div className="cost-estimate-content">
                                                    <div className="current-estimate">
                                                        <span className="estimate-label">Current Estimate:</span>
                                                        <span className="estimate-value">
                                                            {selectedBooking.costEstimate != null
                                                                ? `$${selectedBooking.costEstimate.toFixed(2)}`
                                                                : 'Not set'}
                                                        </span>
                                                    </div>
                                                    <form className="update-estimate-form" onSubmit={handleCostEstimateUpdate}>
                                                        <div className="input-group">
                                                            <span className="currency-symbol">$</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Enter estimate..."
                                                                value={costEstimateInput}
                                                                onChange={(e) => setCostEstimateInput(e.target.value)}
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <Button variant="primary" type="submit" disabled={!costEstimateInput}>Update</Button>
                                                    </form>
                                                </div>
                                            </div>

                                            <div className="notes-section">
                                                <h3><MessageSquare size={16} /> Notes ({selectedBooking.notes.length})</h3>
                                                <div className="notes-list">
                                                    {selectedBooking.notes.length === 0 && <p className="no-notes">No notes yet.</p>}
                                                    {selectedBooking.notes.map(note => (
                                                        <div key={note.id} className="note-item">
                                                            <div className="note-header">
                                                                <span className="note-author">{note.author}</span>
                                                                <span className="note-date">{note.date}</span>
                                                            </div>
                                                            <p>{note.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <form className="add-note-form" onSubmit={handleAddNote}>
                                                    <input
                                                        type="text"
                                                        placeholder="Add a note..."
                                                        value={noteText}
                                                        onChange={(e) => setNoteText(validateText(e.target.value))}
                                                        maxLength={500}
                                                    />
                                                    <Button variant="primary" type="submit" disabled={!noteText.trim()}>Add</Button>
                                                </form>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <Clipboard size={48} />
                                            <p>Select a booking to view details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GALLERY TAB */}
                    {activeTab === 'gallery' && (
                        <div className="gallery-management">
                            <div className="gallery-upload-section">
                                <div className="upload-card">
                                    <h3><Upload size={20} /> Add New Before & After</h3>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!newGalleryItem.title || !newGalleryItem.beforeImage || !newGalleryItem.afterImage) {
                                            alert('Please fill in all required fields');
                                            return;
                                        }
                                        const newItem = {
                                            id: Date.now(),
                                            ...newGalleryItem
                                        };
                                        const updatedItems = [...galleryItems, newItem];
                                        setGalleryItems(updatedItems);
                                        localStorage.setItem('galleryItems', JSON.stringify(updatedItems));
                                        setNewGalleryItem({ title: '', description: '', beforeImage: '', afterImage: '' });
                                        addNotification({
                                            type: 'success',
                                            title: 'Gallery Updated',
                                            message: 'New before/after photo added successfully'
                                        });
                                    }}>
                                        <div className="form-group">
                                            <label>Title *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., iPhone Screen Repair"
                                                value={newGalleryItem.title}
                                                onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Shattered screen restored"
                                                value={newGalleryItem.description}
                                                onChange={(e) => setNewGalleryItem({ ...newGalleryItem, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="image-inputs">
                                            <div className="form-group">
                                                <label>Before Image URL *</label>
                                                <input
                                                    type="text"
                                                    placeholder="/gallery/before-image.png"
                                                    value={newGalleryItem.beforeImage}
                                                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, beforeImage: e.target.value })}
                                                    required
                                                />
                                                {newGalleryItem.beforeImage && (
                                                    <img src={newGalleryItem.beforeImage} alt="Before preview" className="image-preview" />
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label>After Image URL *</label>
                                                <input
                                                    type="text"
                                                    placeholder="/gallery/after-image.png"
                                                    value={newGalleryItem.afterImage}
                                                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, afterImage: e.target.value })}
                                                    required
                                                />
                                                {newGalleryItem.afterImage && (
                                                    <img src={newGalleryItem.afterImage} alt="After preview" className="image-preview" />
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="primary" type="submit">
                                            <Upload size={16} /> Add to Gallery
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            <div className="gallery-list-section">
                                <h3><Camera size={20} /> Current Gallery Items ({galleryItems.length})</h3>
                                {galleryItems.length === 0 ? (
                                    <div className="empty-state">
                                        <Camera size={48} />
                                        <p>No gallery items yet. Add your first before/after photo above.</p>
                                    </div>
                                ) : (
                                    <div className="gallery-items-grid">
                                        {galleryItems.map(item => (
                                            <div key={item.id} className="gallery-item-card">
                                                <div className="gallery-images">
                                                    <div className="gallery-image-box">
                                                        <span className="image-label">Before</span>
                                                        <img src={item.beforeImage} alt="Before" />
                                                    </div>
                                                    <div className="gallery-image-box">
                                                        <span className="image-label">After</span>
                                                        <img src={item.afterImage} alt="After" />
                                                    </div>
                                                </div>
                                                <div className="gallery-item-info">
                                                    <h4>{item.title}</h4>
                                                    <p>{item.description}</p>
                                                </div>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => {
                                                        if (window.confirm('Delete this gallery item?')) {
                                                            const updated = galleryItems.filter(g => g.id !== item.id);
                                                            setGalleryItems(updated);
                                                            localStorage.setItem('galleryItems', JSON.stringify(updated));
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmployeeDashboard;

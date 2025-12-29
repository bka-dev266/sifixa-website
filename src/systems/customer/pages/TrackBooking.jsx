import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for legacy operations
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, MapPin, User, Phone, Mail, ArrowRight, Smartphone, Calendar, FileText, History } from 'lucide-react';
import Button from '../../../components/Button';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import './TrackBooking.css';

const TrackBooking = () => {
    const [searchType, setSearchType] = useState('tracking');
    const [searchValue, setSearchValue] = useState('');
    const [booking, setBooking] = useState(null);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle input change with validation
    const handleInputChange = (e) => {
        const value = e.target.value;

        if (searchType === 'phone') {
            // Only allow numbers for phone
            const numbersOnly = value.replace(/[^0-9]/g, '');
            setSearchValue(numbersOnly);
        } else if (searchType === 'tracking') {
            // Allow alphanumeric and hyphen for Tracking Number (like SFX-20251221-001)
            const validChars = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
            setSearchValue(validChars);
        } else {
            // Email can have any characters
            setSearchValue(value);
        }
    };

    // Clear search value when changing search type
    const handleSearchTypeChange = (type) => {
        setSearchType(type);
        setSearchValue('');
        setError('');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setBooking(null);
        setLoading(true);

        try {
            // Try searching via new API first (Supabase database)
            let found = null;

            if (searchType === 'tracking') {
                // Use search_bookings RPC with tracking number
                const results = await api.bookings.list({ search: searchValue });
                found = results.find(b =>
                    b.tracking_number === searchValue ||
                    b.trackingNumber === searchValue ||
                    b.id === searchValue
                );
            } else if (searchType === 'email') {
                // Search by customer email
                const results = await api.bookings.list({ search: searchValue });
                found = results.find(b =>
                    b.customer_email?.toLowerCase() === searchValue.toLowerCase() ||
                    b.customer?.email?.toLowerCase() === searchValue.toLowerCase()
                );
            } else if (searchType === 'phone') {
                // Search by customer phone
                const results = await api.bookings.list({ search: searchValue });
                found = results.find(b =>
                    (b.customer_phone || b.customer?.phone || '').replace(/\D/g, '') === searchValue.replace(/\D/g, '')
                );
            }

            // Fallback to mockApi for legacy bookings if not found
            if (!found) {
                const legacyBookings = await mockApi.getBookings();
                if (searchType === 'tracking') {
                    found = legacyBookings.find(b =>
                        b.trackingNumber === searchValue ||
                        b.id === searchValue ||
                        `#${b.id}` === searchValue
                    );
                } else if (searchType === 'email') {
                    found = legacyBookings.find(b =>
                        b.customer?.email?.toLowerCase() === searchValue.toLowerCase()
                    );
                } else if (searchType === 'phone') {
                    found = legacyBookings.find(b =>
                        b.customer?.phone?.replace(/\D/g, '') === searchValue.replace(/\D/g, '')
                    );
                }
            }

            if (found) {
                // Normalize the booking object for display
                const normalizedBooking = {
                    ...found,
                    id: found.id || found.booking_id,
                    trackingNumber: found.tracking_number || found.trackingNumber,
                    status: found.status || 'Pending',
                    device: found.device || {
                        type: found.device_type,
                        brand: found.device_brand,
                        model: found.device_model
                    },
                    customer: found.customer || {
                        name: found.customer_name,
                        email: found.customer_email,
                        phone: found.customer_phone
                    },
                    date: found.scheduled_date || found.date,
                    time: found.scheduled_start || found.time
                };
                setBooking(normalizedBooking);

                // Fetch tracking history for this booking
                try {
                    const history = await mockApi.getRepairTracking(normalizedBooking.id);
                    setTrackingHistory(history || []);
                } catch (historyErr) {
                    console.log('Could not load tracking history:', historyErr);
                    setTrackingHistory([]);
                }
            } else {
                setError('No booking found. Please check your information and try again.');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <Clock className="status-icon pending" />;
            case 'confirmed':
                return <AlertCircle className="status-icon confirmed" />;
            case 'in progress':
                return <Package className="status-icon in-progress" />;
            case 'completed':
                return <CheckCircle className="status-icon completed" />;
            case 'cancelled':
                return <XCircle className="status-icon cancelled" />;
            default:
                return <Clock className="status-icon" />;
        }
    };

    const getStatusStep = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 1;
            case 'confirmed': return 2;
            case 'in progress': return 3;
            case 'completed': return 4;
            default: return 0;
        }
    };

    const statusSteps = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

    const searchOptions = [
        { id: 'tracking', label: 'Tracking #', icon: FileText },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'phone', label: 'Phone', icon: Phone },
    ];

    return (
        <div className="track-page">
            {/* Hero Section */}
            <section className="track-hero">
                <div className="container">
                    <motion.div
                        className="track-hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="hero-badge">Track Repair</span>
                        <h1>Check Your Repair Status</h1>
                        <p>Enter your tracking number, email, or phone number to track the progress of your repair.</p>
                    </motion.div>
                </div>
            </section>

            {/* Search Section */}
            <section className="track-search-section">
                <div className="container">
                    <motion.div
                        className="search-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="search-header">
                            <div className="search-icon-wrapper">
                                <Search size={28} />
                            </div>
                            <div>
                                <h2>Find Your Booking</h2>
                                <p>Select a search method and enter your details</p>
                            </div>
                        </div>

                        <form className="search-form" onSubmit={handleSearch}>
                            <div className="search-type-selector">
                                {searchOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        className={`type-btn ${searchType === option.id ? 'active' : ''}`}
                                        onClick={() => handleSearchTypeChange(option.id)}
                                    >
                                        <option.icon size={18} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="search-input-wrapper">
                                <input
                                    type={searchType === 'email' ? 'email' : 'text'}
                                    inputMode={searchType === 'phone' ? 'numeric' : 'text'}
                                    pattern={searchType === 'phone' ? '[0-9]*' : undefined}
                                    placeholder={
                                        searchType === 'tracking' ? 'Enter tracking # (e.g., SFX-20251221-001)' :
                                            searchType === 'email' ? 'Enter your email address' :
                                                'Enter your phone number (numbers only)'
                                    }
                                    value={searchValue}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Searching...' : 'Track'}
                                    {!loading && <ArrowRight size={18} />}
                                </Button>
                            </div>
                        </form>

                        {error && (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <XCircle size={20} />
                                {error}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Results Section */}
            {booking && (
                <section className="track-results-section">
                    <div className="container">
                        <motion.div
                            className="booking-result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="result-header">
                                {getStatusIcon(booking.status)}
                                <div>
                                    <h2>Repair #{booking.trackingNumber || booking.id}</h2>
                                    <span className={`status-badge ${booking.status?.toLowerCase().replace(' ', '-')}`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            {booking.status?.toLowerCase() !== 'cancelled' && (
                                <div className="progress-tracker">
                                    {statusSteps.map((step, index) => (
                                        <div key={step} className="progress-step">
                                            <div className={`step-circle ${index < getStatusStep(booking.status) ? 'completed' : ''} ${index === getStatusStep(booking.status) - 1 ? 'current' : ''}`}>
                                                {index < getStatusStep(booking.status) ? <CheckCircle size={20} /> : index + 1}
                                            </div>
                                            <span className="step-label">{step}</span>
                                            {index < statusSteps.length - 1 && (
                                                <div className={`step-line ${index < getStatusStep(booking.status) - 1 ? 'completed' : ''}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="booking-details-grid">
                                <motion.div
                                    className="detail-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="detail-icon blue">
                                        <Smartphone size={20} />
                                    </div>
                                    <h3>Device Information</h3>
                                    <p><strong>Tracking #:</strong> {booking.trackingNumber || 'N/A'}</p>
                                    <p><strong>Device:</strong> {getDeviceName(booking.device)}</p>
                                    <p><strong>Issue:</strong> {booking.issue || booking.notes || 'N/A'}</p>
                                </motion.div>

                                <motion.div
                                    className="detail-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="detail-icon purple">
                                        <Calendar size={20} />
                                    </div>
                                    <h3>Appointment</h3>
                                    <p><strong>Date:</strong> {getBookingDate(booking)}</p>
                                    <p><strong>Time:</strong> {booking.timeSlot?.name || booking.scheduledStart || booking.time || 'N/A'}</p>
                                </motion.div>

                                <motion.div
                                    className="detail-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="detail-icon green">
                                        <User size={20} />
                                    </div>
                                    <h3>Customer</h3>
                                    <p><strong>Name:</strong> {getCustomerName(booking.customer)}</p>
                                    <p><strong>Email:</strong> {booking.customer?.email || 'N/A'}</p>
                                </motion.div>
                            </div>

                            {booking.notes && (
                                <div className="notes-section">
                                    <h3><FileText size={20} /> Notes</h3>
                                    {Array.isArray(booking.notes) ? (
                                        <div className="notes-timeline">
                                            {booking.notes.map((note, index) => (
                                                <motion.div
                                                    key={note.id || index}
                                                    className="note-item"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="note-dot" />
                                                    <div className="note-content">
                                                        <span className="note-date">{note.date}</span>
                                                        <p>{note.text}</p>
                                                        <span className="note-author">— {note.author}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="notes-text">
                                            <p>{booking.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tracking History Timeline */}
                            {trackingHistory && trackingHistory.length > 0 && (
                                <div className="tracking-history-section">
                                    <h3><History size={20} /> Repair History</h3>
                                    <div className="tracking-timeline">
                                        {trackingHistory.map((log, index) => (
                                            <motion.div
                                                key={log.id || index}
                                                className={`tracking-item ${log.status?.toLowerCase().replace(' ', '-')}`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <div className={`tracking-dot ${log.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {getStatusIcon(log.status)}
                                                </div>
                                                <div className="tracking-content">
                                                    <div className="tracking-header">
                                                        <span className={`tracking-status ${log.status?.toLowerCase().replace(' ', '-')}`}>
                                                            {log.status}
                                                        </span>
                                                        <span className="tracking-date">
                                                            {new Date(log.created_at).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="tracking-message">{log.message}</p>
                                                    {log.staff_member && (
                                                        <span className="tracking-staff">by {log.staff_member}</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Help Section */}
            <section className="track-help-section">
                <div className="container">
                    <motion.div
                        className="help-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="help-icon">
                            <Phone size={24} />
                        </div>
                        <div className="help-content">
                            <h3>Need Help?</h3>
                            <p>Can't find your booking or have questions? Contact our support team.</p>
                        </div>
                        <a href="/contact" className="help-link">
                            Contact Support <ArrowRight size={16} />
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default TrackBooking;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, UserPlus, Lock, Calendar, Smartphone, User, ArrowRight, ArrowLeft, Shield, Zap, Award, DollarSign, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for user/account operations
import { useAuth } from '../../../context/AuthContext';
import { validatePhone, validateName, validateText, validateUsername, validateEmail } from '../../../utils/validation';
import './Booking.css';

const Booking = () => {
    const [step, setStep] = useState(1);
    const [bookingId, setBookingId] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [existingBookings, setExistingBookings] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [services, setServices] = useState([]);
    const [createAccount, setCreateAccount] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);
    const [formData, setFormData] = useState({
        // Device info - structured for database
        deviceType: 'phone',
        deviceBrand: '',
        deviceModel: '',
        // Service - by ID for database linking
        serviceId: '',
        serviceType: '', // kept for display
        issue: '',
        priorityLevel: 'regular', // regular | priority | express
        date: '',
        time: '',
        timeSlotId: '', // for database linking
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // Priority levels configuration
    const priorityLevels = [
        {
            id: 'regular',
            name: 'Regular',
            badge: 'Standard',
            fee: 0,
            description: 'Next available slot',
            turnaround: 'Standard turnaround',
            icon: Clock
        },
        {
            id: 'priority',
            name: 'Priority',
            badge: 'Premium',
            fee: 20,
            description: 'Moved ahead in the queue',
            turnaround: 'Faster service',
            icon: Zap,
            popular: true
        },
        {
            id: 'express',
            name: 'Express',
            badge: 'Pro',
            fee: 40,
            description: 'Same-day / fastest available',
            turnaround: 'Priority handling',
            icon: Star
        }
    ];

    const { user, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    // Fetch existing bookings and time slots
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookings, slots, servicesData] = await Promise.all([
                    api.bookings.list(),
                    api.timeSlots.list(),
                    api.services.list()
                ]);
                setExistingBookings(bookings || []);
                setTimeSlots((slots || []).filter(s => s.active));
                setServices((servicesData || []).filter(s => s.active));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    // Get availability for a specific date and time slot
    const getSlotAvailability = (date, slot) => {
        if (!date) return { available: true, count: 0, max: slot.maxBookings };

        const bookingsForSlot = existingBookings.filter(
            b => b.date === date && b.time === slot.name && b.status !== 'Cancelled'
        );

        return {
            available: bookingsForSlot.length < slot.maxBookings,
            count: bookingsForSlot.length,
            max: slot.maxBookings
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        // Apply validation based on field type
        switch (name) {
            case 'name':
                sanitizedValue = validateName(value);
                break;
            case 'phone':
                sanitizedValue = validatePhone(value);
                break;
            case 'email':
                sanitizedValue = validateEmail(value);
                break;
            case 'username':
                sanitizedValue = validateUsername(value);
                break;
            case 'device':
            case 'issue':
                sanitizedValue = validateText(value);
                break;
            default:
                sanitizedValue = value;
        }

        setFormData({ ...formData, [name]: sanitizedValue });
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🔵 BOOKING SUBMIT STARTED');
        console.log('Form Data:', formData);

        // Validate account creation fields if enabled
        if (createAccount) {
            if (!formData.username) {
                alert('Please enter a username');
                return;
            }
            if (formData.password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                alert('Passwords do not match');
                return;
            }
        }

        try {
            // Create account first if requested
            if (createAccount && !user) {
                const users = await mockApi.getUsers();
                if (users.find(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
                    alert('Username already exists. Please choose another.');
                    return;
                }

                // Create user account
                await mockApi.addUser({
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: 'customer'
                });

                // Create customer record
                await mockApi.addCustomer({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    totalBookings: 1,
                    lastVisit: new Date().toISOString().split('T')[0],
                    notes: 'Created during booking',
                    tags: []
                });

                setAccountCreated(true);

                // Auto-login the new user
                await login(formData.username, formData.password);
            }

            const selectedService = services.find(s => s.id === formData.serviceId || s.name === formData.serviceType);
            const basePrice = selectedService ? (selectedService.priceMin + selectedService.priceMax) / 2 : 0;
            const priorityFee = priorityLevels.find(p => p.id === formData.priorityLevel)?.fee || 0;

            const bookingData = {
                // Structured device info for creating device record
                device: {
                    type: formData.deviceType,
                    brand: formData.deviceBrand,
                    model: formData.deviceModel
                },
                // Service with ID for database linking
                serviceId: formData.serviceId || selectedService?.id || null,
                issue: formData.issue,
                priorityLevel: formData.priorityLevel,
                date: formData.date,
                timeSlotId: formData.timeSlotId || null,
                customer: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                }
            };
            console.log('🟢 Calling api.bookings.create with:', bookingData);
            const result = await api.bookings.create(bookingData);
            console.log('✅ Booking created successfully:', result);
            setBookingId(result.booking_id);
            setTrackingNumber(result.tracking_number);
            setStep(4); // Success step
        } catch (error) {
            console.error('❌ Booking failed:', error);
            console.error('Error details:', error.message, error.stack);
            alert('Failed to submit booking. Please try again.');
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const canConfirmBooking = () => {
        const basicValid = formData.name.trim() && formData.email.trim() && formData.phone.trim();
        if (!createAccount) return basicValid;
        return basicValid && formData.username && formData.password.length >= 6 && formData.password === formData.confirmPassword;
    };

    const features = [
        { icon: Zap, title: 'Quick Service', description: 'Same-day repairs', color: 'blue' },
        { icon: Shield, title: '30-Day Warranty', description: 'On all repairs', color: 'green' },
        { icon: Award, title: 'Expert Techs', description: 'Certified specialists', color: 'purple' },
    ];

    return (
        <div className="booking-page">
            {/* Hero Section */}
            <section className="booking-hero">
                <div className="container">
                    <motion.div
                        className="booking-hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="hero-badge">Book a Repair</span>
                        <h1>Schedule Your Device Repair</h1>
                        <p>Book an appointment in minutes. Our expert technicians will get your device working like new.</p>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="booking-features-section">
                <div className="container">
                    <div className="features-row">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="feature-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className={`feature-icon-small ${feature.color}`}>
                                    <feature.icon size={20} />
                                </div>
                                <div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="booking-form-section">
                <div className="container">
                    <motion.div
                        className="booking-form-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Step Indicator */}
                        {step < 4 && (
                            <div className="step-indicator">
                                <div className="step-progress-bar">
                                    <div className="step-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                                </div>
                                <div className="step-items">
                                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                        <span className="step-number">1</span>
                                        <span className="step-label">Device</span>
                                    </div>
                                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                        <span className="step-number">2</span>
                                        <span className="step-label">Schedule</span>
                                    </div>
                                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                                        <span className="step-number">3</span>
                                        <span className="step-label">Contact</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <motion.div
                                className="form-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-step-header">
                                    <Smartphone size={24} />
                                    <div>
                                        <h2>Device Information</h2>
                                        <p>Tell us about your device and the issue</p>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Device Type *</label>
                                        <select name="deviceType" value={formData.deviceType} onChange={handleChange}>
                                            <option value="phone">Phone</option>
                                            <option value="tablet">Tablet</option>
                                            <option value="laptop">Laptop</option>
                                            <option value="desktop">Desktop</option>
                                            <option value="watch">Smart Watch</option>
                                            <option value="console">Game Console</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Brand *</label>
                                        <input type="text" name="deviceBrand" placeholder="e.g. Apple, Samsung, Dell" value={formData.deviceBrand} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Model *</label>
                                    <input type="text" name="deviceModel" placeholder="e.g. iPhone 14 Pro, Galaxy S23, MacBook Air" value={formData.deviceModel} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Service Type *</label>
                                    <select name="serviceType" value={formData.serviceType} onChange={(e) => {
                                        const selectedService = services.find(s => s.name === e.target.value);
                                        setFormData({
                                            ...formData,
                                            serviceType: e.target.value,
                                            serviceId: selectedService?.id || ''
                                        });
                                    }}>
                                        <option value="">Select a service...</option>
                                        {services.map(service => (
                                            <option key={service.id} value={service.name}>
                                                {service.name} (${service.priceMin} - ${service.priceMax})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Issue Description *</label>
                                    <textarea name="issue" placeholder="Describe the problem..." rows="4" value={formData.issue} onChange={handleChange}></textarea>
                                </div>

                                {/* Priority Service Selection */}
                                {formData.serviceType && (
                                    <div className="priority-section">
                                        <div className="priority-header">
                                            <Zap size={20} />
                                            <div>
                                                <h3>Priority Service</h3>
                                                <p>Choose how fast you want your repair handled. Priority options add a service fee and move your repair ahead in the queue.</p>
                                            </div>
                                        </div>
                                        <div className="priority-options">
                                            {priorityLevels.map(level => {
                                                const Icon = level.icon;
                                                return (
                                                    <div
                                                        key={level.id}
                                                        className={`priority-card ${formData.priorityLevel === level.id ? 'selected' : ''} ${level.popular ? 'popular' : ''}`}
                                                        onClick={() => setFormData({ ...formData, priorityLevel: level.id })}
                                                    >
                                                        {level.popular && <span className="popular-badge">Most Popular</span>}
                                                        <div className="priority-card-header">
                                                            <div className="priority-icon">
                                                                <Icon size={20} />
                                                            </div>
                                                            <div className="priority-info">
                                                                <span className="priority-name">{level.name}</span>
                                                                <span className="priority-badge">{level.badge}</span>
                                                            </div>
                                                            <div className="priority-fee">
                                                                {level.fee === 0 ? (
                                                                    <span className="fee-free">$0 extra</span>
                                                                ) : (
                                                                    <span className="fee-amount">+${level.fee}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="priority-description">{level.description}</p>
                                                        <div className="priority-radio">
                                                            <input
                                                                type="radio"
                                                                name="priorityLevel"
                                                                value={level.id}
                                                                checked={formData.priorityLevel === level.id}
                                                                onChange={() => setFormData({ ...formData, priorityLevel: level.id })}
                                                            />
                                                            <span className="radio-custom"></span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Price Summary */}
                                        <div className="price-summary">
                                            <h4><DollarSign size={18} /> Price Summary</h4>
                                            <div className="summary-row">
                                                <span>Repair Estimate:</span>
                                                <span>
                                                    {(() => {
                                                        const service = services.find(s => s.name === formData.serviceType);
                                                        return service ? `$${service.priceMin} - $${service.priceMax}` : '--';
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="summary-row">
                                                <span>Priority add-on:</span>
                                                <span className={priorityLevels.find(p => p.id === formData.priorityLevel)?.fee > 0 ? 'highlight' : ''}>
                                                    +${priorityLevels.find(p => p.id === formData.priorityLevel)?.fee || 0}
                                                </span>
                                            </div>
                                            <div className="summary-row total">
                                                <span>Estimated Total:</span>
                                                <span>
                                                    {(() => {
                                                        const service = services.find(s => s.name === formData.serviceType);
                                                        const fee = priorityLevels.find(p => p.id === formData.priorityLevel)?.fee || 0;
                                                        if (!service) return '--';
                                                        return `$${service.priceMin + fee} - $${service.priceMax + fee}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="summary-disclaimer">
                                                Turnaround depends on device condition and parts availability.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="step-actions">
                                    <div></div>
                                    <Button variant="primary" onClick={nextStep} disabled={!formData.deviceBrand.trim() || !formData.deviceModel.trim() || !formData.serviceType || !formData.issue.trim()}>
                                        Next Step <ArrowRight size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                className="form-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-step-header">
                                    <Calendar size={24} />
                                    <div>
                                        <h2>Date & Time</h2>
                                        <p>Select your preferred appointment time</p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Preferred Date *</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        min={getMinDate()}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Available Time Slots</label>
                                    {formData.date ? (
                                        <div className="time-slots-grid">
                                            {timeSlots.length > 0 ? timeSlots.map(slot => {
                                                const availability = getSlotAvailability(formData.date, slot);
                                                return (
                                                    <div
                                                        key={slot.id}
                                                        className={`time-slot-card ${formData.time === slot.name ? 'selected' : ''} ${!availability.available ? 'unavailable' : ''}`}
                                                        onClick={() => availability.available && setFormData({ ...formData, time: slot.name, timeSlotId: slot.id })}
                                                    >
                                                        <div className="slot-header">
                                                            <Clock size={18} />
                                                            <span className="slot-name">{slot.name}</span>
                                                        </div>
                                                        <div className="slot-time">{slot.startTime} - {slot.endTime}</div>
                                                        <div className={`slot-availability ${availability.available ? 'available' : 'full'}`}>
                                                            {availability.available ? (
                                                                <>
                                                                    <CheckCircle size={14} />
                                                                    <span>{availability.max - availability.count} slots available</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle size={14} />
                                                                    <span>Fully booked</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <p className="select-date-hint">No time slots configured. Please contact the shop.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="select-date-hint">Please select a date first to see available time slots</p>
                                    )}
                                </div>

                                <div className="step-actions">
                                    <Button variant="secondary" onClick={prevStep}>
                                        <ArrowLeft size={18} /> Back
                                    </Button>
                                    <Button variant="primary" onClick={nextStep} disabled={!formData.date || !formData.time}>
                                        Next Step <ArrowRight size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                className="form-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-step-header">
                                    <User size={24} />
                                    <div>
                                        <h2>Contact Details</h2>
                                        <p>How can we reach you?</p>
                                    </div>
                                </div>

                                {user && (
                                    <div className="logged-in-notice">
                                        <CheckCircle size={18} />
                                        <span>Logged in as <strong>{user.name || user.username}</strong></span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone *</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
                                    </div>
                                </div>

                                {!user && (
                                    <div className="create-account-section">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={createAccount}
                                                onChange={(e) => setCreateAccount(e.target.checked)}
                                            />
                                            <UserPlus size={16} />
                                            <span>Create an account to track your repairs</span>
                                        </label>

                                        {createAccount && (
                                            <motion.div
                                                className="account-fields"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                            >
                                                <div className="form-group">
                                                    <label><Lock size={14} /> Username</label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        placeholder="Choose a username"
                                                    />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label><Lock size={14} /> Password</label>
                                                        <input
                                                            type="password"
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleChange}
                                                            placeholder="Min 6 characters"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label><Lock size={14} /> Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            name="confirmPassword"
                                                            value={formData.confirmPassword}
                                                            onChange={handleChange}
                                                            placeholder="Re-enter password"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                <div className="step-actions">
                                    <Button variant="secondary" onClick={prevStep}>
                                        <ArrowLeft size={18} /> Back
                                    </Button>
                                    <Button variant="primary" onClick={handleSubmit} disabled={!canConfirmBooking()}>
                                        Confirm Booking <CheckCircle size={18} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                className="booking-success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="success-icon-wrapper">
                                    <CheckCircle size={60} />
                                </div>
                                <h2>Booking Confirmed!</h2>
                                <div className="booking-id-box">
                                    <span>Your Tracking Number</span>
                                    <strong style={{ fontSize: '1.5rem', letterSpacing: '1px' }}>{trackingNumber}</strong>
                                </div>
                                {accountCreated && (
                                    <div className="account-created-notice">
                                        <UserPlus size={18} />
                                        <span>Your account has been created! You're now logged in.</span>
                                    </div>
                                )}
                                <p>Save this tracking number to follow your repair progress. We'll contact you shortly to confirm your appointment.</p>
                                <div className="success-actions">
                                    {(user || accountCreated) ? (
                                        <Button variant="primary" onClick={() => navigate('/customer/profile')}>
                                            Go to My Profile <ArrowRight size={18} />
                                        </Button>
                                    ) : (
                                        <Link to={`/track`}>
                                            <Button variant="primary">
                                                Track Repair <ArrowRight size={18} />
                                            </Button>
                                        </Link>
                                    )}
                                    <Link to="/">
                                        <Button variant="secondary">Back to Home</Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Booking;

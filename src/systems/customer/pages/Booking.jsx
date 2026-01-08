import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle, Clock, AlertCircle, UserPlus, Lock, Calendar,
    Smartphone, Tablet, Laptop, User, ArrowRight, ArrowLeft,
    Shield, Zap, Star, ChevronLeft, Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../../services/apiClient';
import { appointmentsApi, repairServicesApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/NotificationContext';
import { validatePhone, validateName, validateText, validateUsername, validateEmail } from '../../../utils/validation';
import './Booking.css';

// Device types configuration
const DEVICE_TYPES = [
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'computer', label: 'Computer', icon: Laptop },
];

// Priority levels
const PRIORITY_LEVELS = [
    { id: 'regular', name: 'Standard', fee: 0, icon: Clock },
    { id: 'priority', name: 'Priority', fee: 20, icon: Zap, popular: true },
    { id: 'express', name: 'Express', fee: 40, icon: Star },
];

const Booking = () => {
    const [step, setStep] = useState(1);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [availableServices, setAvailableServices] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [createAccount, setCreateAccount] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);
    const [formData, setFormData] = useState({
        deviceType: '',
        deviceBrand: '',
        deviceModel: '',
        serviceId: '',
        serviceName: '',
        issue: '',
        priorityLevel: 'regular',
        date: '',
        time: '',
        timeSlotId: '',
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const { user, signup } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Pre-fill if logged in
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

    // Load services when device type selected
    const handleDeviceTypeSelect = async (deviceType) => {
        setFormData(prev => ({ ...prev, deviceType, serviceId: '', serviceName: '' }));
        setLoadingServices(true);
        try {
            const services = await repairServicesApi.getByDeviceType(deviceType);
            setAvailableServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
            setAvailableServices([]);
        }
        setLoadingServices(false);
    };

    // Load slot availability when date selected
    const handleDateSelect = async (date) => {
        setFormData(prev => ({ ...prev, date, time: '', timeSlotId: '' }));
        setLoadingSlots(true);
        try {
            const slots = await appointmentsApi.getSlotAvailability(date);
            setTimeSlots(slots);
        } catch (error) {
            console.error('Failed to load slots:', error);
            setTimeSlots([]);
        }
        setLoadingSlots(false);
    };

    const handleServiceSelect = (service) => {
        setFormData(prev => ({ ...prev, serviceId: service.id, serviceName: service.name }));
    };

    const handleTimeSlotSelect = (slot) => {
        if (slot.isAvailable) {
            setFormData(prev => ({ ...prev, time: slot.name, timeSlotId: slot.id }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;
        switch (name) {
            case 'name': sanitizedValue = validateName(value); break;
            case 'phone': sanitizedValue = validatePhone(value); break;
            case 'email': sanitizedValue = validateEmail(value); break;
            case 'username': sanitizedValue = validateUsername(value); break;
            default: sanitizedValue = validateText(value);
        }
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const getMinDate = () => new Date().toISOString().split('T')[0];

    const canProceedStep1 = () => formData.deviceType && formData.deviceBrand.trim() && formData.deviceModel.trim() && formData.serviceId && formData.issue.trim();
    const canProceedStep2 = () => formData.date && formData.timeSlotId;
    const canConfirmBooking = () => {
        const basicValid = formData.name.trim() && formData.email.trim() && formData.phone.trim();
        if (!createAccount) return basicValid;
        return basicValid && formData.username && formData.password.length >= 6 && formData.password === formData.confirmPassword;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create account using Supabase Auth if requested
            if (createAccount && !user) {
                const signupResult = await signup(formData.email, formData.password, {
                    full_name: formData.name,
                    username: formData.username,
                    phone: formData.phone
                });

                if (!signupResult.success) {
                    toast.error(signupResult.error || 'Failed to create account. Please try again.');
                    return;
                }
                setAccountCreated(true);
            }

            const bookingData = {
                device: { type: formData.deviceType, brand: formData.deviceBrand, model: formData.deviceModel },
                serviceId: formData.serviceId,
                issue: formData.issue,
                priorityLevel: formData.priorityLevel,
                date: formData.date,
                timeSlotId: formData.timeSlotId,
                customer: { name: formData.name, email: formData.email, phone: formData.phone }
            };
            const result = await api.bookings.create(bookingData);
            setTrackingNumber(result.tracking_number);
            setStep(4);
        } catch (error) {
            console.error('Booking failed:', error);
            toast.error('Failed to submit booking. Please try again.');
        }
    };

    const selectedService = availableServices.find(s => s.id === formData.serviceId);
    const priorityFee = PRIORITY_LEVELS.find(p => p.id === formData.priorityLevel)?.fee || 0;

    return (
        <div className="booking-wizard">
            {/* Header */}
            <header className="booking-header">
                <div className="header-content">
                    <button className="back-btn" onClick={() => step > 1 ? prevStep() : navigate('/')}>
                        <ChevronLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="step-dots">
                        {[1, 2, 3].map(num => (
                            <div key={num} className={`step-dot ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                                {step > num ? <CheckCircle size={14} /> : num}
                            </div>
                        ))}
                    </div>
                    <div className="step-info">Step {Math.min(step, 3)} of 3</div>
                </div>
            </header>

            {/* Main Content */}
            <main className="booking-main">
                <div className="booking-container">
                    {/* STEP 1: Device & Service */}
                    {step === 1 && (
                        <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="step-header">
                                <Smartphone size={24} />
                                <div>
                                    <h2>Device & Service</h2>
                                    <p>Select your device and the repair service needed</p>
                                </div>
                            </div>

                            {/* Device Type */}
                            <div className="section-group">
                                <label className="section-label">Device Type</label>
                                <div className="device-grid">
                                    {DEVICE_TYPES.map(d => (
                                        <div key={d.id} className={`device-btn ${formData.deviceType === d.id ? 'selected' : ''}`} onClick={() => handleDeviceTypeSelect(d.id)}>
                                            <d.icon size={24} />
                                            <span>{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Services */}
                            {formData.deviceType && (
                                <div className="section-group">
                                    <label className="section-label">Service</label>
                                    {loadingServices ? (
                                        <div className="loading-box"><div className="spinner"></div></div>
                                    ) : availableServices.length > 0 ? (
                                        <div className="service-select-wrapper">
                                            <select
                                                className="service-select"
                                                value={formData.serviceId}
                                                onChange={(e) => {
                                                    const service = availableServices.find(s => s.id === e.target.value);
                                                    if (service) handleServiceSelect(service);
                                                }}
                                            >
                                                <option value="">Select a service...</option>
                                                {availableServices.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} — ${s.priceMin}-${s.priceMax}
                                                    </option>
                                                ))}
                                            </select>
                                            {formData.serviceId && selectedService && (
                                                <div className="selected-service-info">
                                                    <span className="service-desc">{selectedService.description}</span>
                                                    <span className="service-meta">~{selectedService.durationEstimate} min • {selectedService.warrantyDays} day warranty</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="hint-text">No services available. Run SQL migration first.</p>
                                    )}
                                </div>
                            )}

                            {/* Device Details */}
                            {formData.serviceId && (
                                <div className="section-group">
                                    <label className="section-label">Device Details</label>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Brand *</label>
                                            <input
                                                type="text"
                                                name="deviceBrand"
                                                placeholder="e.g., Apple, Samsung"
                                                value={formData.deviceBrand}
                                                onChange={handleChange}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Model *</label>
                                            <input
                                                type="text"
                                                name="deviceModel"
                                                placeholder="e.g., iPhone 14, Galaxy S23"
                                                value={formData.deviceModel}
                                                onChange={handleChange}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Describe the Issue *</label>
                                        <textarea
                                            name="issue"
                                            placeholder="What's wrong with your device?"
                                            rows="3"
                                            value={formData.issue}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>
                            )}


                        </motion.div>
                    )}

                    {/* STEP 2: Date & Time */}
                    {step === 2 && (
                        <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="step-header">
                                <Calendar size={24} />
                                <div>
                                    <h2>Schedule</h2>
                                    <p>Choose your preferred date and time</p>
                                </div>
                            </div>

                            <div className="section-group">
                                <label className="section-label">Date</label>
                                <input type="date" value={formData.date} onChange={(e) => handleDateSelect(e.target.value)} min={getMinDate()} className="date-input" />
                            </div>

                            {formData.date && (
                                <div className="section-group">
                                    <label className="section-label">Time Slot</label>
                                    {loadingSlots ? (
                                        <div className="loading-box"><div className="spinner"></div></div>
                                    ) : (
                                        <div className="slot-grid">
                                            {timeSlots.map(slot => (
                                                <div key={slot.id} className={`slot-btn ${formData.timeSlotId === slot.id ? 'selected' : ''} ${!slot.isAvailable ? 'disabled' : ''}`} onClick={() => handleTimeSlotSelect(slot)}>
                                                    <span className="slot-name">{slot.name}</span>
                                                    <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                                                    <span className={`slot-status ${slot.availabilityLevel}`}>
                                                        {slot.remainingSlots === 0 ? 'Full' : slot.remainingSlots === 1 ? '1 left' : `${slot.remainingSlots} available`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Priority */}
                            {formData.timeSlotId && (
                                <div className="section-group">
                                    <label className="section-label">Priority</label>
                                    <div className="priority-grid">
                                        {PRIORITY_LEVELS.map(p => (
                                            <div key={p.id} className={`priority-btn ${formData.priorityLevel === p.id ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, priorityLevel: p.id }))}>
                                                <p.icon size={18} />
                                                <span>{p.name}</span>
                                                <span className="priority-fee">{p.fee === 0 ? 'Free' : `+$${p.fee}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3: Contact */}
                    {step === 3 && (
                        <motion.div className="step-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="step-header">
                                <User size={24} />
                                <div>
                                    <h2>Contact</h2>
                                    <p>Your contact information</p>
                                </div>
                            </div>

                            {user && (
                                <div className="logged-notice"><CheckCircle size={16} /> Logged in as <strong>{user.name || user.username}</strong></div>
                            )}

                            <div className="section-group">
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone *</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
                                    </div>
                                </div>
                            </div>

                            {!user && (
                                <div className="account-toggle">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
                                        <UserPlus size={16} />
                                        <span>Create account to track repairs</span>
                                    </label>
                                    {createAccount && (
                                        <div className="account-fields">
                                            <div className="form-group">
                                                <label>Username</label>
                                                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose username" />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Password</label>
                                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 chars" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Confirm</label>
                                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Summary */}
                            <div className="booking-summary">
                                <div className="summary-row"><span>Device</span><span>{formData.deviceBrand} {formData.deviceModel}</span></div>
                                <div className="summary-row"><span>Service</span><span>{formData.serviceName}</span></div>
                                <div className="summary-row"><span>Date/Time</span><span>{formData.date} • {formData.time}</span></div>
                                <div className="summary-row total">
                                    <span>Estimated</span>
                                    <span>{selectedService ? `$${selectedService.priceMin + priorityFee} - $${selectedService.priceMax + priorityFee}` : '--'}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Success */}
                    {step === 4 && (
                        <motion.div className="step-content success-content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="success-icon"><CheckCircle size={48} /></div>
                            <h2>Booking Confirmed!</h2>
                            <div className="tracking-box">
                                <span>Tracking Number</span>
                                <strong>{trackingNumber}</strong>
                                <button onClick={() => navigator.clipboard.writeText(trackingNumber)}><Copy size={16} /></button>
                            </div>
                            {accountCreated && <div className="logged-notice"><UserPlus size={16} /> Account created!</div>}
                            <p>We'll contact you to confirm your appointment.</p>
                            <div className="success-actions">
                                <Link to={(user || accountCreated) ? '/customer/profile' : '/track'}><button className="btn-primary">{(user || accountCreated) ? 'My Profile' : 'Track Repair'} <ArrowRight size={16} /></button></Link>
                                <Link to="/"><button className="btn-secondary">Home</button></Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Footer Actions */}
            {step < 4 && (
                <footer className="booking-footer">
                    <div className="footer-content">
                        {step > 1 ? (
                            <button className="btn-secondary" onClick={prevStep}><ArrowLeft size={16} /> Back</button>
                        ) : <div></div>}
                        {step < 3 ? (
                            <button className="btn-primary" onClick={nextStep} disabled={step === 1 ? !canProceedStep1() : !canProceedStep2()}>
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button className="btn-primary confirm" onClick={handleSubmit} disabled={!canConfirmBooking()}>
                                Confirm <CheckCircle size={16} />
                            </button>
                        )}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default Booking;

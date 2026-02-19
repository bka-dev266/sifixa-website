import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/NotificationContext';
import { api } from '../../../../services/apiClient';

// Steps
import DeviceServiceStep from './steps/DeviceServiceStep';
import LocationScheduleStep from './steps/LocationScheduleStep';
import ContactConfirmStep from './steps/ContactConfirmStep';

import './BookingWizard.css';

const INITIAL_STATE = {
    // Step 1: Device & Service
    deviceType: '',
    deviceBrand: '',
    deviceModel: '',
    serviceId: '',
    serviceName: '',
    servicePrice: 0,
    servicePriceMax: 0,
    issueDescription: '',

    // Step 2: Location & Schedule
    serviceDeliveryType: 'in_store',
    address: {
        street: '',
        aptSuite: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: null,
        longitude: null
    },
    saveAddress: false,
    savedAddressId: null,
    selectedDate: '',
    selectedTimeSlotId: '',
    selectedTimeSlot: null,
    priorityLevel: 'standard',

    // Step 3: Contact
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    createAccount: false,
    password: '',
    confirmPassword: ''
};

const BookingWizard = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);

    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Pre-fill contact info if logged in
    useEffect(() => {
        if (user && profile) {
            setFormData(prev => ({
                ...prev,
                customerName: profile.full_name || profile.username || '',
                customerEmail: user.email || profile.email || '',
                customerPhone: profile.phone || ''
            }));
        }
    }, [user, profile]);

    const updateFormData = (updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const bookingData = {
                device: {
                    type: formData.deviceType,
                    brand: formData.deviceBrand,
                    model: formData.deviceModel
                },
                serviceId: formData.serviceId,
                issue: formData.issueDescription || formData.serviceName,
                priorityLevel: formData.priorityLevel,
                date: formData.selectedDate,
                timeSlotId: formData.selectedTimeSlotId,
                serviceDeliveryType: formData.serviceDeliveryType,
                serviceAddress: formData.serviceDeliveryType !== 'in_store' ? {
                    street: formData.address.street,
                    aptSuite: formData.address.aptSuite,
                    city: formData.address.city,
                    state: formData.address.state,
                    zipCode: formData.address.zipCode
                } : null,
                savedAddressId: formData.savedAddressId,
                saveAddress: formData.saveAddress,
                customer: {
                    name: formData.customerName,
                    email: formData.customerEmail,
                    phone: formData.customerPhone
                },
                createAccount: formData.createAccount,
                password: formData.createAccount ? formData.password : null
            };

            const result = await api.bookings.create(bookingData);
            setBookingResult(result);
            setStep(4);
            toast.success('Booking confirmed!');
        } catch (error) {
            console.error('Booking failed:', error);
            toast.error(error.message || 'Failed to create booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyTrackingNumber = () => {
        if (bookingResult?.tracking_number) {
            navigator.clipboard.writeText(bookingResult.tracking_number);
            toast.success('Tracking number copied!');
        }
    };

    // Success view
    if (step === 4 && bookingResult) {
        return (
            <div className="booking-wizard">
                <div className="booking-success">
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h1>Booking Confirmed!</h1>
                    <div className="tracking-box">
                        <span>Tracking #:</span>
                        <strong>{bookingResult.tracking_number || bookingResult.id?.slice(0, 8).toUpperCase()}</strong>
                        <button className="copy-btn" onClick={copyTrackingNumber}>
                            <Copy size={16} />
                        </button>
                    </div>
                    <p>We've sent confirmation details to {formData.customerEmail}</p>

                    <div className="success-actions">
                        <button onClick={() => navigate('/customer/profile')} className="btn-primary">
                            View My Bookings
                        </button>
                        <button onClick={() => navigate('/')} className="btn-secondary">
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-wizard">
            {/* Header */}
            <header className="wizard-header">
                <button className="back-btn" onClick={() => step > 1 ? prevStep() : navigate('/')}>
                    <ArrowLeft size={20} />
                    <span>{step > 1 ? 'Back' : 'Exit'}</span>
                </button>

                <div className="progress-bar">
                    {[1, 2, 3].map(num => (
                        <div key={num} className={`progress-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                            {step > num ? <CheckCircle size={16} /> : num}
                        </div>
                    ))}
                </div>

                <div className="step-label">Step {step} of 3</div>
            </header>

            {/* Step Content */}
            <main className="wizard-content">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DeviceServiceStep
                                formData={formData}
                                updateFormData={updateFormData}
                                onNext={nextStep}
                            />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <LocationScheduleStep
                                formData={formData}
                                updateFormData={updateFormData}
                                onNext={nextStep}
                                onBack={prevStep}
                            />
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ContactConfirmStep
                                formData={formData}
                                updateFormData={updateFormData}
                                onSubmit={handleSubmit}
                                onBack={prevStep}
                                isSubmitting={isSubmitting}
                                isLoggedIn={!!user}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default BookingWizard;

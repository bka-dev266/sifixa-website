import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Smartphone, Laptop, Tablet, Watch, DollarSign, CheckCircle,
    ArrowRight, ArrowLeft, Package, Shield, Send, Copy, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import './SellDevice.css';

const DEVICE_TYPES = [
    { id: 'phone', name: 'Smartphone', icon: Smartphone },
    { id: 'laptop', name: 'Computer', icon: Laptop },
    { id: 'tablet', name: 'Tablet', icon: Tablet },
    { id: 'watch', name: 'Smartwatch', icon: Watch },
];

const CONDITIONS = [
    { id: 'excellent', label: 'Excellent', description: 'Like new, no scratches or damage', multiplier: 1.0, color: 'green' },
    { id: 'good', label: 'Good', description: 'Minor scratches, fully functional', multiplier: 0.8, color: 'blue' },
    { id: 'fair', label: 'Fair', description: 'Visible wear, works properly', multiplier: 0.6, color: 'orange' },
    { id: 'poor', label: 'Poor', description: 'Significant damage, may have issues', multiplier: 0.4, color: 'red' },
];

const STEP_TITLES = ['Device Info', 'Condition', 'Contact'];

const SellDevice = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(null);

    const [formData, setFormData] = useState({
        deviceType: '',
        brand: '',
        model: '',
        condition: '',
        storage: '',
        batteryHealth: '',
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Pre-fill customer info if logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || user.full_name || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    const handleDeviceSelect = (deviceId) => {
        setFormData({ ...formData, deviceType: deviceId });
    };

    const handleConditionSelect = (conditionId) => {
        setFormData({ ...formData, condition: conditionId });
        const basePrice = formData.deviceType === 'laptop' ? 300 :
            formData.deviceType === 'phone' ? 200 :
                formData.deviceType === 'tablet' ? 150 : 100;
        const condition = CONDITIONS.find(c => c.id === conditionId);
        setEstimatedPrice(Math.round(basePrice * condition.multiplier));
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validate current step
    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.deviceType && formData.brand.length >= 2 && formData.model.length >= 2;
            case 2:
                return !!formData.condition;
            case 3:
                return formData.name.length >= 2 &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
                    formData.phone.length >= 10;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.sellDevice.submit({
                deviceType: formData.deviceType,
                brand: formData.brand,
                model: formData.model,
                condition: formData.condition,
                storage: formData.storage,
                batteryHealth: formData.batteryHealth,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                notes: formData.notes,
                estimatedPrice: estimatedPrice
            });
            setSubmitted(true);
            setCurrentStep(4);
        } catch (error) {
            console.error('Failed to submit device:', error);
            alert('Failed to submit your device. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="sell-page">
            {/* Header with progress */}
            <header className="sell-header">
                <div className="sell-header-content">
                    <button className="sell-back-button" onClick={() => navigate('/')}>
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>

                    {currentStep < 4 && (
                        <div className="sell-step-progress">
                            {STEP_TITLES.map((title, index) => (
                                <div
                                    key={title}
                                    className={`sell-step-dot ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
                                >
                                    {currentStep > index + 1 ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="sell-step-info">
                        {currentStep < 4 && (
                            <span className="sell-step-label">Step {currentStep} of 3</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main className="sell-content">
                <AnimatePresence mode="wait">
                    {/* Step 1: Device Info */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            className="sell-step-container"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="sell-step-header">
                                <Package size={28} className="sell-step-icon" />
                                <div>
                                    <h1>Device Information</h1>
                                    <p>Tell us about the device you want to sell</p>
                                </div>
                            </div>

                            {/* Device Type Selection */}
                            <div className="sell-device-types">
                                {DEVICE_TYPES.map(device => (
                                    <div
                                        key={device.id}
                                        className={`sell-device-type-card ${formData.deviceType === device.id ? 'selected' : ''}`}
                                        onClick={() => handleDeviceSelect(device.id)}
                                    >
                                        <device.icon size={28} />
                                        <span>{device.name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Device Info */}
                            <div className="sell-form-row">
                                <div className="sell-form-group">
                                    <label>Brand *</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Apple, Samsung, Dell"
                                    />
                                </div>
                                <div className="sell-form-group">
                                    <label>Model *</label>
                                    <input
                                        type="text"
                                        name="model"
                                        value={formData.model}
                                        onChange={handleInputChange}
                                        placeholder="e.g., iPhone 14 Pro, Galaxy S23"
                                    />
                                </div>
                            </div>

                            <div className="sell-form-row">
                                <div className="sell-form-group">
                                    <label>Storage Capacity (optional)</label>
                                    <select name="storage" value={formData.storage} onChange={handleInputChange}>
                                        <option value="">Select storage</option>
                                        <option value="32gb">32 GB</option>
                                        <option value="64gb">64 GB</option>
                                        <option value="128gb">128 GB</option>
                                        <option value="256gb">256 GB</option>
                                        <option value="512gb">512 GB</option>
                                        <option value="1tb">1 TB+</option>
                                    </select>
                                </div>
                                <div className="sell-form-group">
                                    <label>Battery Health % (optional)</label>
                                    <input
                                        type="number"
                                        name="batteryHealth"
                                        value={formData.batteryHealth}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 85"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Condition */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            className="sell-step-container"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="sell-step-header">
                                <Shield size={28} className="sell-step-icon" />
                                <div>
                                    <h1>Device Condition</h1>
                                    <p>How would you describe your device's condition?</p>
                                </div>
                            </div>

                            <div className="sell-condition-grid">
                                {CONDITIONS.map(condition => (
                                    <div
                                        key={condition.id}
                                        className={`sell-condition-card ${formData.condition === condition.id ? 'selected' : ''} ${condition.color}`}
                                        onClick={() => handleConditionSelect(condition.id)}
                                    >
                                        <div className="sell-condition-header">
                                            <h4>{condition.label}</h4>
                                            {formData.condition === condition.id && (
                                                <CheckCircle size={20} className="sell-condition-check" />
                                            )}
                                        </div>
                                        <p>{condition.description}</p>
                                    </div>
                                ))}
                            </div>

                            {estimatedPrice && (
                                <motion.div
                                    className="sell-price-estimate"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="sell-price-icon">
                                        <DollarSign size={28} />
                                    </div>
                                    <div>
                                        <span>Estimated Value</span>
                                        <strong>${estimatedPrice} - ${estimatedPrice + 50}</strong>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 3: Contact Info */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            className="sell-step-container"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="sell-step-header">
                                <Send size={28} className="sell-step-icon" />
                                <div>
                                    <h1>Contact & Confirm</h1>
                                    <p>Provide your details and review your submission</p>
                                </div>
                            </div>

                            {user && (
                                <div className="sell-logged-in-notice">
                                    <CheckCircle size={18} />
                                    <span>Logged in as <strong>{user.name || user.email}</strong></span>
                                </div>
                            )}

                            <div className="sell-form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="sell-form-row">
                                <div className="sell-form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div className="sell-form-group">
                                    <label>Phone *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="sell-form-group">
                                <label>Additional Notes (optional)</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any additional details about your device..."
                                    rows={3}
                                />
                            </div>

                            {/* Device Summary */}
                            <div className="sell-summary">
                                <h3>Device Summary</h3>
                                <div className="sell-summary-row">
                                    <span>Device:</span>
                                    <span>{DEVICE_TYPES.find(d => d.id === formData.deviceType)?.name} - {formData.brand} {formData.model}</span>
                                </div>
                                {formData.storage && (
                                    <div className="sell-summary-row">
                                        <span>Storage:</span>
                                        <span>{formData.storage.toUpperCase()}</span>
                                    </div>
                                )}
                                <div className="sell-summary-row">
                                    <span>Condition:</span>
                                    <span>{CONDITIONS.find(c => c.id === formData.condition)?.label}</span>
                                </div>
                                {estimatedPrice && (
                                    <div className="sell-summary-row total">
                                        <span>Estimated Value:</span>
                                        <span>${estimatedPrice} - ${estimatedPrice + 50}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {currentStep === 4 && submitted && (
                        <motion.div
                            key="step4"
                            className="sell-step-container sell-confirmation"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="sell-success-icon">
                                <CheckCircle size={64} />
                            </div>

                            <h1>Quote Request Submitted!</h1>
                            <p>Our team will review your submission and contact you within 24 hours with a final offer.</p>

                            {estimatedPrice && (
                                <div className="sell-estimate-box">
                                    <span className="sell-estimate-label">Estimated Value</span>
                                    <strong>${estimatedPrice} - ${estimatedPrice + 50}</strong>
                                </div>
                            )}

                            <div className="sell-next-steps">
                                <h3>What happens next?</h3>
                                <div className="sell-next-steps-list">
                                    <div className="sell-next-step-item">
                                        <CheckCircle size={18} />
                                        <span>We'll review your device details</span>
                                    </div>
                                    <div className="sell-next-step-item">
                                        <CheckCircle size={18} />
                                        <span>You'll receive a final offer via email</span>
                                    </div>
                                    <div className="sell-next-step-item">
                                        <CheckCircle size={18} />
                                        <span>Bring your device to our store for inspection</span>
                                    </div>
                                    <div className="sell-next-step-item">
                                        <CheckCircle size={18} />
                                        <span>Get paid instantly upon verification</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sell-confirmation-actions">
                                <button className="sell-btn-primary" onClick={() => navigate('/')}>
                                    Back to Home
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer with navigation buttons */}
            {currentStep < 4 && (
                <footer className="sell-footer">
                    <button
                        className="sell-btn-secondary"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    {currentStep < 3 ? (
                        <button
                            className="sell-btn-primary"
                            onClick={handleNext}
                            disabled={!validateStep(currentStep)}
                        >
                            Next
                            <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            className="sell-btn-primary sell-btn-confirm"
                            onClick={handleSubmit}
                            disabled={!validateStep(currentStep) || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Get My Quote'}
                            <Send size={18} />
                        </button>
                    )}
                </footer>
            )}
        </div>
    );
};

export default SellDevice;

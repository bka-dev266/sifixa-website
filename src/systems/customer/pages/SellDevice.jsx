import React, { useState, useEffect } from 'react';
import { Smartphone, Laptop, Tablet, Watch, DollarSign, CheckCircle2, Send, ArrowRight, ArrowLeft, Package, Clock, Shield, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import { api } from '../../../services/apiClient';
import './SellDevice.css';

const deviceTypes = [
    { id: 'phone', name: 'Smartphone', icon: Smartphone },
    { id: 'laptop', name: 'Computer', icon: Laptop },
    { id: 'tablet', name: 'Tablet', icon: Tablet },
    { id: 'watch', name: 'Smartwatch', icon: Watch },
];

const conditions = [
    { id: 'excellent', label: 'Excellent', description: 'Like new, no scratches or damage', multiplier: 1.0, color: 'green' },
    { id: 'good', label: 'Good', description: 'Minor scratches, fully functional', multiplier: 0.8, color: 'blue' },
    { id: 'fair', label: 'Fair', description: 'Visible wear, works properly', multiplier: 0.6, color: 'orange' },
    { id: 'poor', label: 'Poor', description: 'Significant damage, may have issues', multiplier: 0.4, color: 'red' },
];

const SellDevice = () => {
    const [step, setStep] = useState(1);
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
    const [submitted, setSubmitted] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleDeviceSelect = (deviceId) => {
        setFormData({ ...formData, deviceType: deviceId });
    };

    const handleConditionSelect = (conditionId) => {
        setFormData({ ...formData, condition: conditionId });
        // Calculate estimated price based on condition
        const basePrice = formData.deviceType === 'laptop' ? 300 :
            formData.deviceType === 'phone' ? 200 :
                formData.deviceType === 'tablet' ? 150 : 100;
        const condition = conditions.find(c => c.id === conditionId);
        setEstimatedPrice(Math.round(basePrice * condition.multiplier));
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        } catch (error) {
            console.error('Failed to submit device:', error);
            alert('Failed to submit your device. Please try again.');
        }
    };

    const canProceedStep1 = formData.deviceType && formData.brand && formData.model;
    const canProceedStep2 = formData.condition;
    const canProceedStep3 = formData.name && formData.email && formData.phone;

    // COMMENTED OUT: Feature cards temporarily hidden
    // const features = [
    //     { icon: DollarSign, title: 'Best Prices', description: 'Competitive offers', color: 'green' },
    //     { icon: Clock, title: 'Quick Process', description: 'Same-day quotes', color: 'blue' },
    //     { icon: Shield, title: 'Safe & Secure', description: 'Data wiped safely', color: 'purple' },
    //     { icon: Award, title: 'Instant Payment', description: 'Get paid right away', color: 'orange' },
    // ];

    if (submitted) {
        return (
            <div className="sell-page">
                <section className="sell-hero">
                    <div className="container">
                        <motion.div
                            className="sell-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="success-icon-wrapper">
                                <CheckCircle2 size={60} />
                            </div>
                            <h2>Quote Request Submitted!</h2>
                            <p>Thank you for your interest in selling your device. Our team will review your submission and contact you within 24 hours with a final offer.</p>

                            <div className="estimate-box">
                                <span>Estimated Value</span>
                                <strong>${estimatedPrice} - ${estimatedPrice + 50}</strong>
                            </div>

                            <div className="next-steps-card">
                                <h3>What happens next?</h3>
                                <ul>
                                    <li><CheckCircle2 size={18} /> We'll review your device details</li>
                                    <li><CheckCircle2 size={18} /> You'll receive a final offer via email</li>
                                    <li><CheckCircle2 size={18} /> Bring your device to our store for inspection</li>
                                    <li><CheckCircle2 size={18} /> Get paid instantly upon verification</li>
                                </ul>
                            </div>

                            <div className="success-actions">
                                <Button variant="primary" onClick={() => window.location.href = '/'}>
                                    Back to Home
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="sell-page">
            {/* Hero Section */}
            <section className="sell-hero">
                <div className="container">
                    <motion.div
                        className="sell-hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="hero-badge">Sell Your Device</span>
                        <h1>Get Cash for Your Old Devices</h1>
                        <p>Sell your old phones, laptops, tablets, and more. Quick quotes, fair prices, instant payment!</p>
                    </motion.div>
                </div>
            </section>

            {/* Features Section - COMMENTED OUT
            <section className="sell-features-section">
                <div className="container">
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="feature-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className={`feature-icon ${feature.color}`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            */}

            {/* Form Section */}
            <section className="sell-form-section">
                <div className="container">
                    <motion.div
                        className="sell-form-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Step Indicator */}
                        <div className="step-indicator">
                            <div className="step-progress-bar">
                                <div className="step-progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                            </div>
                            <div className="step-items">
                                <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                    <span className="step-number">1</span>
                                    <span className="step-label">Device Info</span>
                                </div>
                                <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                    <span className="step-number">2</span>
                                    <span className="step-label">Condition</span>
                                </div>
                                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                                    <span className="step-number">3</span>
                                    <span className="step-label">Contact</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Device Info */}
                            {step === 1 && (
                                <motion.div
                                    className="form-step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-step-header">
                                        <Package size={24} />
                                        <div>
                                            <h2>Device Information</h2>
                                            <p>Tell us about your device</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Select Device Type</label>
                                        <div className="device-type-grid">
                                            {deviceTypes.map(device => (
                                                <div
                                                    key={device.id}
                                                    className={`device-type-card ${formData.deviceType === device.id ? 'selected' : ''}`}
                                                    onClick={() => handleDeviceSelect(device.id)}
                                                >
                                                    <device.icon size={32} />
                                                    <span>{device.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Brand *</label>
                                            <input
                                                type="text"
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Apple, Samsung, Dell"
                                            />
                                        </div>
                                        <div className="form-group">
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

                                    <div className="form-row">
                                        <div className="form-group">
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
                                        <div className="form-group">
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

                                    <div className="step-actions">
                                        <div></div>
                                        <Button
                                            variant="primary"
                                            type="button"
                                            onClick={() => setStep(2)}
                                            disabled={!canProceedStep1}
                                        >
                                            Next Step <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Condition */}
                            {step === 2 && (
                                <motion.div
                                    className="form-step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-step-header">
                                        <Shield size={24} />
                                        <div>
                                            <h2>Device Condition</h2>
                                            <p>How would you describe your device's condition?</p>
                                        </div>
                                    </div>

                                    <div className="condition-grid">
                                        {conditions.map(condition => (
                                            <div
                                                key={condition.id}
                                                className={`condition-card ${formData.condition === condition.id ? 'selected' : ''} ${condition.color}`}
                                                onClick={() => handleConditionSelect(condition.id)}
                                            >
                                                <h4>{condition.label}</h4>
                                                <p>{condition.description}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {estimatedPrice && (
                                        <motion.div
                                            className="price-estimate"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="price-icon">
                                                <DollarSign size={28} />
                                            </div>
                                            <div>
                                                <span>Estimated Value</span>
                                                <strong>${estimatedPrice} - ${estimatedPrice + 50}</strong>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="step-actions">
                                        <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                                            <ArrowLeft size={18} /> Back
                                        </Button>
                                        <Button
                                            variant="primary"
                                            type="button"
                                            onClick={() => setStep(3)}
                                            disabled={!canProceedStep2}
                                        >
                                            Next Step <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Contact Info */}
                            {step === 3 && (
                                <motion.div
                                    className="form-step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="form-step-header">
                                        <Send size={24} />
                                        <div>
                                            <h2>Contact Information</h2>
                                            <p>How can we reach you?</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Your name"
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="(555) 123-4567"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Additional Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Any additional details about your device..."
                                            rows={4}
                                        />
                                    </div>

                                    <div className="step-actions">
                                        <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                                            <ArrowLeft size={18} /> Back
                                        </Button>
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={!canProceedStep3}
                                        >
                                            <Send size={18} /> Get My Quote
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default SellDevice;

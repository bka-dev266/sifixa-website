import React from 'react';
import { User, Mail, Phone, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';

const ContactConfirmStep = ({ formData, updateFormData, onSubmit, onBack, isSubmitting, isLoggedIn }) => {
    const { user, profile } = useAuth();

    // Calculate totals
    const getServiceFee = () => {
        const fees = { in_store: 0, mobile: 25, pickup_delivery: 15 };
        return fees[formData.serviceDeliveryType] || 0;
    };

    const getPriorityFee = () => {
        const fees = { standard: 0, express: 20, rush: 40 };
        return fees[formData.priorityLevel] || 0;
    };

    const getEstimatedTotal = () => {
        return (formData.servicePrice || 0) + getServiceFee() + getPriorityFee();
    };

    const canSubmit = () => {
        const hasContact = formData.customerName?.trim() &&
            formData.customerEmail?.trim() &&
            formData.customerPhone?.trim();

        if (!formData.createAccount) return hasContact;

        return hasContact &&
            formData.password?.length >= 6 &&
            formData.password === formData.confirmPassword;
    };

    return (
        <div className="step-content">
            <div className="step-header">
                <User className="step-icon" />
                <div>
                    <h2>Contact & Confirm</h2>
                    <p>Review your booking and provide contact details</p>
                </div>
            </div>

            {/* Logged In Notice */}
            {isLoggedIn && (
                <div className="logged-in-notice">
                    <CheckCircle size={20} />
                    <span>Logged in as <strong>{profile?.full_name || user?.email}</strong></span>
                </div>
            )}

            {/* Contact Information */}
            <div className="section">
                <label className="section-label">Contact Information</label>
                <div className="form-group">
                    <label><User size={16} /> Full Name *</label>
                    <input
                        type="text"
                        placeholder="Your full name"
                        value={formData.customerName}
                        onChange={(e) => updateFormData({ customerName: e.target.value })}
                        disabled={isLoggedIn}
                    />
                </div>
                <div className="form-row two-col">
                    <div className="form-group">
                        <label><Mail size={16} /> Email *</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={formData.customerEmail}
                            onChange={(e) => updateFormData({ customerEmail: e.target.value })}
                            disabled={isLoggedIn}
                        />
                    </div>
                    <div className="form-group">
                        <label><Phone size={16} /> Phone *</label>
                        <input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.customerPhone}
                            onChange={(e) => updateFormData({ customerPhone: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Create Account Option (for guests) */}
            {!isLoggedIn && (
                <div className="section account-section">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.createAccount}
                            onChange={(e) => updateFormData({ createAccount: e.target.checked })}
                        />
                        <span>Create an account to track your repairs</span>
                    </label>

                    {formData.createAccount && (
                        <div className="account-fields">
                            <div className="form-row two-col">
                                <div className="form-group">
                                    <label><Lock size={16} /> Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={(e) => updateFormData({ password: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Lock size={16} /> Confirm Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="error-text">Passwords do not match</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Booking Summary */}
            <div className="section">
                <label className="section-label">Booking Summary</label>
                <div className="booking-summary">
                    <div className="summary-row">
                        <span>Device</span>
                        <span>{formData.deviceBrand && formData.deviceModel ? `${formData.deviceBrand} ${formData.deviceModel}` : 'Not specified'}</span>
                    </div>
                    <div className="summary-row">
                        <span>Service</span>
                        <span>{formData.serviceName || 'Not selected'}</span>
                    </div>
                    <div className="summary-row">
                        <span>Date & Time</span>
                        <span>
                            {formData.selectedDate
                                ? `${new Date(formData.selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • ${formData.selectedTimeSlot?.name || 'Time TBD'}`
                                : 'Not scheduled'
                            }
                        </span>
                    </div>
                    <div className="summary-row">
                        <span>Service Type</span>
                        <span>
                            {formData.serviceDeliveryType === 'in_store' && 'Visit Our Shop'}
                            {formData.serviceDeliveryType === 'mobile' && 'We Come To You (+$25)'}
                            {formData.serviceDeliveryType === 'pickup_delivery' && 'Pickup & Delivery (+$15)'}
                        </span>
                    </div>

                    {formData.address?.street && (
                        <div className="summary-row">
                            <span>Address</span>
                            <span>{formData.address.street}, {formData.address.city}, {formData.address.state}</span>
                        </div>
                    )}

                    <div className="summary-divider"></div>

                    <div className="summary-row">
                        <span>Service Estimate</span>
                        <span>From ${formData.servicePrice || 0}</span>
                    </div>
                    {getServiceFee() > 0 && (
                        <div className="summary-row">
                            <span>Delivery Fee</span>
                            <span>+${getServiceFee()}</span>
                        </div>
                    )}
                    {getPriorityFee() > 0 && (
                        <div className="summary-row">
                            <span>Priority Fee</span>
                            <span>+${getPriorityFee()}</span>
                        </div>
                    )}
                    <div className="summary-row total">
                        <span>Estimated Total</span>
                        <span>From ${getEstimatedTotal()}</span>
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
                <div className="badge">
                    <ShieldCheck size={18} />
                    <span>Lifetime Warranty</span>
                </div>
                <div className="badge">
                    <CheckCircle size={18} />
                    <span>Certified Technicians</span>
                </div>
            </div>

            {/* Actions */}
            <div className="step-actions">
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button
                    type="button"
                    className="btn-primary confirm"
                    onClick={onSubmit}
                    disabled={!canSubmit() || isSubmitting}
                >
                    {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                </button>
            </div>
        </div>
    );
};

export default ContactConfirmStep;

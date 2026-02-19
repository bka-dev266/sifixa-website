import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Laptop, Wrench, ChevronDown } from 'lucide-react';
import { repairServicesApi } from '../../../../../services/api';

const DEVICE_TYPES = [
    { id: 'phone', label: 'Phone', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'computer', label: 'Computer', icon: Laptop },
];

const DeviceServiceStep = ({ formData, updateFormData, onNext }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load services when device type changes
    useEffect(() => {
        if (formData.deviceType) {
            loadServices(formData.deviceType);
        }
    }, [formData.deviceType]);

    const loadServices = async (deviceType) => {
        setLoading(true);
        try {
            const data = await repairServicesApi.getByDeviceType(deviceType);
            setServices(data || []);
        } catch (error) {
            console.error('Failed to load services:', error);
            // Fallback services
            setServices([
                { id: '1', name: 'Screen Repair', priceMin: 49, priceMax: 299 },
                { id: '2', name: 'Battery Replacement', priceMin: 29, priceMax: 89 },
                { id: '3', name: 'Charging Port Repair', priceMin: 39, priceMax: 99 },
                { id: '4', name: 'Camera Repair', priceMin: 49, priceMax: 149 },
                { id: '5', name: 'Other Repair', priceMin: 20, priceMax: 500 },
            ]);
        }
        setLoading(false);
    };

    const handleDeviceSelect = (type) => {
        updateFormData({
            deviceType: type,
            serviceId: '',
            serviceName: '',
            servicePrice: 0
        });
    };

    const handleServiceSelect = (e) => {
        const serviceId = e.target.value;
        const service = services.find(s => s.id === serviceId);
        updateFormData({
            serviceId,
            serviceName: service?.name || '',
            servicePrice: service?.priceMin || 0,
            servicePriceMax: service?.priceMax || 0
        });
    };

    const canProceed = () => {
        return formData.deviceType &&
            formData.deviceBrand?.trim() &&
            formData.deviceModel?.trim() &&
            formData.serviceId;
    };

    return (
        <div className="step-content">
            <div className="step-header">
                <Wrench className="step-icon" />
                <div>
                    <h2>Device & Service</h2>
                    <p>Tell us about your device and what needs fixing</p>
                </div>
            </div>

            {/* Device Type Selection */}
            <div className="section">
                <label className="section-label">What type of device?</label>
                <div className="device-grid">
                    {DEVICE_TYPES.map(device => {
                        const Icon = device.icon;
                        return (
                            <button
                                key={device.id}
                                type="button"
                                className={`device-card ${formData.deviceType === device.id ? 'selected' : ''}`}
                                onClick={() => handleDeviceSelect(device.id)}
                            >
                                <Icon size={32} />
                                <span>{device.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Device Details */}
            {formData.deviceType && (
                <div className="section">
                    <label className="section-label">Device Details</label>
                    <div className="form-row two-col">
                        <div className="form-group">
                            <label>Brand *</label>
                            <input
                                type="text"
                                placeholder="e.g., Apple, Samsung, Dell"
                                value={formData.deviceBrand}
                                onChange={(e) => updateFormData({ deviceBrand: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Model *</label>
                            <input
                                type="text"
                                placeholder="e.g., iPhone 14, Galaxy S23"
                                value={formData.deviceModel}
                                onChange={(e) => updateFormData({ deviceModel: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Service Selection */}
            {formData.deviceType && (
                <div className="section">
                    <label className="section-label">What service do you need?</label>
                    <div className="form-group">
                        <select
                            value={formData.serviceId}
                            onChange={handleServiceSelect}
                            disabled={loading}
                        >
                            <option value="">
                                {loading ? 'Loading services...' : 'Select a service'}
                            </option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} - ${service.priceMin || 0}{service.priceMax > service.priceMin ? ` - $${service.priceMax}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Issue Description */}
            {formData.serviceId && (
                <div className="section">
                    <label className="section-label">Describe the issue (optional)</label>
                    <div className="form-group">
                        <textarea
                            placeholder="Tell us more about what's wrong with your device..."
                            rows={2}
                            value={formData.issueDescription}
                            onChange={(e) => updateFormData({ issueDescription: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="step-actions">
                <div></div>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!canProceed()}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default DeviceServiceStep;

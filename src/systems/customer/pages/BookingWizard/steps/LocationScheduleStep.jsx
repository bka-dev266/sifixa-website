import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Zap, Star, Store, Truck } from 'lucide-react';
import { appointmentsApi } from '../../../../../services/api';
import { addressesApi } from '../../../../../services/api/addresses';
import AddressInput from '../components/AddressInput';

const SERVICE_TYPES = [
    { id: 'in_store', name: 'Visit Our Shop', description: 'Drop off at our location', fee: 0, icon: Store, requiresAddress: false },
    { id: 'mobile', name: 'We Come To You', description: 'Technician visits you', fee: 25, icon: MapPin, requiresAddress: true },
    { id: 'pickup_delivery', name: 'Pickup & Delivery', description: 'We pick up & return', fee: 15, icon: Truck, requiresAddress: true },
];

const PRIORITY_LEVELS = [
    { id: 'standard', name: 'Standard', description: '2-3 hours', fee: 0 },
    { id: 'express', name: 'Express', description: '1 hour', fee: 20, popular: true },
    { id: 'rush', name: 'Same Day Rush', description: '30 min', fee: 40 },
];

const LocationScheduleStep = ({ formData, updateFormData, onNext, onBack }) => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [serviceTypes, setServiceTypes] = useState(SERVICE_TYPES);

    const selectedServiceType = serviceTypes.find(t => t.id === formData.serviceDeliveryType);
    const requiresAddress = selectedServiceType?.requiresAddress;

    // Load time slots when date changes
    useEffect(() => {
        if (formData.selectedDate) {
            loadTimeSlots(formData.selectedDate);
        }
    }, [formData.selectedDate]);

    // Try to load service types from database
    useEffect(() => {
        loadServiceTypes();
    }, []);

    const loadServiceTypes = async () => {
        try {
            const data = await addressesApi.getServiceDeliveryTypes();
            if (data && data.length > 0) {
                setServiceTypes(data.map(t => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    fee: t.base_fee,
                    icon: t.icon === 'Store' ? Store : t.icon === 'MapPin' ? MapPin : Truck,
                    requiresAddress: t.requires_address
                })));
            }
        } catch (error) {
            console.error('Failed to load service types:', error);
        }
    };

    const loadTimeSlots = async (date) => {
        setLoadingSlots(true);
        try {
            const slots = await appointmentsApi.getSlotAvailability(date);
            setTimeSlots(slots || []);
        } catch (error) {
            console.error('Failed to load time slots:', error);
            setTimeSlots([
                { id: '1', name: 'Morning', startTime: '09:00', endTime: '12:00', isAvailable: true, remainingSlots: 3 },
                { id: '2', name: 'Afternoon', startTime: '12:00', endTime: '16:00', isAvailable: true, remainingSlots: 2 },
                { id: '3', name: 'Evening', startTime: '16:00', endTime: '20:00', isAvailable: true, remainingSlots: 4 },
            ]);
        }
        setLoadingSlots(false);
    };

    const getMinDate = () => new Date().toISOString().split('T')[0];

    const handleServiceTypeSelect = (typeId) => {
        const type = serviceTypes.find(t => t.id === typeId);
        updateFormData({
            serviceDeliveryType: typeId,
            address: type?.requiresAddress ? formData.address : { street: '', aptSuite: '', city: '', state: '', zipCode: '' }
        });
    };

    const handleTimeSlotSelect = (slot) => {
        if (slot.isAvailable) {
            updateFormData({
                selectedTimeSlotId: slot.id,
                selectedTimeSlot: slot
            });
        }
    };

    const canProceed = () => {
        const hasSchedule = formData.selectedDate && formData.selectedTimeSlotId;

        if (!requiresAddress) return hasSchedule;

        const hasAddress = formData.address?.street?.trim() &&
            formData.address?.city?.trim() &&
            formData.address?.state &&
            formData.address?.zipCode?.trim();

        return hasSchedule && hasAddress;
    };

    return (
        <div className="step-content">
            <div className="step-header">
                <MapPin className="step-icon" />
                <div>
                    <h2>Location & Schedule</h2>
                    <p>Choose how and when to get your device repaired</p>
                </div>
            </div>

            {/* Service Type Selection */}
            <div className="section">
                <label className="section-label">How would you like to proceed?</label>
                <div className="service-type-grid">
                    {serviceTypes.map(type => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                type="button"
                                className={`service-type-card ${formData.serviceDeliveryType === type.id ? 'selected' : ''}`}
                                onClick={() => handleServiceTypeSelect(type.id)}
                            >
                                <Icon size={28} />
                                <h4>{type.name}</h4>
                                <p>{type.description}</p>
                                <span className="type-fee">
                                    {type.fee === 0 ? 'No extra fee' : `+$${type.fee}`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Address Input (conditional) */}
            {requiresAddress && (
                <div className="section">
                    <label className="section-label">
                        <MapPin size={18} />
                        {formData.serviceDeliveryType === 'mobile'
                            ? 'Where should we come?'
                            : 'Pickup & delivery address'}
                    </label>
                    <AddressInput
                        value={formData.address}
                        onChange={(address) => updateFormData({ address })}
                        onSavedAddressSelect={(id) => updateFormData({ savedAddressId: id })}
                        saveAddress={formData.saveAddress}
                        onSaveAddressChange={(save) => updateFormData({ saveAddress: save })}
                    />
                </div>
            )}

            {/* Date Selection */}
            <div className="section">
                <label className="section-label">
                    <Calendar size={18} />
                    Select a date
                </label>
                <input
                    type="date"
                    className="date-input"
                    min={getMinDate()}
                    value={formData.selectedDate}
                    onChange={(e) => updateFormData({
                        selectedDate: e.target.value,
                        selectedTimeSlotId: '',
                        selectedTimeSlot: null
                    })}
                />
            </div>

            {/* Time Slots */}
            {formData.selectedDate && (
                <div className="section">
                    <label className="section-label">
                        <Clock size={18} />
                        Available times
                    </label>
                    {loadingSlots ? (
                        <div className="loading-message">Loading available times...</div>
                    ) : (
                        <div className="time-slots-grid">
                            {timeSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    type="button"
                                    className={`time-slot ${formData.selectedTimeSlotId === slot.id ? 'selected' : ''} ${!slot.isAvailable ? 'unavailable' : ''}`}
                                    onClick={() => handleTimeSlotSelect(slot)}
                                    disabled={!slot.isAvailable}
                                >
                                    <span className="slot-name">{slot.name}</span>
                                    <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                                    {slot.remainingSlots !== undefined && (
                                        <span className={`slot-availability ${slot.remainingSlots <= 1 ? 'low' : ''}`}>
                                            {slot.remainingSlots} left
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Priority Selection */}
            <div className="section">
                <label className="section-label">
                    <Zap size={18} />
                    Service priority
                </label>
                <div className="priority-grid">
                    {PRIORITY_LEVELS.map(level => (
                        <button
                            key={level.id}
                            type="button"
                            className={`priority-card ${formData.priorityLevel === level.id ? 'selected' : ''}`}
                            onClick={() => updateFormData({ priorityLevel: level.id })}
                        >
                            {level.popular && <span className="popular-badge">Popular</span>}
                            <span className="priority-name">{level.name}</span>
                            <span className="priority-time">{level.description}</span>
                            <span className="priority-fee">
                                {level.fee === 0 ? 'Included' : `+$${level.fee}`}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="step-actions">
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Back
                </button>
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

export default LocationScheduleStep;

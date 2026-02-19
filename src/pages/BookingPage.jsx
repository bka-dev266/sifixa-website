import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, AlertCircle, Calendar, Smartphone, User,
  ArrowRight, ArrowLeft, Shield, Zap, Star, Phone, Mail,
  Wrench, ChevronRight, Copy, ExternalLink, Store, Truck, MapPin,
  Tablet, Laptop, Watch, Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import './BookingPage.css';

const TOTAL_STEPS = 4; // 3 steps + confirmation

// Fallback data if database queries fail
const DEFAULT_SERVICES = [
  { id: '1', name: 'Screen Repair', description: 'Fix cracked or broken screens', priceMin: 79, priceMax: 199, duration: '1-2 hours', icon: 'Smartphone' },
  { id: '2', name: 'Battery Replacement', description: 'Replace worn-out batteries', priceMin: 49, priceMax: 99, duration: '30-60 min', icon: 'Zap' },
  { id: '3', name: 'Water Damage', description: 'Repair water-damaged devices', priceMin: 99, priceMax: 249, duration: '2-4 hours', icon: 'Shield' },
  { id: '4', name: 'Charging Port', description: 'Fix charging issues', priceMin: 59, priceMax: 129, duration: '1-2 hours', icon: 'Zap' },
];

const DEFAULT_TIME_SLOTS = [
  { id: '1', name: 'Morning', startTime: '9:00 AM', endTime: '12:00 PM', maxBookings: 5 },
  { id: '2', name: 'Afternoon', startTime: '12:00 PM', endTime: '3:00 PM', maxBookings: 5 },
  { id: '3', name: 'Evening', startTime: '3:00 PM', endTime: '6:00 PM', maxBookings: 5 },
];

const DEVICE_TYPES = [
  { id: 'phone', label: 'Phone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'watch', label: 'Watch', icon: Watch },
  { id: 'console', label: 'Console', icon: Gamepad2 },
  { id: 'other', label: 'Other', icon: Wrench },
];

const PRIORITY_LEVELS = [
  { id: 'regular', name: 'Standard', fee: 0, description: 'Regular queue', icon: Clock },
  { id: 'priority', name: 'Priority', fee: 20, description: 'Faster service', icon: Zap, popular: true },
  { id: 'express', name: 'Express', fee: 40, description: 'Same-day rush', icon: Star },
];

const SERVICE_TYPES = [
  { id: 'drop-off', label: 'Drop-off', description: 'Bring to our store', fee: 0, icon: Store },
  { id: 'pick-up', label: 'Pick-up', description: 'We collect from you', fee: 15, icon: Truck },
  { id: 'on-site', label: 'On-site', description: 'We come to you', fee: 25, icon: MapPin },
];

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Data from database
  const [services, setServices] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state - Step 1: Device & Service
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'phone',
    brand: '',
    model: '',
    issue: ''
  });
  const [selectedService, setSelectedService] = useState(null);
  const [priorityLevel, setPriorityLevel] = useState('regular');

  // Form state - Step 2: Service Type, Location & Schedule
  const [serviceType, setServiceType] = useState('drop-off');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: ''
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Form state - Step 3: Contact
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, slotsData] = await Promise.all([
          api.services.list(),
          api.timeSlots.list()
        ]);
        setServices((servicesData || []).filter(s => s.active) || DEFAULT_SERVICES);
        setTimeSlots((slotsData || []).filter(s => s.active) || DEFAULT_TIME_SLOTS);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setServices(DEFAULT_SERVICES);
        setTimeSlots(DEFAULT_TIME_SLOTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pre-fill customer info if logged in
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if address is required
  const needsAddress = serviceType === 'pick-up' || serviceType === 'on-site';

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        // Device & Service: need device info and service selection
        return deviceInfo.brand.length >= 2 &&
          deviceInfo.model.length >= 2 &&
          deviceInfo.issue.length >= 10 &&
          selectedService !== null;
      case 2:
        // Service Type, Location & Schedule
        const addressValid = !needsAddress || (
          address.line1.length >= 5 &&
          address.city.length >= 2 &&
          address.state.length >= 2 &&
          address.zip.length >= 5
        );
        return selectedDate && selectedTimeSlot !== null && addressValid;
      case 3:
        // Contact info
        return customerInfo.name.length >= 2 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email) &&
          customerInfo.phone.length >= 10;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const bookingData = {
        device: {
          type: deviceInfo.type,
          brand: deviceInfo.brand,
          model: deviceInfo.model
        },
        serviceId: selectedService?.id || null,
        issue: deviceInfo.issue,
        priorityLevel: priorityLevel,
        serviceType: serviceType,
        address: needsAddress ? address : null,
        date: selectedDate,
        timeSlotId: selectedTimeSlot?.id || null,
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        }
      };

      const result = await api.bookings.create(bookingData);
      setBookingResult(result);
      setCurrentStep(4);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingNumber = () => {
    if (bookingResult?.tracking_number) {
      navigator.clipboard.writeText(bookingResult.tracking_number);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    const servicePrice = selectedService?.priceMin || 0;
    const priorityFee = PRIORITY_LEVELS.find(p => p.id === priorityLevel)?.fee || 0;
    const serviceTypeFee = SERVICE_TYPES.find(s => s.id === serviceType)?.fee || 0;
    return {
      min: servicePrice + priorityFee + serviceTypeFee,
      max: (selectedService?.priceMax || 0) + priorityFee + serviceTypeFee
    };
  };

  // Step titles
  const stepTitles = ['Device & Service', 'Location & Schedule', 'Confirm'];

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Header with progress */}
      <header className="booking-header">
        <div className="booking-header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          {currentStep < 4 && (
            <div className="step-progress">
              {stepTitles.map((title, index) => (
                <div
                  key={title}
                  className={`step-dot ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
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

          <div className="step-info">
            <span className="step-label">Step {currentStep} of 3</span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="booking-content">
        <AnimatePresence mode="wait">
          {/* Step 1: Device & Service (Combined) */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="step-container"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <Smartphone size={28} className="step-icon" />
                <div>
                  <h1>Device & Service</h1>
                  <p>Tell us about your device and what needs fixing</p>
                </div>
              </div>

              {/* Device Type Selection */}
              <div className="device-types">
                {DEVICE_TYPES.map(type => (
                  <div
                    key={type.id}
                    className={`device-type-card ${deviceInfo.type === type.id ? 'selected' : ''}`}
                    onClick={() => setDeviceInfo({ ...deviceInfo, type: type.id })}
                  >
                    <type.icon size={24} />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>

              {/* Device Info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Samsung"
                    value={deviceInfo.brand}
                    onChange={(e) => setDeviceInfo({ ...deviceInfo, brand: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 14 Pro"
                    value={deviceInfo.model}
                    onChange={(e) => setDeviceInfo({ ...deviceInfo, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Describe the Issue * <span className="char-count">({deviceInfo.issue.length}/10 min)</span></label>
                <textarea
                  placeholder="Please describe what's wrong with your device..."
                  rows={3}
                  value={deviceInfo.issue}
                  onChange={(e) => setDeviceInfo({ ...deviceInfo, issue: e.target.value })}
                />
              </div>

              {/* Service Selection */}
              <div className="section-divider">
                <h3>Select Service</h3>
              </div>

              <div className="services-grid">
                {(services.length > 0 ? services : DEFAULT_SERVICES).map(service => (
                  <div
                    key={service.id}
                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="service-card-header">
                      <Wrench size={24} />
                      <span className="service-price">${service.priceMin}-${service.priceMax}</span>
                    </div>
                    <h3>{service.name}</h3>
                    <p>{service.description || 'Professional repair service'}</p>
                    {selectedService?.id === service.id && (
                      <div className="selected-check">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Priority Selection */}
              {selectedService && (
                <div className="priority-section">
                  <h3>Service Priority</h3>
                  <div className="priority-options">
                    {PRIORITY_LEVELS.map(level => (
                      <div
                        key={level.id}
                        className={`priority-card ${priorityLevel === level.id ? 'selected' : ''} ${level.popular ? 'popular' : ''}`}
                        onClick={() => setPriorityLevel(level.id)}
                      >
                        {level.popular && <span className="popular-tag">Popular</span>}
                        <level.icon size={20} />
                        <span className="priority-name">{level.name}</span>
                        <span className="priority-fee">{level.fee === 0 ? 'Free' : `+$${level.fee}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Service Type, Location & Schedule */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="step-container"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <MapPin size={28} className="step-icon" />
                <div>
                  <h1>Location & Schedule</h1>
                  <p>How and when would you like your repair?</p>
                </div>
              </div>

              {/* Service Type Selection */}
              <div className="service-types">
                {SERVICE_TYPES.map(type => (
                  <div
                    key={type.id}
                    className={`service-type-card ${serviceType === type.id ? 'selected' : ''}`}
                    onClick={() => setServiceType(type.id)}
                  >
                    <type.icon size={24} />
                    <div className="service-type-info">
                      <span className="service-type-label">{type.label}</span>
                      <span className="service-type-desc">{type.description}</span>
                    </div>
                    <span className="service-type-fee">
                      {type.fee === 0 ? 'Free' : `+$${type.fee}`}
                    </span>
                    {serviceType === type.id && (
                      <CheckCircle size={20} className="service-type-check" />
                    )}
                  </div>
                ))}
              </div>

              {/* Address Section (shown for pick-up/on-site) */}
              {needsAddress && (
                <div className="address-section">
                  <h3>
                    <MapPin size={18} />
                    {serviceType === 'pick-up' ? 'Pick-up Address' : 'Service Address'}
                  </h3>
                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Apartment, Suite, etc. (optional)</label>
                    <input
                      type="text"
                      placeholder="Apt 4B"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                  </div>
                  <div className="address-grid">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        placeholder="New York"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        placeholder="NY"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>ZIP Code *</label>
                      <input
                        type="text"
                        placeholder="10001"
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Time Selection */}
              <div className="schedule-section">
                <h3>
                  <Calendar size={18} />
                  Select Date & Time
                </h3>
                <div className="form-group">
                  <label>Select Date *</label>
                  <input
                    type="date"
                    min={getMinDate()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                {selectedDate && (
                  <div className="time-slots-section">
                    <label>Available Time Slots</label>
                    <div className="time-slots-grid">
                      {(timeSlots.length > 0 ? timeSlots : DEFAULT_TIME_SLOTS).map(slot => (
                        <div
                          key={slot.id}
                          className={`time-slot-card ${selectedTimeSlot?.id === slot.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTimeSlot(slot)}
                        >
                          <Clock size={18} />
                          <span className="slot-name">{slot.name}</span>
                          <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                          {selectedTimeSlot?.id === slot.id && (
                            <CheckCircle size={18} className="slot-check" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedDate && (
                  <div className="select-date-hint">
                    <Calendar size={40} />
                    <p>Please select a date to see available time slots</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact & Confirmation */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="step-container"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="step-header">
                <User size={28} className="step-icon" />
                <div>
                  <h1>Contact & Confirm</h1>
                  <p>Review your booking and provide contact details</p>
                </div>
              </div>

              {user && (
                <div className="logged-in-notice">
                  <CheckCircle size={18} />
                  <span>Logged in as <strong>{user.name || user.email}</strong></span>
                </div>
              )}

              <div className="form-group">
                <label><User size={16} /> Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><Mail size={16} /> Email *</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={16} /> Phone *</label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Booking Summary */}
              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Device:</span>
                  <span>{DEVICE_TYPES.find(d => d.id === deviceInfo.type)?.label} - {deviceInfo.brand} {deviceInfo.model}</span>
                </div>
                <div className="summary-row">
                  <span>Service:</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Priority:</span>
                  <span>{PRIORITY_LEVELS.find(p => p.id === priorityLevel)?.name}</span>
                </div>
                <div className="summary-row">
                  <span>Service Type:</span>
                  <span>{SERVICE_TYPES.find(s => s.id === serviceType)?.label}</span>
                </div>
                {needsAddress && (
                  <div className="summary-row">
                    <span>Address:</span>
                    <span>{address.line1}, {address.city}, {address.state} {address.zip}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Date:</span>
                  <span>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="summary-row">
                  <span>Time:</span>
                  <span>{selectedTimeSlot?.name} ({selectedTimeSlot?.startTime})</span>
                </div>
                <div className="summary-row total">
                  <span>Estimated Total:</span>
                  <span>${calculateTotal().min} - ${calculateTotal().max}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && bookingResult && (
            <motion.div
              key="step4"
              className="step-container confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>

              <h1>Booking Confirmed!</h1>
              <p>Your repair appointment has been scheduled</p>

              <div className="tracking-box">
                <span className="tracking-label">Your Tracking Number</span>
                <div className="tracking-number">
                  <strong>{bookingResult.tracking_number}</strong>
                  <button className="copy-btn" onClick={copyTrackingNumber}>
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="confirmation-details">
                <div className="detail-row">
                  <Wrench size={18} />
                  <span>{selectedService?.name}</span>
                </div>
                <div className="detail-row">
                  <Smartphone size={18} />
                  <span>{deviceInfo.brand} {deviceInfo.model}</span>
                </div>
                <div className="detail-row">
                  {SERVICE_TYPES.find(s => s.id === serviceType)?.icon &&
                    React.createElement(SERVICE_TYPES.find(s => s.id === serviceType).icon, { size: 18 })}
                  <span>{SERVICE_TYPES.find(s => s.id === serviceType)?.label}</span>
                </div>
                <div className="detail-row">
                  <Calendar size={18} />
                  <span>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="detail-row">
                  <Clock size={18} />
                  <span>{selectedTimeSlot?.name} ({selectedTimeSlot?.startTime})</span>
                </div>
              </div>

              <p className="confirmation-note">
                We'll send a confirmation email to <strong>{customerInfo.email}</strong> with all the details.
              </p>

              <div className="confirmation-actions">
                <button className="btn-primary" onClick={() => navigate('/track')}>
                  Track Repair <ExternalLink size={18} />
                </button>
                <button className="btn-secondary" onClick={() => navigate('/')}>
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with navigation buttons */}
      {currentStep < 4 && (
        <footer className="booking-footer">
          <button
            className="btn-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {currentStep < 3 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn-primary confirm"
              onClick={handleSubmit}
              disabled={!validateStep(currentStep) || isSubmitting}
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              <CheckCircle size={18} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
}

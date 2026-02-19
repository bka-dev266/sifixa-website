import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Check, Home, Briefcase, Building } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import { addressesApi } from '../../../../../services/api/addresses';
import './AddressInput.css';

// Free ZIP code lookup (no API key needed)
const lookupZipCode = async (zip) => {
    try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            city: data.places[0]['place name'],
            state: data.places[0]['state abbreviation']
        };
    } catch {
        return null;
    }
};

const AddressInput = ({
    value,
    onChange,
    onSavedAddressSelect,
    saveAddress,
    onSaveAddressChange,
    showSaveOption = true,
    required = true
}) => {
    const { user } = useAuth();
    const [mode, setMode] = useState('manual'); // 'manual' | 'saved'
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);

    // Load saved addresses for logged-in users
    useEffect(() => {
        if (user) {
            loadSavedAddresses();
        }
    }, [user]);

    const loadSavedAddresses = async () => {
        setLoadingSaved(true);
        try {
            const addresses = await addressesApi.getByCustomer(user.id);
            setSavedAddresses(addresses || []);
            if (addresses?.length > 0) {
                setMode('saved');
            }
        } catch (error) {
            console.error('Failed to load saved addresses:', error);
        }
        setLoadingSaved(false);
    };

    // Handle manual field changes
    const handleFieldChange = (field, fieldValue) => {
        const newAddress = { ...value, [field]: fieldValue };
        onChange(newAddress);
    };

    // Auto-fill city/state from ZIP
    const handleZipChange = async (zip) => {
        handleFieldChange('zipCode', zip);

        if (zip.length === 5) {
            setZipLoading(true);
            const lookup = await lookupZipCode(zip);
            if (lookup) {
                onChange({
                    ...value,
                    zipCode: zip,
                    city: lookup.city,
                    state: lookup.state
                });
            }
            setZipLoading(false);
        }
    };

    // Handle saved address selection
    const handleSavedSelect = (address) => {
        onChange({
            street: address.street_address,
            aptSuite: address.apt_suite || '',
            city: address.city,
            state: address.state,
            zipCode: address.zip_code,
            latitude: address.latitude,
            longitude: address.longitude
        });
        onSavedAddressSelect?.(address.id);
        setMode('manual'); // Show fields for review
    };

    const getLabelIcon = (label) => {
        switch (label?.toLowerCase()) {
            case 'work': return <Briefcase size={16} />;
            case 'other': return <Building size={16} />;
            default: return <Home size={16} />;
        }
    };

    const US_STATES = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
        'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
        'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
        'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
        'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    return (
        <div className="address-input">
            {/* Mode Tabs (if logged in with saved addresses) */}
            {user && savedAddresses.length > 0 && (
                <div className="address-tabs">
                    <button
                        type="button"
                        className={`tab ${mode === 'saved' ? 'active' : ''}`}
                        onClick={() => setMode('saved')}
                    >
                        Saved Addresses
                    </button>
                    <button
                        type="button"
                        className={`tab ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                    >
                        New Address
                    </button>
                </div>
            )}

            {/* Saved Addresses List */}
            {mode === 'saved' && (
                <div className="saved-addresses">
                    {loadingSaved ? (
                        <div className="loading-message">Loading addresses...</div>
                    ) : savedAddresses.length === 0 ? (
                        <div className="empty-message">No saved addresses</div>
                    ) : (
                        savedAddresses.map(addr => (
                            <button
                                key={addr.id}
                                type="button"
                                className="saved-address-card"
                                onClick={() => handleSavedSelect(addr)}
                            >
                                <div className="address-label">
                                    {getLabelIcon(addr.label)}
                                    <span>{addr.label}</span>
                                    {addr.is_default && <span className="default-badge">Default</span>}
                                </div>
                                <div className="address-text">
                                    {addr.street_address}
                                    {addr.apt_suite && `, ${addr.apt_suite}`}
                                </div>
                                <div className="address-city">
                                    {addr.city}, {addr.state} {addr.zip_code}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Manual Entry Fields */}
            {mode === 'manual' && (
                <div className="manual-fields">
                    <div className="form-group">
                        <label htmlFor="street">Street Address {required && '*'}</label>
                        <input
                            id="street"
                            type="text"
                            placeholder="123 Main Street"
                            value={value?.street || ''}
                            onChange={(e) => handleFieldChange('street', e.target.value)}
                            required={required}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="aptSuite">Apt, Suite, Unit (optional)</label>
                        <input
                            id="aptSuite"
                            type="text"
                            placeholder="Apt 4B"
                            value={value?.aptSuite || ''}
                            onChange={(e) => handleFieldChange('aptSuite', e.target.value)}
                        />
                    </div>

                    <div className="form-row three-col">
                        <div className="form-group">
                            <label htmlFor="zipCode">ZIP Code {required && '*'}</label>
                            <input
                                id="zipCode"
                                type="text"
                                placeholder="22630"
                                value={value?.zipCode || ''}
                                onChange={(e) => handleZipChange(e.target.value)}
                                maxLength={10}
                                required={required}
                            />
                            {zipLoading && <span className="zip-loading">Looking up...</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="city">City {required && '*'}</label>
                            <input
                                id="city"
                                type="text"
                                placeholder="Front Royal"
                                value={value?.city || ''}
                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                required={required}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="state">State {required && '*'}</label>
                            <select
                                id="state"
                                value={value?.state || ''}
                                onChange={(e) => handleFieldChange('state', e.target.value)}
                                required={required}
                            >
                                <option value="">Select</option>
                                {US_STATES.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Address Preview */}
                    {value?.street && value?.city && value?.zipCode && (
                        <div className="address-preview">
                            <Check size={16} />
                            <span>
                                {value.street}
                                {value.aptSuite && `, ${value.aptSuite}`}, {value.city}, {value.state} {value.zipCode}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Save Address Option */}
            {showSaveOption && user && mode === 'manual' && value?.street && (
                <label className="save-checkbox">
                    <input
                        type="checkbox"
                        checked={saveAddress || false}
                        onChange={(e) => onSaveAddressChange?.(e.target.checked)}
                    />
                    <span>Save this address for future bookings</span>
                </label>
            )}
        </div>
    );
};

export default AddressInput;

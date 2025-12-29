// Input validation utilities

// Validate and sanitize phone number - only numbers allowed
export const validatePhone = (value) => {
    return value.replace(/[^0-9]/g, '');
};

// Validate name - letters, spaces, and common name characters only
export const validateName = (value) => {
    return value.replace(/[^a-zA-Z\s'-]/g, '');
};

// Validate username - alphanumeric and underscore only
export const validateUsername = (value) => {
    return value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};

// Validate price - numbers and decimal only
export const validatePrice = (value) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
};

// Validate text - remove potentially dangerous characters
export const validateText = (value) => {
    // Remove control characters and null bytes
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

// Sanitize email - allow valid email characters
export const validateEmail = (value) => {
    return value.replace(/[^a-zA-Z0-9@._+-]/g, '').toLowerCase();
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate that a phone number has reasonable length
export const isValidPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
};

// Validate booking ID format
export const validateBookingId = (value) => {
    return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
};

// Validate numbers only
export const validateNumbersOnly = (value) => {
    return value.replace(/[^0-9]/g, '');
};

// Validate percentage (0-100)
export const validatePercentage = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    if (num < 0) return '0';
    if (num > 100) return '100';
    return value;
};

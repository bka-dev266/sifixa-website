// Utility functions to normalize data from the new advanced schema
// This ensures backward compatibility with frontend components

/**
 * Get device display name from device object or string
 */
export const getDeviceName = (device) => {
    if (!device) return 'Unknown Device';
    if (typeof device === 'string') return device;
    if (typeof device === 'object') {
        return device.name || `${device.brand || ''} ${device.model || ''}`.trim() || 'Device';
    }
    return String(device);
};

/**
 * Get customer display name from customer object or string
 */
export const getCustomerName = (customer) => {
    if (!customer) return 'Unknown Customer';
    if (typeof customer === 'string') return customer;
    if (typeof customer === 'object') {
        return customer.name ||
            `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim() ||
            customer.email ||
            'Customer';
    }
    return String(customer);
};

/**
 * Get booking date from various property names
 */
export const getBookingDate = (booking) => {
    if (!booking) return 'N/A';
    return booking.scheduledDate || booking.scheduled_date || booking.date || 'N/A';
};

/**
 * Get booking time from various property names
 */
export const getBookingTime = (booking) => {
    if (!booking) return 'N/A';
    if (booking.timeSlot?.name) return booking.timeSlot.name;
    if (booking.time_slot?.name) return booking.time_slot.name;
    return booking.scheduledStart || booking.scheduled_start || booking.time || 'N/A';
};

/**
 * Normalize booking object for frontend compatibility
 */
export const normalizeBooking = (booking) => {
    if (!booking) return null;
    return {
        ...booking,
        // Ensure device is a string for display
        deviceDisplay: getDeviceName(booking.device),
        // Ensure customer name is a string
        customerName: getCustomerName(booking.customer),
        // Normalize date fields
        displayDate: getBookingDate(booking),
        displayTime: getBookingTime(booking)
    };
};

/**
 * Normalize an array of bookings
 */
export const normalizeBookings = (bookings) => {
    if (!Array.isArray(bookings)) return [];
    return bookings.map(normalizeBooking);
};

export default {
    getDeviceName,
    getCustomerName,
    getBookingDate,
    getBookingTime,
    normalizeBooking,
    normalizeBookings
};

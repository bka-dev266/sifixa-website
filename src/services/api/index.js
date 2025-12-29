// Supabase API - Central Export
// All API modules for the advanced 62-table schema

// Core Supabase client
export { supabase } from '../supabase';

// Phase 1: Core Foundation
export { customersApi } from './customers';
export { usersApi } from './users';
export { devicesApi } from './devices';

// Phase 2: Appointments & Tickets
export { appointmentsApi } from './appointments';
export { ticketsApi } from './tickets';
export { warrantiesApi } from './warranties';

// Phase 3: POS & Sales
export { registersApi } from './registers';
export { salesOrdersApi } from './salesOrders';
export { paymentsApi } from './payments';
export { discountsApi } from './discounts';

// Phase 4: Inventory Management
export { inventoryApi } from './inventory';
export { purchaseOrdersApi } from './purchaseOrders';
export { suppliersApi } from './suppliers';

// Phase 5: Invoicing
export { invoicesApi } from './invoices';

// Phase 6: Messaging & Notifications
export { messagingApi } from './messaging';

// Phase 7: Reporting & Analytics
export { reportingApi } from './reporting';

// Phase 8: Store Configuration
export { storeSettingsApi } from './storeSettings';

// Legacy support - Services
export { servicesApi } from './services';

// Unified API object for convenience
export const api = {
    // Core
    customers: customersApi,
    users: usersApi,
    devices: devicesApi,

    // Appointments & Tickets
    appointments: appointmentsApi,
    tickets: ticketsApi,
    warranties: warrantiesApi,

    // POS & Sales
    registers: registersApi,
    salesOrders: salesOrdersApi,
    payments: paymentsApi,
    discounts: discountsApi,

    // Inventory
    inventory: inventoryApi,
    purchaseOrders: purchaseOrdersApi,
    suppliers: suppliersApi,

    // Invoicing
    invoices: invoicesApi,

    // Messaging
    messaging: messagingApi,

    // Reporting
    reporting: reportingApi,

    // Store Settings
    storeSettings: storeSettingsApi,

    // Legacy
    services: servicesApi
};

// Import all for api object
import { customersApi } from './customers';
import { usersApi } from './users';
import { devicesApi } from './devices';
import { appointmentsApi } from './appointments';
import { ticketsApi } from './tickets';
import { warrantiesApi } from './warranties';
import { registersApi } from './registers';
import { salesOrdersApi } from './salesOrders';
import { paymentsApi } from './payments';
import { discountsApi } from './discounts';
import { inventoryApi } from './inventory';
import { purchaseOrdersApi } from './purchaseOrders';
import { suppliersApi } from './suppliers';
import { invoicesApi } from './invoices';
import { messagingApi } from './messaging';
import { reportingApi } from './reporting';
import { storeSettingsApi } from './storeSettings';
import { servicesApi } from './services';

export default api;

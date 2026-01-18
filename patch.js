const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/systems/customer/pages/CustomerProfile.jsx');
console.log('Reading file:', filePath);
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'const loadAllData = useCallback(async () => {';
const endMarker = '}, [user]);';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1) {
    console.error('Could not find start marker');
    process.exit(1);
}
if (endIndex === -1) {
    console.error('Could not find end marker');
    process.exit(1);
}

console.log(`Found block from ${startIndex} to ${endIndex}`);

const newLogic = `    const loadAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        
        // Safety timeout (10s)
        const safetyTimeout = setTimeout(() => {
            console.warn('Data loading timed out - forcing UI render');
            setLoading(false);
        }, 10000);

        try {
            // Task 1: Find or create customer
            let customer = null;
            let custId = null;

            // Try to find existing customer by email
            const { data: existingCustomers, error: findError } = await supabase
                .from('customers')
                .select('*')
                .eq('email', user.email)
                .limit(1);

            if (!findError && existingCustomers && existingCustomers.length > 0) {
                customer = existingCustomers[0];
                custId = customer.id;
                console.log('Found existing customer:', custId);
            } else {
                // Customer doesn't exist - create one
                console.log('Creating new customer for:', user.email);
                const nameParts = (user.name || user.full_name || user.email.split('@')[0]).split(' ');
                const firstName = nameParts[0] || 'Customer';
                const lastName = nameParts.slice(1).join(' ') || null;

                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert([{
                        email: user.email,
                        first_name: firstName,
                        last_name: lastName,
                        phone: user.phone || null
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.warn('Failed to create customer (might exist):', createError);
                    custId = user.id;
                } else {
                    customer = newCustomer;
                    custId = newCustomer.id;
                }
            }

            setCustomerData(customer);
            setCustomerId(custId);

            // Task 2: Bookings from view
            let bookingsData = [];
            try {
                const { data: bookings } = await supabase
                    .from('customer_bookings_view')
                    .select('*')
                    .or(\`customer_id.eq.\${custId},customer_email.eq.\${user.email}\`)
                    .order('created_at', { ascending: false });

                if (bookings) {
                    bookingsData = bookings.map(b => ({
                        id: b.id,
                        trackingNumber: b.tracking_number,
                        date: b.date,
                        time: b.time_slot_name || b.time,
                        status: b.status || 'Pending',
                        device: b.device_name || \`\${b.device_brand || ''} \${b.device_model || ''}\`.trim() || 'Device',
                        deviceType: b.device_type,
                        issue: b.issue || 'Repair service',
                        customer_id: b.customer_id,
                        priority: b.priority_level || 'regular',
                        created_at: b.created_at
                    }));
                }
            } catch (err) { console.error('Bookings error:', err); }
            setBookings(bookingsData);

            // Task 6: Fallbacks for Tabs
            
            // Notifications
            try {
                const { data } = await supabase.from('customer_notifications').select('*').eq('customer_id', custId).order('created_at', { ascending: false });
                setNotifications(data || []);
            } catch { setNotifications([]); }

            // Loyalty
            try {
                const { data } = await supabase.from('customer_loyalty').select('*').eq('customer_id', custId).single();
                setLoyalty(data ? { ...data, availableRewards: data.availableRewards || [], pointsHistory: data.pointsHistory || [] } : { points: 0, tier: 'Bronze', availableRewards: [], pointsHistory: [] });
            } catch { setLoyalty({ points: 0, tier: 'Bronze', availableRewards: [], pointsHistory: [] }); }

            // Avatar
            try {
                const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
                if (data?.avatar_url) setAvatarUrl(data.avatar_url);
            } catch {}

            // Devices
            try {
                const { data } = await supabase.from('devices').select('*').eq('customer_id', custId).order('created_at', { ascending: false });
                setDevices(data || []);
            } catch { setDevices([]); }

            // Warranties
            try {
                const { data } = await supabase.from('customer_warranties').select('*').eq('customer_id', custId).order('warranty_expiry', { ascending: true });
                setWarranties(data || []);
            } catch { setWarranties([]); }

            // Invoices
            try {
                const { data } = await supabase.from('customer_invoices').select('*').eq('customer_id', custId).order('created_at', { ascending: false });
                setInvoices(data || []);
            } catch { setInvoices([]); }

            // Referrals
            try {
                const { data } = await supabase.from('customer_referrals').select('*').eq('referrer_id', custId);
                setReferrals(data || []);
                const refCode = (data && data.length > 0 && data[0].referral_code) ? data[0].referral_code : \`SFX-\${(custId || user.id).slice(0, 6).toUpperCase()}\`;
                setReferralCode(refCode);
            } catch { 
                setReferrals([]); 
                setReferralCode(\`SFX-\${(custId || user.id).slice(0, 6).toUpperCase()}\`);
            }

            // Settings
            try {
                const { data } = await supabase.from('customer_settings').select('*').eq('customer_id', custId).single();
                setCustomerSettings(data || { email_notifications: true, sms_notifications: true });
            } catch { setCustomerSettings({ email_notifications: true, sms_notifications: true }); }

            // Reviews
            try {
                const { data } = await supabase.from('customer_reviews').select('*').eq('customer_id', custId).order('created_at', { ascending: false });
                setReviews(data || []);
            } catch { setReviews([]); }

            // Favorites
            try {
                const { data } = await supabase.from('customer_favorites').select('*').eq('customer_id', custId);
                setFavorites(data || []);
            } catch { setFavorites([]); }

            // Payment Methods
            try {
                const { data } = await supabase.from('customer_payment_methods').select('*').eq('customer_id', custId).order('is_default', { ascending: false });
                setPaymentMethods(data || []);
            } catch { setPaymentMethods([]); }
            
            // Support Tickets
            try {
                 const { data } = await supabase.from('support_tickets').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
                 setSupportTickets(data || []);
            } catch { setSupportTickets([]); }

            // Services
            try {
                const { data } = await supabase.from('repair_services').select('*').eq('is_active', true).order('display_order');
                 if (data) setServices(data);
                 else {
                     const { data: items } = await api.services.list();
                     setServices(items || []);
                 }
            } catch (err) { setServices([]); }

            // Time Slots
            try {
                const { data } = await supabase.from('time_slots').select('*').eq('is_active', true).order('start_time');
                setTimeSlots((data || []).map(s => ({
                    id: s.id, name: s.name, startTime: s.start_time, endTime: s.end_time, maxBookings: s.max_bookings, active: s.is_active
                })));
            } catch { setTimeSlots([]); }

            // Default Chat
            setMessages([{ id: 1, type: 'received', sender: 'SIFIXA Support', message: 'Welcome to SIFIXA! How can we help you today?', date: new Date().toLocaleString() }]);

        } catch (error) {
            console.error('Failed to load customer data:', error);
        } finally {
            clearTimeout(safetyTimeout);
            setLoading(false);
        }
    `;

// Splice the new content in
// Note: we replace up to endIndex + endMarker.length - since endMarker is '}, [user]);'
// wait, I want to KEET '}, [user]);' or replace it?
// The newLogic DOES NOT include `}, [user]);`.
// So I should replace [startIndex, endIndex]. And append `}, [user]);` to `newLogic`.
// No, I'll just append it in the concatenation.

const modifiedContent = content.substring(0, startIndex) + newLogic + '}, [user]);' + content.substring(endIndex + endMarker.length);

fs.writeFileSync(filePath, modifiedContent);
console.log('Patch complete.');

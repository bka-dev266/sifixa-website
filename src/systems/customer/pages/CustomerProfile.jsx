import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Legacy fallback
import { customerPortalApi } from '../../../services/customerPortalApi';
import { generateInvoicePDF } from '../../../utils/pdfGenerator';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import {
    User, Calendar, Package, Clock, Phone, Mail, MapPin, Home,
    ChevronRight, MessageSquare, Send, ArrowLeft, CheckCircle,
    AlertCircle, Clock3, XCircle, Edit2, Star, DollarSign, Bell,
    Gift, Smartphone, Laptop, Tablet, Watch, Settings, Shield,
    FileText, Heart, Award, TrendingUp, Download, Trash2, Plus,
    X, Eye, EyeOff, Save, RefreshCw, CreditCard, Receipt, Crown, Menu, Camera,
    Share2, Users, Copy, ShieldCheck, Globe, Volume2, VolumeX, Languages,
    Lock, Unlock, ThumbsUp, MessageCircle, Ticket, Percent, Headphones, Loader2, Info
} from 'lucide-react';
import { getDeviceName, getCustomerName, getBookingDate } from '../../../utils/schemaHelpers';
import { SkeletonOverview, SkeletonNotifications, SkeletonDeviceGrid, SkeletonCard } from '../../../components/Skeleton';
import EmptyState from '../../../components/EmptyState';
import './CustomerProfile.css';
import '../../../components/Skeleton.css';

const CustomerProfile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [bookings, setBookings] = useState([]);
    const [customerData, setCustomerData] = useState(null);
    const [customerId, setCustomerId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // New state for enhanced features
    const [devices, setDevices] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loyalty, setLoyalty] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [services, setServices] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);

    // New feature states
    const [referrals, setReferrals] = useState([]);
    const [referralCode, setReferralCode] = useState('');
    const [warranties, setWarranties] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [customerSettings, setCustomerSettings] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewableBookings, setReviewableBookings] = useState([]);
    const [liveChatMessages, setLiveChatMessages] = useState([]);
    const [liveChatOpen, setLiveChatOpen] = useState(false);
    const [liveChatInput, setLiveChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatAttachment, setChatAttachment] = useState(null);
    const [showQuickReplies, setShowQuickReplies] = useState(true);

    // Modal states
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showWarrantyClaimModal, setShowWarrantyClaimModal] = useState(false);
    const [showReferralInviteModal, setShowReferralInviteModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedWarranty, setSelectedWarranty] = useState(null);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

    useEffect(() => {
        loadAllData();
    }, [user]);

    const loadAllData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Get customer profile from Supabase or fallback
            let customer = null;
            let custId = user.id;

            try {
                const { data: customerResult } = await api.customers.list({ email: user.email });
                if (customerResult && customerResult.length > 0) {
                    customer = customerResult[0];
                    custId = customer.id;
                }
            } catch (e) {
                // Fallback to mockApi for customer lookup
                const customers = await mockApi.getCustomers();
                customer = customers.find(c => c.email === user.email);
                custId = customer?.id || user.id;
            }

            setCustomerData(customer);
            setCustomerId(custId);

            // Load data from real API with mockApi fallbacks
            // Real API calls
            const realApiPromises = Promise.allSettled([
                api.bookings.list({ customer_id: custId }),
                api.services.list(),
                api.timeSlots.list(),
                customerPortalApi.devices.getByCustomer(custId),
                customerPortalApi.notifications.getByCustomer(custId),
                customerPortalApi.loyalty.getByCustomer(custId),
                customerPortalApi.invoices.getByCustomer(custId),
                customerPortalApi.referrals.getByCustomer(custId),
                customerPortalApi.referrals.getOrCreateCode(custId),
                customerPortalApi.warranties.getByCustomer(custId),
                customerPortalApi.settings.getByCustomer(custId),
                customerPortalApi.reviews.getByCustomer(custId),
                customerPortalApi.reviews.getReviewableBookings(custId)
            ]);

            const results = await realApiPromises;

            // Helper to extract result or fallback
            const getResult = (index, fallback = []) => {
                const result = results[index];
                if (result.status === 'fulfilled' && result.value) {
                    // Handle both direct arrays and {data: array} responses
                    return result.value.data || result.value;
                }
                return fallback;
            };

            // Set state from results with fallbacks
            const bookingsData = getResult(0) || [];
            // Filter bookings for this customer if needed
            const customerBookings = Array.isArray(bookingsData)
                ? bookingsData.filter(b =>
                    b.customer_id === custId ||
                    b.customer?.email === user.email
                )
                : [];
            setBookings(customerBookings);

            const servicesData = getResult(1) || [];
            setServices(Array.isArray(servicesData) ? servicesData : []);

            const timeSlotsData = getResult(2) || [];
            setTimeSlots(Array.isArray(timeSlotsData) ? timeSlotsData.filter(s => s.active) : []);

            // Customer portal data
            setDevices(getResult(3) || []);
            setNotifications(getResult(4) || []);
            setLoyalty(getResult(5) || { points: 0, tier: 'Bronze', lifetime_points: 0 });
            setInvoices(getResult(6) || []);
            setReferrals(getResult(7) || []);
            setReferralCode(getResult(8) || `SFX-${user.id?.slice(0, 6).toUpperCase() || 'NEW'}`);
            setWarranties(getResult(9) || []);
            setCustomerSettings(getResult(10) || { email_notifications: true, sms_notifications: true });
            setReviews(getResult(11) || []);
            setReviewableBookings(getResult(12) || []);

            // Load additional data from mockApi (features not yet in Supabase)
            try {
                const [favoritesData, paymentMethodsData, chatHistory] = await Promise.all([
                    mockApi.getCustomerFavorites(custId),
                    mockApi.getCustomerPaymentMethods(custId),
                    mockApi.getLiveChatHistory(custId)
                ]);
                setFavorites(favoritesData || []);
                setPaymentMethods(paymentMethodsData || []);
                setLiveChatMessages(chatHistory || []);
            } catch (e) {
                console.warn('Optional data load failed:', e);
                setFavorites([]);
                setPaymentMethods([]);
                setLiveChatMessages([]);
            }

            // Default messages for support chat
            setMessages([
                { id: 1, type: 'received', sender: 'SIFIXA Support', message: 'Welcome to SIFIXA! How can we help you today?', date: new Date().toLocaleString() }
            ]);
        } catch (error) {
            console.error('Failed to load customer data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return <CheckCircle size={16} className="status-icon completed" />;
            case 'In Progress': return <Clock3 size={16} className="status-icon in-progress" />;
            case 'Confirmed': return <CheckCircle size={16} className="status-icon confirmed" />;
            case 'Pending': return <AlertCircle size={16} className="status-icon pending" />;
            case 'Cancelled': return <XCircle size={16} className="status-icon cancelled" />;
            default: return <Clock size={16} className="status-icon" />;
        }
    };

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'smartphone': return <Smartphone size={20} />;
            case 'laptop': return <Laptop size={20} />;
            case 'tablet': return <Tablet size={20} />;
            case 'smartwatch': return <Watch size={20} />;
            default: return <Smartphone size={20} />;
        }
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'Bronze': return '#cd7f32';
            case 'Silver': return '#c0c0c0';
            case 'Gold': return '#ffd700';
            case 'Platinum': return '#e5e4e2';
            default: return '#cd7f32';
        }
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const getRepairProgress = (status) => {
        switch (status) {
            case 'Pending': return { percent: 20, step: 1, label: 'Received' };
            case 'Confirmed': return { percent: 40, step: 2, label: 'Confirmed' };
            case 'In Progress': return { percent: 70, step: 3, label: 'Repairing' };
            case 'Completed': return { percent: 100, step: 4, label: 'Ready' };
            case 'Cancelled': return { percent: 0, step: 0, label: 'Cancelled' };
            default: return { percent: 0, step: 0, label: 'Unknown' };
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const activeBookings = bookings.filter(b => ['Pending', 'Confirmed', 'In Progress'].includes(b.status));
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalSpent = bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.costEstimate || 100), 0);

    // Handlers
    const handleMarkNotificationRead = async (id) => {
        try {
            await customerPortalApi.notifications.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await customerPortalApi.notifications.markAllAsRead(customerId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications read:', error);
        }
    };

    const handleReschedule = async (newDate, newTime) => {
        if (!selectedBooking) return;
        try {
            await api.bookings.update(selectedBooking.id, {
                date: newDate,
                time_slot: newTime,
                notes: `Rescheduled by customer on ${new Date().toLocaleDateString()}`
            });
            setShowRescheduleModal(false);
            setSelectedBooking(null);
            loadAllData();
        } catch (error) {
            alert(error.message || 'Failed to reschedule booking');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await api.bookings.void(bookingId, 'Cancelled by customer');
            loadAllData();
        } catch (error) {
            alert(error.message || 'Failed to cancel booking');
        }
    };

    const handleSaveDevice = async (deviceData) => {
        try {
            if (editingDevice) {
                await customerPortalApi.devices.update(editingDevice.id, deviceData);
            } else {
                await customerPortalApi.devices.create(customerId, deviceData);
            }
            setShowDeviceModal(false);
            setEditingDevice(null);
            loadAllData();
        } catch (error) {
            alert(error.message || 'Failed to save device');
        }
    };

    const handleDeleteDevice = async (deviceId) => {
        if (!window.confirm('Delete this device?')) return;
        try {
            await customerPortalApi.devices.delete(deviceId);
            loadAllData();
        } catch (error) {
            alert(error.message || 'Failed to delete device');
        }
    };

    const handleRedeemReward = async (rewardId) => {
        try {
            const result = await customerPortalApi.loyalty.redeemReward(customerId, rewardId);
            alert(`Successfully redeemed: ${result.reward.name}! Remaining points: ${result.remainingPoints}`);
            loadAllData();
        } catch (error) {
            alert(error.message || 'Failed to redeem reward');
        }
    };

    const handleRemoveFavorite = async (serviceId) => {
        await mockApi.removeFromFavorites(customerId, serviceId);
        setFavorites(prev => prev.filter(f => f.id !== serviceId));
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setMessages([...messages, {
            id: Date.now(),
            type: 'sent',
            sender: user?.name || 'You',
            message: newMessage,
            date: new Date().toLocaleString()
        }]);
        setNewMessage('');
    };

    // New handlers for additional features
    const handleCopyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        alert('Referral code copied to clipboard!');
    };

    const handleSendReferralInvite = async (email, name) => {
        try {
            await customerPortalApi.referrals.sendInvite(customerId, email, name);
            setShowReferralInviteModal(false);
            loadAllData();
            alert('Invitation sent successfully!');
        } catch (error) {
            alert(error.message || 'Failed to send invitation');
        }
    };

    const handleClaimWarranty = async (issueDescription) => {
        try {
            await customerPortalApi.warranties.claimWarranty(selectedWarranty.id, issueDescription);
            setShowWarrantyClaimModal(false);
            setSelectedWarranty(null);
            loadAllData();
            alert('Warranty claim submitted successfully!');
        } catch (error) {
            alert(error.message || 'Failed to submit warranty claim');
        }
    };

    const handleAddPaymentMethod = async (cardData) => {
        try {
            await mockApi.addPaymentMethod(customerId, cardData);
            setShowPaymentModal(false);
            loadAllData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleRemovePaymentMethod = async (methodId) => {
        if (!window.confirm('Remove this payment method?')) return;
        await mockApi.removePaymentMethod(methodId);
        loadAllData();
    };

    const handleSetDefaultPayment = async (methodId) => {
        await mockApi.setDefaultPaymentMethod(customerId, methodId);
        loadAllData();
    };

    const handleUpdateSettings = async (newSettings) => {
        try {
            await customerPortalApi.settings.update(customerId, newSettings);
            setCustomerSettings(prev => ({ ...prev, ...newSettings }));
        } catch (error) {
            alert(error.message || 'Failed to update settings');
        }
    };

    const handleSubmitReview = async (rating, title, comment, wouldRecommend) => {
        try {
            await customerPortalApi.reviews.create({
                customer_id: customerId,
                booking_id: selectedBookingForReview.id,
                rating,
                title,
                comment,
                would_recommend: wouldRecommend
            });
            setShowReviewModal(false);
            setSelectedBookingForReview(null);
            loadAllData();
            alert('Thank you for your review!');
        } catch (error) {
            alert(error.message || 'Failed to submit review');
        }
    };

    // Smart auto-response system for Live Chat
    const getSmartResponse = (message) => {
        const msg = message.toLowerCase();

        // Greeting responses
        if (msg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
            return "Hello! 👋 Welcome to SIFIXA Support! I'm here to help you with any questions about our repair services, pricing, or your existing orders. How can I assist you today?";
        }

        // Pricing questions
        if (msg.match(/price|cost|how much|pricing|quote|estimate|fee/)) {
            return "📱 **Our Pricing:**\n\n• iPhone Screen Repair: $79-$299\n• Android Screen Repair: $69-$249\n• Battery Replacement: $49-$99\n• Water Damage Repair: $99-$199\n• Computer/Laptop Repair: $49-$299\n\nPrices vary by model. For an exact quote, please book a free diagnostic or reply with your specific device and issue!";
        }

        // Location questions
        if (msg.match(/location|address|where|find you|directions|located/)) {
            return "📍 **Our Location:**\n\nSIFIXA Repair Center\n123 Tech Boulevard, Suite 100\nSan Francisco, CA 94102\n\n🚗 Free parking available\n🚇 Near Powell St. BART Station\n\nWe're located in the heart of downtown with easy access!";
        }

        // Contact information
        if (msg.match(/contact|phone|call|email|reach/)) {
            return "📞 **Contact Us:**\n\n• Phone: (555) 123-4567\n• Email: support@sifixa.com\n• Emergency Line: (555) 999-HELP\n\n💬 Or continue chatting here for instant support!";
        }

        // Hours of operation
        if (msg.match(/hour|open|close|when|time|schedule|available/)) {
            return "🕐 **Business Hours:**\n\n• Monday-Friday: 9:00 AM - 7:00 PM\n• Saturday: 10:00 AM - 5:00 PM\n• Sunday: Closed\n\n⚡ Same-day repairs available for most services if dropped off before 2 PM!";
        }

        // Warranty questions
        if (msg.match(/warranty|guarantee|covered|protection/)) {
            return "🛡️ **Warranty Information:**\n\n• All repairs come with a 90-day warranty\n• Screen repairs: 6-month warranty\n• Battery replacements: 1-year warranty\n• Original parts used when available\n\nWarranty covers defects in parts and workmanship. Accidental damage is not covered.";
        }

        // Repair time questions
        if (msg.match(/how long|time|duration|wait|turnaround|ready/)) {
            return "⏱️ **Repair Times:**\n\n• Screen Replacement: 30 min - 2 hours\n• Battery Replacement: 30 min - 1 hour\n• Water Damage: 24-48 hours\n• Data Recovery: 1-3 days\n• Computer Repairs: Same day - 3 days\n\nMost phone repairs are completed while you wait!";
        }

        // Services offered
        if (msg.match(/service|repair|fix|what do you|can you/)) {
            return "🔧 **Our Services:**\n\n📱 **Phone Repairs:**\n• Screen & LCD replacement\n• Battery replacement\n• Charging port repair\n• Water damage recovery\n\n💻 **Computer Repairs:**\n• Virus removal\n• Hardware upgrades\n• Data recovery\n• Screen replacement\n\nWe repair all major brands: Apple, Samsung, Google, and more!";
        }

        // Booking/Appointment
        if (msg.match(/book|appointment|schedule|reserve/)) {
            return "📅 **Book an Appointment:**\n\nYou can easily book online:\n1. Click 'Book Repair' from your dashboard\n2. Select your device and issue\n3. Choose a convenient time slot\n\nWalk-ins are also welcome during business hours! No appointment needed for quick diagnostics.";
        }

        // Status/Order questions
        if (msg.match(/status|order|track|my repair|progress/)) {
            return "📦 **Track Your Repair:**\n\nYou can check your repair status anytime:\n1. Go to 'My Bookings' in your dashboard\n2. Click on your active repair\n3. View real-time progress updates\n\nYou'll also receive email/SMS updates at each stage!";
        }

        // Payment questions
        if (msg.match(/pay|payment|accept|card|cash|method/)) {
            return "💳 **Payment Options:**\n\n• All major credit/debit cards\n• Apple Pay & Google Pay\n• Cash\n• PayPal\n• Financing available for repairs over $200\n\nPayment is collected after your repair is complete and tested!";
        }

        // Thanks/Goodbye
        if (msg.match(/thank|thanks|bye|goodbye|great|awesome|perfect/)) {
            return "You're welcome! 😊 Is there anything else I can help you with? If not, have a wonderful day! Remember, you can reach us anytime at (555) 123-4567.";
        }

        // Help/General
        if (msg.match(/help|support|assist|question/)) {
            return "I'm here to help! 🙋 Here are some things I can assist with:\n\n• 💰 Pricing & quotes\n• 📍 Location & hours\n• 🔧 Services we offer\n• ⏱️ Repair times\n• 🛡️ Warranty info\n• 📱 Booking appointments\n\nJust ask your question and I'll do my best to help!";
        }

        // Real agent request - return special marker
        if (msg.match(/real agent|human|person|speak to|talk to|real person|live agent|actual person|someone real/)) {
            return "CONNECT_REAL_AGENT";
        }

        // Default response for unrecognized queries
        return "Thanks for your message! For specific inquiries, our team will respond shortly. In the meantime, I can help with:\n\n• Pricing → just ask 'how much'\n• Location → ask 'where are you located'\n• Hours → ask 'what are your hours'\n• Services → ask 'what services do you offer'\n\nOr type 'real agent' to connect with a support specialist! 🙂";
    };

    const handleSendLiveChat = async (quickReplyMessage = null) => {
        const message = quickReplyMessage || liveChatInput.trim();
        if (!message && !chatAttachment) return;

        setLiveChatInput('');
        setShowQuickReplies(false);

        // Add user message
        const userMsg = {
            id: Date.now(),
            sender: 'customer',
            message: message || '',
            attachment: chatAttachment,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        setLiveChatMessages(prev => [...prev, userMsg]);
        setChatAttachment(null);

        // Show typing indicator
        setIsTyping(true);

        // Simulate message delivered status
        setTimeout(() => {
            setLiveChatMessages(prev =>
                prev.map(msg => msg.id === userMsg.id ? { ...msg, status: 'delivered' } : msg)
            );
        }, 500);

        // Smart auto-response with typing delay
        setTimeout(() => {
            setIsTyping(false);
            const smartResponse = getSmartResponse(message);

            // Check if user wants a real agent
            if (smartResponse === "CONNECT_REAL_AGENT") {
                // First send connecting message
                const connectingMsg = {
                    id: Date.now() + 1,
                    sender: 'agent',
                    agentName: 'SIFIXA Assistant',
                    agentAvatar: '🤖',
                    message: "Connecting you with a support specialist... Please hold for a moment! 🔄",
                    timestamp: new Date().toISOString(),
                    isBot: true
                };
                setLiveChatMessages(prev => [...prev, connectingMsg]);

                // Show typing again for real agent
                setTimeout(() => {
                    setIsTyping(true);

                    setTimeout(() => {
                        setIsTyping(false);

                        // Random real agent
                        const agents = [
                            { name: 'Sarah Johnson', avatar: '👩‍💼', greeting: "Hi there! I'm Sarah, a Support Specialist. I saw you wanted to speak with someone directly. How can I help you today?" },
                            { name: 'Mike Chen', avatar: '👨‍💻', greeting: "Hello! Mike here from the support team. I understand you'd like to chat with a real person - I'm here for you! What can I assist you with?" },
                            { name: 'Emma Davis', avatar: '👩‍🔧', greeting: "Hey! Emma from SIFIXA support here. You asked to speak with a real agent, and here I am! What questions do you have for me?" }
                        ];
                        const agent = agents[Math.floor(Math.random() * agents.length)];

                        const realAgentMsg = {
                            id: Date.now() + 2,
                            sender: 'agent',
                            agentName: agent.name,
                            agentAvatar: agent.avatar,
                            message: agent.greeting,
                            timestamp: new Date().toISOString(),
                            isBot: false,
                            isRealAgent: true
                        };
                        setLiveChatMessages(prev => [...prev, realAgentMsg]);
                    }, 2000);
                }, 500);
            } else {
                // Normal bot response
                const botMsg = {
                    id: Date.now() + 1,
                    sender: 'agent',
                    agentName: 'SIFIXA Assistant',
                    agentAvatar: '🤖',
                    message: smartResponse,
                    timestamp: new Date().toISOString(),
                    isBot: true
                };
                setLiveChatMessages(prev => [...prev, botMsg]);
            }

            // Mark user message as read
            setLiveChatMessages(prev =>
                prev.map(msg => msg.id === userMsg.id ? { ...msg, status: 'read' } : msg)
            );
        }, 1500 + Math.random() * 1000);
    };

    // Quick reply options
    const quickReplies = [
        { icon: '💰', label: 'Pricing', message: 'What are your prices?' },
        { icon: '📍', label: 'Location', message: 'Where are you located?' },
        { icon: '⏰', label: 'Hours', message: 'What are your hours?' },
        { icon: '🔧', label: 'Services', message: 'What services do you offer?' },
        { icon: '📱', label: 'My Repair', message: 'What is the status of my repair?' },
        { icon: '👤', label: 'Real Agent', message: 'I want to speak with a real agent' }
    ];

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setChatAttachment({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    preview: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };


    const getWarrantyStatus = (warranty) => {
        const today = new Date();
        const expiry = new Date(warranty.warrantyExpiry);
        const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) return { status: 'expired', label: 'Expired', color: 'red' };
        if (daysRemaining <= 14) return { status: 'expiring', label: `${daysRemaining} days left`, color: 'orange' };
        return { status: 'active', label: `${daysRemaining} days left`, color: 'green' };
    };

    const getCardIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'visa': return '💳';
            case 'mastercard': return '💳';
            case 'amex': return '💳';
            default: return '💳';
        }
    };

    if (!user) {
        return (
            <div className="customer-profile-page" role="main" aria-label="Customer Profile">
                <div className="profile-container">
                    <div className="not-logged-in">
                        <User size={48} aria-hidden="true" />
                        <h2>Please Log In</h2>
                        <p>You need to be logged in to view your profile.</p>
                        <Link to="/login">
                            <Button variant="primary">Go to Login</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-profile-page">
            {/* Mobile Menu Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`profile-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                    <X size={20} />
                </div>
                <div className="profile-header">
                    <Link to="/" className="back-link">
                        <Home size={18} /> Home
                    </Link>
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar" style={{ borderColor: getTierColor(loyalty?.tier) }}>
                            {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </div>
                    </div>
                    {loyalty && (
                        <div className="tier-badge-container">
                            <span className={`tier-badge ${loyalty.tier.toLowerCase()}`}>
                                <Crown size={12} /> {loyalty.tier}
                            </span>
                        </div>
                    )}
                    <h2>{user.name || user.username}</h2>
                    <p className="profile-email">{user.email}</p>
                </div>

                <nav className="profile-nav" role="navigation" aria-label="Profile navigation">
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} aria-current={activeTab === 'overview' ? 'page' : undefined}>
                        <Home size={18} aria-hidden="true" /> <span>Overview</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }} aria-current={activeTab === 'profile' ? 'page' : undefined}>
                        <User size={18} aria-hidden="true" /> <span>Profile</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => { setActiveTab('bookings'); setSidebarOpen(false); }} aria-current={activeTab === 'bookings' ? 'page' : undefined}>
                        <Calendar size={18} aria-hidden="true" /> <span>My Bookings</span>
                        {activeBookings.length > 0 && <span className="badge" aria-label={`${activeBookings.length} active`}>{activeBookings.length}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'warranties' ? 'active' : ''}`} onClick={() => { setActiveTab('warranties'); setSidebarOpen(false); }} aria-current={activeTab === 'warranties' ? 'page' : undefined}>
                        <ShieldCheck size={18} aria-hidden="true" /> <span>Warranties</span>
                        {warranties.filter(w => w.status === 'active').length > 0 && <span className="badge subtle">{warranties.filter(w => getWarrantyStatus(w).status !== 'expired').length}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }} aria-current={activeTab === 'notifications' ? 'page' : undefined}>
                        <Bell size={18} aria-hidden="true" /> <span>Notifications</span>
                        {unreadCount > 0 && <span className="badge alert" aria-label={`${unreadCount} unread`}>{unreadCount}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => { setActiveTab('loyalty'); setSidebarOpen(false); }} aria-current={activeTab === 'loyalty' ? 'page' : undefined}>
                        <Award size={18} aria-hidden="true" /> <span>Rewards & Referrals</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`} onClick={() => { setActiveTab('devices'); setSidebarOpen(false); }} aria-current={activeTab === 'devices' ? 'page' : undefined}>
                        <Smartphone size={18} aria-hidden="true" /> <span>My Devices</span>
                        {devices.length > 0 && <span className="badge subtle">{devices.length}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => { setActiveTab('invoices'); setSidebarOpen(false); }} aria-current={activeTab === 'invoices' ? 'page' : undefined}>
                        <Receipt size={18} aria-hidden="true" /> <span>Invoices</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => { setActiveTab('reviews'); setSidebarOpen(false); }} aria-current={activeTab === 'reviews' ? 'page' : undefined}>
                        <Star size={18} aria-hidden="true" /> <span>My Reviews</span>
                        {reviewableBookings.length > 0 && <span className="badge alert">{reviewableBookings.length}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }} aria-current={activeTab === 'settings' ? 'page' : undefined}>
                        <Settings size={18} aria-hidden="true" /> <span>Settings</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <ThemeToggle />
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="profile-main">
                {loading ? (
                    <div className="loading-skeleton-container">
                        {activeTab === 'overview' && <SkeletonOverview />}
                        {activeTab === 'notifications' && <SkeletonNotifications count={5} />}
                        {activeTab === 'devices' && <SkeletonDeviceGrid count={4} />}
                        {['bookings', 'warranties', 'invoices', 'reviews'].includes(activeTab) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <SkeletonCard showActions />
                                <SkeletonCard showActions />
                                <SkeletonCard />
                            </div>
                        )}
                        {['profile', 'loyalty', 'settings'].includes(activeTab) && (
                            <div className="loading-state"><RefreshCw size={24} className="spin" /> Loading...</div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="overview-section">
                                {/* Welcome Hero with Time-based Greeting */}
                                <motion.div
                                    className="welcome-hero"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="hero-content">
                                        <div className="greeting-icon">
                                            {new Date().getHours() < 17 ? '☀️' : '🌙'}
                                        </div>
                                        <div className="welcome-text">
                                            <h1>{getTimeGreeting()}, {user.name?.split(' ')[0] || user.username}!</h1>
                                            <p>Here's your repair dashboard at a glance</p>
                                        </div>
                                    </div>
                                    {loyalty && (
                                        <motion.div
                                            className="loyalty-badge"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            style={{ background: `linear-gradient(135deg, ${getTierColor(loyalty.tier)}30, ${getTierColor(loyalty.tier)}50)` }}
                                        >
                                            <Crown size={24} style={{ color: getTierColor(loyalty.tier) }} />
                                            <div className="loyalty-info">
                                                <span className="tier-name">{loyalty.tier}</span>
                                                <span className="points-count">{loyalty.points} pts</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Stats Cards */}
                                <div className="stats-cards">
                                    {[
                                        { icon: <Package size={24} />, value: bookings.length, label: 'Total Repairs', color: 'blue' },
                                        { icon: <Clock3 size={24} />, value: activeBookings.length, label: 'Active', color: 'orange' },
                                        { icon: <CheckCircle size={24} />, value: completedBookings.length, label: 'Completed', color: 'green' },
                                        { icon: <Star size={24} />, value: loyalty?.points || 0, label: 'Points', color: 'purple' }
                                    ].map((stat, index) => (
                                        <motion.div
                                            key={stat.label}
                                            className="stat-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                                            whileHover={{ scale: 1.02, y: -4 }}
                                        >
                                            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
                                            <div className="stat-info">
                                                <span className="stat-value">{stat.value}</span>
                                                <span className="stat-label">{stat.label}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Notification Alert */}
                                {unreadCount > 0 && (
                                    <motion.div
                                        className="notification-alert"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setActiveTab('notifications')}
                                    >
                                        <div className="alert-icon">
                                            <Bell size={20} />
                                            <span className="alert-count">{unreadCount}</span>
                                        </div>
                                        <span>You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</span>
                                        <ChevronRight size={18} />
                                    </motion.div>
                                )}

                                {/* Two Column Layout */}
                                <div className="overview-grid">
                                    {/* Left Column - Active Repairs with Progress */}
                                    <motion.div
                                        className="overview-card repairs-tracker"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="card-title">
                                            <Package size={20} />
                                            <h3>Active Repairs</h3>
                                            {activeBookings.length > 0 && (
                                                <span className="count-badge">{activeBookings.length}</span>
                                            )}
                                        </div>

                                        {activeBookings.length === 0 ? (
                                            <div className="empty-card-state">
                                                <CheckCircle size={40} />
                                                <p>No active repairs</p>
                                                <Link to="/booking">
                                                    <Button variant="primary">Book a Repair</Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="repairs-tracker-list">
                                                {activeBookings.slice(0, 3).map((booking, idx) => {
                                                    const progress = getRepairProgress(booking.status);
                                                    return (
                                                        <motion.div
                                                            key={booking.id}
                                                            className="repair-tracker-item"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.4 + idx * 0.1 }}
                                                        >
                                                            <div className="repair-header">
                                                                <div className="device-info">
                                                                    <Smartphone size={18} />
                                                                    <div>
                                                                        <h4>{getDeviceName(booking.device)}</h4>
                                                                        <span className="issue">{booking.issue}</span>
                                                                    </div>
                                                                </div>
                                                                <span className={`status-pill ${booking.status.toLowerCase().replace(' ', '-')}`}>
                                                                    {booking.status}
                                                                </span>
                                                            </div>
                                                            <div className="progress-tracker">
                                                                <div className="progress-bar-track">
                                                                    <motion.div
                                                                        className="progress-bar-fill"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${progress.percent}%` }}
                                                                        transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                                                                    />
                                                                </div>
                                                                <div className="progress-steps">
                                                                    {['Received', 'Confirmed', 'Repairing', 'Ready'].map((step, i) => (
                                                                        <div
                                                                            key={step}
                                                                            className={`progress-step ${progress.step > i ? 'completed' : ''} ${progress.step === i + 1 ? 'active' : ''}`}
                                                                        >
                                                                            <div className="step-dot" />
                                                                            <span>{step}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="repair-footer">
                                                                <span className="repair-date"><Calendar size={14} /> {booking.date}</span>
                                                                <button
                                                                    className="view-details-btn"
                                                                    onClick={() => setActiveTab('bookings')}
                                                                >
                                                                    View Details <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Right Column */}
                                    <div className="overview-right-col">
                                        {/* Quick Actions */}
                                        <motion.div
                                            className="overview-card quick-actions-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <div className="card-title">
                                                <Settings size={20} />
                                                <h3>Quick Actions</h3>
                                            </div>
                                            <div className="quick-actions-list">
                                                <Link to="/booking" className="quick-action-item">
                                                    <div className="action-icon blue"><Package size={18} /></div>
                                                    <span>Book Repair</span>
                                                    <ChevronRight size={16} />
                                                </Link>
                                                <Link to="/track" className="quick-action-item">
                                                    <div className="action-icon orange"><Clock size={18} /></div>
                                                    <span>Track Order</span>
                                                    <ChevronRight size={16} />
                                                </Link>
                                                <button className="quick-action-item" onClick={() => setActiveTab('messages')}>
                                                    <div className="action-icon green"><MessageSquare size={18} /></div>
                                                    <span>Contact Support</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                                <button className="quick-action-item" onClick={() => setActiveTab('loyalty')}>
                                                    <div className="action-icon purple"><Gift size={18} /></div>
                                                    <span>Redeem Points</span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </motion.div>

                                        {/* Upcoming Appointments */}
                                        <motion.div
                                            className="overview-card appointments-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <div className="card-title">
                                                <Calendar size={20} />
                                                <h3>Upcoming</h3>
                                            </div>
                                            {activeBookings.filter(b => b.status === 'Confirmed').length === 0 ? (
                                                <div className="no-appointments">
                                                    <Calendar size={32} />
                                                    <p>No upcoming appointments</p>
                                                </div>
                                            ) : (
                                                <div className="appointments-list">
                                                    {activeBookings.filter(b => b.status === 'Confirmed').slice(0, 2).map(booking => (
                                                        <div key={booking.id} className="appointment-item">
                                                            <div className="appointment-date">
                                                                <span className="day">{new Date(booking.date).getDate()}</span>
                                                                <span className="month">{new Date(booking.date).toLocaleString('default', { month: 'short' })}</span>
                                                            </div>
                                                            <div className="appointment-info">
                                                                <h4>{getDeviceName(booking.device)}</h4>
                                                                <span>{booking.time || 'Morning'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Recent Activity */}
                                        <motion.div
                                            className="overview-card activity-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <div className="card-title">
                                                <TrendingUp size={20} />
                                                <h3>Recent Activity</h3>
                                            </div>
                                            <div className="activity-timeline">
                                                {notifications.slice(0, 4).map((notif, idx) => (
                                                    <div key={notif.id} className={`activity-item ${!notif.read ? 'unread' : ''}`}>
                                                        <div className="activity-dot" />
                                                        <div className="activity-content">
                                                            <p>{notif.title}</p>
                                                            <span className="activity-time">
                                                                {new Date(notif.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {notifications.length === 0 && (
                                                    <div className="no-activity">
                                                        <p>No recent activity</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="profile-section">
                                <div className="section-header">
                                    <h1>My Profile</h1>
                                </div>

                                <div className="profile-grid">
                                    <div className="profile-card main-info">
                                        <div className="card-header">
                                            <h3><User size={18} /> Personal Information</h3>
                                            <Button variant="secondary" onClick={() => setShowProfileModal(true)}>
                                                <Edit2 size={14} /> Edit
                                            </Button>
                                        </div>

                                        {/* Profile Photo Section */}
                                        <div className="profile-photo-section">
                                            <div className="profile-photo-large">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} />
                                                ) : (
                                                    <span>{user.name?.charAt(0) || user.username?.charAt(0) || 'U'}</span>
                                                )}
                                            </div>
                                            <div className="photo-actions">
                                                <Button variant="secondary" size="small">
                                                    <Camera size={14} /> Change Photo
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">Full Name</span>
                                                <span className="value">{user.name || 'Not set'}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Username</span>
                                                <span className="value">@{user.username}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Email</span>
                                                <span className="value">{user.email || 'Not set'}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Phone</span>
                                                <span className="value">{user.phone || customerData?.phone || 'Not set'}</span>
                                            </div>
                                            <div className="info-item full-width">
                                                <span className="label">Address</span>
                                                <span className="value">{customerData?.address || user.address || 'Not set'}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Member Since</span>
                                                <span className="value">
                                                    {user.verifiedAt
                                                        ? new Date(user.verifiedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                                        : 'December 2024'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="profile-card security-info">
                                        <div className="card-header">
                                            <h3><Shield size={18} /> Security & Session</h3>
                                        </div>
                                        <div className="security-item">
                                            <div>
                                                <span className="label">Password</span>
                                                <span className="value">••••••••</span>
                                            </div>
                                            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
                                                Change
                                            </Button>
                                        </div>
                                        <div className="security-details">
                                            <div className="security-detail-item">
                                                <Clock size={14} />
                                                <span className="label">Last Login</span>
                                                <span className="value">
                                                    {user.lastLoginTime
                                                        ? new Date(user.lastLoginTime).toLocaleString()
                                                        : 'Current session'}
                                                </span>
                                            </div>
                                            <div className="security-detail-item">
                                                <Shield size={14} />
                                                <span className="label">Session Status</span>
                                                <span className="value session-active">Active & Secure</span>
                                            </div>
                                        </div>
                                        {user.verified && (
                                            <div className="verified-badge">
                                                <CheckCircle size={16} /> Email Verified
                                            </div>
                                        )}
                                    </div>

                                    <div className="profile-card membership-info">
                                        <div className="card-header">
                                            <h3><Award size={18} /> Membership</h3>
                                        </div>
                                        {loyalty && (
                                            <div className="membership-details">
                                                <div className="tier-display" style={{ background: `linear-gradient(135deg, ${getTierColor(loyalty.tier)}30, ${getTierColor(loyalty.tier)}50)` }}>
                                                    <Crown size={32} style={{ color: getTierColor(loyalty.tier) }} />
                                                    <div>
                                                        <span className="tier-name">{loyalty.tier}</span>
                                                        <span className="tier-points">{loyalty.lifetimePoints} lifetime pts</span>
                                                    </div>
                                                </div>
                                                <div className="tier-progress">
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${loyalty.tierProgress}%`, background: getTierColor(loyalty.tier) }}></div>
                                                    </div>
                                                    <span className="progress-text">{loyalty.tierProgress}% to next tier</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="profile-card stats-info">
                                        <div className="card-header">
                                            <h3><TrendingUp size={18} /> Account Stats</h3>
                                        </div>
                                        <div className="account-stats">
                                            <div className="stat">
                                                <span className="stat-value">{bookings.length}</span>
                                                <span className="stat-label">Total Repairs</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-value">{loyalty?.points || 0}</span>
                                                <span className="stat-label">Points Earned</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-value">{devices.length}</span>
                                                <span className="stat-label">Saved Devices</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-value">{customerData?.lastVisit || 'N/A'}</span>
                                                <span className="stat-label">Last Visit</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BOOKINGS TAB */}
                        {activeTab === 'bookings' && (
                            <div className="bookings-section">
                                <div className="section-header">
                                    <h1>My Bookings</h1>
                                    <Link to="/booking">
                                        <Button variant="primary"><Plus size={16} /> Book New Repair</Button>
                                    </Link>
                                </div>

                                {bookings.length === 0 ? (
                                    <div className="empty-state">
                                        <Package size={48} />
                                        <h3>No bookings yet</h3>
                                        <p>You haven't made any repair bookings yet.</p>
                                        <Link to="/booking">
                                            <Button variant="primary">Book Your First Repair</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {activeBookings.length > 0 && (
                                            <div className="bookings-group">
                                                <h3 className="group-title"><Clock3 size={18} /> Active Bookings</h3>
                                                <div className="bookings-list">
                                                    {activeBookings.map(booking => (
                                                        <div key={booking.id} className="booking-card active">
                                                            <div className="booking-header">
                                                                <div className="booking-device">
                                                                    <h3>{getDeviceName(booking.device)}</h3>
                                                                    <span className={`status-badge ${booking.status.toLowerCase().replace(' ', '-')}`}>
                                                                        {getStatusIcon(booking.status)} {booking.status}
                                                                    </span>
                                                                </div>
                                                                <span className="booking-id">#{booking.id}</span>
                                                            </div>
                                                            <div className="booking-details">
                                                                <div className="detail"><span className="label">Service</span><span className="value">{booking.issue}</span></div>
                                                                <div className="detail"><span className="label">Date</span><span className="value">{booking.date}</span></div>
                                                                <div className="detail"><span className="label">Time</span><span className="value">{booking.time}</span></div>
                                                                {booking.costEstimate && (
                                                                    <div className="detail"><span className="label">Estimate</span><span className="value">${booking.costEstimate}</span></div>
                                                                )}
                                                            </div>
                                                            <div className="booking-actions">
                                                                <Button variant="secondary" onClick={() => { setSelectedBooking(booking); setShowRescheduleModal(true); }}>
                                                                    <Calendar size={14} /> Reschedule
                                                                </Button>
                                                                <Button variant="danger" onClick={() => handleCancelBooking(booking.id)}>
                                                                    <XCircle size={14} /> Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {completedBookings.length > 0 && (
                                            <div className="bookings-group">
                                                <h3 className="group-title"><CheckCircle size={18} /> Past Bookings</h3>
                                                <div className="bookings-list past">
                                                    {completedBookings.map(booking => (
                                                        <div key={booking.id} className="booking-card past">
                                                            <div className="booking-header">
                                                                <div className="booking-device">
                                                                    <h3>{getDeviceName(booking.device)}</h3>
                                                                    <span className="status-badge completed"><CheckCircle size={14} /> Completed</span>
                                                                </div>
                                                                <span className="booking-id">#{booking.id}</span>
                                                            </div>
                                                            <div className="booking-details compact">
                                                                <span>{booking.issue}</span>
                                                                <span>{booking.date}</span>
                                                                {booking.costEstimate && <span>${booking.costEstimate}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="notifications-section">
                                <div className="section-header">
                                    <h1>Notifications</h1>
                                    {unreadCount > 0 && (
                                        <Button variant="secondary" onClick={handleMarkAllRead}>
                                            <CheckCircle size={14} /> Mark All Read
                                        </Button>
                                    )}
                                </div>

                                {notifications.length === 0 ? (
                                    <div className="empty-state">
                                        <Bell size={48} />
                                        <h3>No notifications</h3>
                                        <p>You're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="notifications-list">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`notification-item ${notif.type} ${notif.read ? 'read' : 'unread'}`}
                                                onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                                            >
                                                <div className="notif-icon">
                                                    {notif.type === 'repair' && <Package size={20} />}
                                                    {notif.type === 'promotion' && <Gift size={20} />}
                                                    {notif.type === 'system' && <Bell size={20} />}
                                                    {notif.type === 'loyalty' && <Star size={20} />}
                                                </div>
                                                <div className="notif-content">
                                                    <h4>{notif.title}</h4>
                                                    <p>{notif.message}</p>
                                                    <span className="notif-date">{new Date(notif.date).toLocaleString()}</span>
                                                </div>
                                                {!notif.read && <span className="unread-dot"></span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* LOYALTY TAB (Rewards & Referrals) */}
                        {activeTab === 'loyalty' && loyalty && (
                            <div className="loyalty-section">
                                <div className="section-header">
                                    <h1>Rewards & Referrals</h1>
                                    <p className="section-subtitle">Earn points, unlock rewards, and invite friends</p>
                                </div>

                                <div className="loyalty-hero" style={{ background: `linear-gradient(135deg, ${getTierColor(loyalty.tier)}20, ${getTierColor(loyalty.tier)}50)` }}>
                                    <div className="hero-content">
                                        <Crown size={48} style={{ color: getTierColor(loyalty.tier) }} />
                                        <div className="hero-info">
                                            <span className="tier-label">{loyalty.tier} Member</span>
                                            <span className="points-balance">{loyalty.points} <small>points</small></span>
                                        </div>
                                    </div>
                                    <div className="tier-progress-large">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${loyalty.tierProgress}%`, background: getTierColor(loyalty.tier) }}></div>
                                        </div>
                                        <span>{loyalty.tierProgress}% to next tier</span>
                                    </div>
                                </div>

                                <div className="loyalty-grid">
                                    <div className="rewards-section">
                                        <h3><Gift size={18} /> Available Rewards</h3>
                                        <div className="rewards-list">
                                            {loyalty.availableRewards.map(reward => (
                                                <div key={reward.id} className={`reward-card ${loyalty.points >= reward.points ? 'available' : 'locked'}`}>
                                                    <div className="reward-info">
                                                        <h4>{reward.name}</h4>
                                                        <p>{reward.description}</p>
                                                    </div>
                                                    <div className="reward-action">
                                                        <span className="reward-points">{reward.points} pts</span>
                                                        <Button
                                                            variant={loyalty.points >= reward.points ? 'primary' : 'secondary'}
                                                            disabled={loyalty.points < reward.points}
                                                            onClick={() => handleRedeemReward(reward.id)}
                                                        >
                                                            {loyalty.points >= reward.points ? 'Redeem' : 'Locked'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="points-history">
                                        <h3><TrendingUp size={18} /> Points History</h3>
                                        <div className="history-list">
                                            {loyalty.pointsHistory.map(entry => (
                                                <div key={entry.id} className={`history-item ${entry.type}`}>
                                                    <div className="history-info">
                                                        <span className="description">{entry.description}</span>
                                                        <span className="date">{entry.date}</span>
                                                    </div>
                                                    <span className={`points ${entry.points > 0 ? 'positive' : 'negative'}`}>
                                                        {entry.points > 0 ? '+' : ''}{entry.points}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* REFERRAL PROGRAM SECTION */}
                                <div className="referral-divider">
                                    <div className="divider-line"></div>
                                    <span><Share2 size={16} /> Referral Program</span>
                                    <div className="divider-line"></div>
                                </div>

                                {/* Referral Hero */}
                                <div className="referral-hero-pro">
                                    <div className="hero-background">
                                        <div className="hero-pattern"></div>
                                    </div>
                                    <div className="hero-content">
                                        <div className="hero-badge">
                                            <Gift size={20} />
                                            <span>Exclusive Rewards</span>
                                        </div>
                                        <h2>Give $10, Get $15</h2>
                                        <p>Share your unique referral code with friends. When they complete their first repair, they get $10 off and you earn $15 in credits!</p>

                                        <div className="referral-code-container">
                                            <div className="code-label">Your Referral Code</div>
                                            <div className="code-box">
                                                <code>{referralCode || 'LOADING...'}</code>
                                                <button
                                                    className="copy-button"
                                                    onClick={handleCopyReferralCode}
                                                    aria-label="Copy referral code"
                                                >
                                                    <Copy size={18} />
                                                    <span>Copy</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="share-buttons">
                                            <Button variant="secondary" onClick={() => setShowReferralInviteModal(true)}>
                                                <Mail size={16} /> Email Invite
                                            </Button>
                                            <Button variant="secondary" onClick={handleCopyReferralCode}>
                                                <Share2 size={16} /> Share Link
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="hero-illustration">
                                        <div className="illustration-circle">
                                            <Users size={64} />
                                        </div>
                                    </div>
                                </div>

                                {/* Referral Stats */}
                                <div className="referral-stats-pro">
                                    <div className="stat-card-pro">
                                        <div className="stat-icon-wrapper blue">
                                            <Users size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{referrals.length}</span>
                                            <span className="stat-text">Total Referrals</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-pro">
                                        <div className="stat-icon-wrapper green">
                                            <CheckCircle size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{referrals.filter(r => r.status === 'completed').length}</span>
                                            <span className="stat-text">Completed</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-pro">
                                        <div className="stat-icon-wrapper yellow">
                                            <Clock size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{referrals.filter(r => r.status === 'pending').length}</span>
                                            <span className="stat-text">Pending</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-pro">
                                        <div className="stat-icon-wrapper purple">
                                            <DollarSign size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">${referrals.filter(r => r.status === 'completed').length * 15}</span>
                                            <span className="stat-text">Total Earned</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Referrals List */}
                                {referrals.length > 0 && (
                                    <div className="referrals-list-pro">
                                        <div className="list-header">
                                            <h3>Your Referrals</h3>
                                            <span className="referral-count">{referrals.length} total</span>
                                        </div>
                                        <div className="referrals-table">
                                            {referrals.map((ref, index) => (
                                                <motion.div
                                                    key={ref.id}
                                                    className="referral-row"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="referral-user">
                                                        <div className="user-avatar">
                                                            {ref.referredName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="user-info">
                                                            <h4>{ref.referredName}</h4>
                                                            <span>{ref.referredEmail}</span>
                                                        </div>
                                                    </div>
                                                    <div className="referral-date">
                                                        <Calendar size={14} />
                                                        <span>{new Date(ref.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="referral-status-badge">
                                                        <span className={`status-pill ${ref.status}`}>
                                                            {ref.status === 'completed' && <CheckCircle size={14} />}
                                                            {ref.status === 'pending' && <Clock size={14} />}
                                                            {ref.status === 'expired' && <XCircle size={14} />}
                                                            {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className="referral-reward">
                                                        {ref.status === 'completed' ? (
                                                            <span className="reward-earned">+$15</span>
                                                        ) : ref.status === 'pending' ? (
                                                            <span className="reward-pending">Pending</span>
                                                        ) : (
                                                            <span className="reward-expired">-</span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DEVICES TAB */}
                        {activeTab === 'devices' && (
                            <div className="devices-section-pro">
                                <div className="section-header">
                                    <div>
                                        <h1>My Devices</h1>
                                        <p className="section-subtitle">Manage your registered devices for faster service</p>
                                    </div>
                                    <Button variant="primary" onClick={() => { setEditingDevice(null); setShowDeviceModal(true); }}>
                                        <Plus size={16} /> Add Device
                                    </Button>
                                </div>

                                {/* Device Stats Overview */}
                                <div className="device-stats-overview">
                                    <div className="device-stat-card">
                                        <div className="stat-icon-wrapper blue">
                                            <Smartphone size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{devices.filter(d => d.type === 'smartphone').length}</span>
                                            <span className="stat-text">Smartphones</span>
                                        </div>
                                    </div>
                                    <div className="device-stat-card">
                                        <div className="stat-icon-wrapper purple">
                                            <Laptop size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{devices.filter(d => d.type === 'laptop').length}</span>
                                            <span className="stat-text">Laptops</span>
                                        </div>
                                    </div>
                                    <div className="device-stat-card">
                                        <div className="stat-icon-wrapper green">
                                            <Tablet size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{devices.filter(d => d.type === 'tablet').length}</span>
                                            <span className="stat-text">Tablets</span>
                                        </div>
                                    </div>
                                    <div className="device-stat-card">
                                        <div className="stat-icon-wrapper yellow">
                                            <Package size={24} />
                                        </div>
                                        <div className="stat-details">
                                            <span className="stat-number">{devices.length}</span>
                                            <span className="stat-text">Total Devices</span>
                                        </div>
                                    </div>
                                </div>

                                {devices.length === 0 ? (
                                    <div className="empty-state device-empty">
                                        <div className="empty-icon">
                                            <Smartphone size={64} />
                                        </div>
                                        <h3>No Devices Registered</h3>
                                        <p>Register your devices to speed up the booking process and keep track of repair history.</p>
                                        <Button variant="primary" onClick={() => setShowDeviceModal(true)}>
                                            <Plus size={16} /> Add Your First Device
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="devices-grid-pro">
                                        {devices.map((device, index) => (
                                            <motion.div
                                                key={device.id}
                                                className="device-card-pro"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <div className="device-card-header">
                                                    <div className={`device-type-icon ${device.type}`}>
                                                        {device.type === 'laptop' ? <Laptop size={28} /> :
                                                            device.type === 'tablet' ? <Tablet size={28} /> :
                                                                <Smartphone size={28} />}
                                                    </div>
                                                    <div className="device-card-actions">
                                                        <button onClick={() => { setEditingDevice(device); setShowDeviceModal(true); }} title="Edit device" className="action-btn edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteDevice(device.id)} title="Delete device" className="action-btn delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="device-card-content">
                                                    <div className="device-name-row">
                                                        <h3>{device.name}</h3>
                                                        <span className={`device-type-badge ${device.type}`}>
                                                            {device.type === 'smartphone' ? 'Phone' : device.type === 'laptop' ? 'Laptop' : 'Tablet'}
                                                        </span>
                                                    </div>
                                                    <p className="device-model-text">{device.brand} {device.model}</p>

                                                    <div className="device-details-grid">
                                                        {device.color && (
                                                            <div className="device-detail">
                                                                <span className="detail-label">Color</span>
                                                                <span className="detail-value">{device.color}</span>
                                                            </div>
                                                        )}
                                                        <div className="device-detail">
                                                            <span className="detail-label">Added</span>
                                                            <span className="detail-value">{new Date(device.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>

                                                    {device.notes && (
                                                        <div className="device-notes-section">
                                                            <FileText size={14} />
                                                            <span>{device.notes}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="device-card-footer">
                                                    <Link to={`/booking?device=${encodeURIComponent(device.brand + ' ' + device.model)}`} className="book-repair-btn">
                                                        <Calendar size={16} />
                                                        Book Repair
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Device Tips */}
                                <div className="device-tips-section">
                                    <h4><Info size={18} /> Device Management Tips</h4>
                                    <div className="tips-grid">
                                        <div className="tip-card">
                                            <Smartphone size={20} />
                                            <div>
                                                <strong>Keep Info Updated</strong>
                                                <p>Update device details when you upgrade to ensure accurate service quotes.</p>
                                            </div>
                                        </div>
                                        <div className="tip-card">
                                            <Shield size={20} />
                                            <div>
                                                <strong>Track Warranties</strong>
                                                <p>Registered devices are automatically linked to warranty tracking.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INVOICES TAB */}
                        {activeTab === 'invoices' && (
                            <div className="invoices-section">
                                <div className="section-header">
                                    <h1>Invoices & Receipts</h1>
                                </div>

                                {invoices.length === 0 ? (
                                    <div className="empty-state">
                                        <Receipt size={48} />
                                        <h3>No invoices yet</h3>
                                        <p>Your invoices will appear here after completed repairs.</p>
                                    </div>
                                ) : (
                                    <div className="invoices-list">
                                        {invoices.map(invoice => (
                                            <div key={invoice.id} className="invoice-card">
                                                <div className="invoice-main">
                                                    <div className="invoice-id">
                                                        <FileText size={20} />
                                                        <span>{invoice.id}</span>
                                                    </div>
                                                    <div className="invoice-info">
                                                        <span className="invoice-date">{invoice.date}</span>
                                                        <span className={`invoice-status ${invoice.status.toLowerCase()}`}>{invoice.status}</span>
                                                    </div>
                                                </div>
                                                <div className="invoice-summary">
                                                    {invoice.items.map((item, idx) => (
                                                        <span key={idx}>{item.description}</span>
                                                    ))}
                                                </div>
                                                <div className="invoice-footer">
                                                    <span className="invoice-total">${invoice.total.toFixed(2)}</span>
                                                    <div className="invoice-actions">
                                                        <Button variant="secondary" onClick={() => { setSelectedInvoice(invoice); setShowInvoiceModal(true); }}>
                                                            <Eye size={14} /> View
                                                        </Button>
                                                        <Button variant="secondary" onClick={() => generateInvoicePDF(invoice, { name: user.name, email: user.email })}>
                                                            <Download size={14} /> PDF
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* MESSAGES TAB */}
                        {activeTab === 'messages' && (
                            <div className="messages-section">
                                <div className="section-header">
                                    <h1>Support Chat</h1>
                                </div>

                                <div className="chat-container">
                                    <div className="messages-list">
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`message ${msg.type}`}>
                                                <div className="message-bubble">
                                                    <p>{msg.message}</p>
                                                </div>
                                                <span className="message-meta">{msg.sender} • {msg.date}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="message-input">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            aria-label="Type your message"
                                        />
                                        <button onClick={handleSendMessage} aria-label="Send message"><Send size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WARRANTIES TAB */}
                        {activeTab === 'warranties' && (
                            <div className="warranties-section">
                                <div className="section-header">
                                    <h1>Warranty Tracker</h1>
                                    <p className="section-subtitle">Monitor and manage warranties for all your repaired devices</p>
                                </div>

                                {/* Warranty Overview Stats */}
                                <div className="warranty-overview-stats">
                                    <div className="warranty-stat-card">
                                        <div className="stat-icon active">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">{warranties.filter(w => getWarrantyStatus(w).status === 'active').length}</span>
                                            <span className="stat-label">Active Warranties</span>
                                        </div>
                                    </div>
                                    <div className="warranty-stat-card">
                                        <div className="stat-icon expiring">
                                            <Clock size={24} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">{warranties.filter(w => getWarrantyStatus(w).status === 'expiring').length}</span>
                                            <span className="stat-label">Expiring Soon</span>
                                        </div>
                                    </div>
                                    <div className="warranty-stat-card">
                                        <div className="stat-icon total">
                                            <FileText size={24} />
                                        </div>
                                        <div className="stat-content">
                                            <span className="stat-value">{warranties.length}</span>
                                            <span className="stat-label">Total Warranties</span>
                                        </div>
                                    </div>
                                </div>

                                {warranties.length === 0 ? (
                                    <div className="empty-state warranty-empty">
                                        <div className="empty-icon">
                                            <ShieldCheck size={64} />
                                        </div>
                                        <h3>No Warranties Yet</h3>
                                        <p>When you complete a repair with us, your warranty information will appear here. All repairs include our standard 90-day warranty.</p>
                                        <Button variant="primary" onClick={() => navigate('/booking')}>
                                            <Calendar size={16} /> Book a Repair
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="warranties-list">
                                        {warranties.map(warranty => {
                                            const status = getWarrantyStatus(warranty);
                                            const daysRemaining = Math.max(0, Math.ceil((new Date(warranty.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24)));
                                            const progressPercent = Math.min(100, Math.max(0, (daysRemaining / warranty.warrantyDays) * 100));

                                            return (
                                                <motion.div
                                                    key={warranty.id}
                                                    className={`warranty-card-pro ${status.status}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="warranty-card-header">
                                                        <div className="warranty-device-info">
                                                            <div className={`device-icon ${status.status}`}>
                                                                {warranty.deviceType === 'laptop' ? <Laptop size={24} /> :
                                                                    warranty.deviceType === 'tablet' ? <Tablet size={24} /> :
                                                                        <Smartphone size={24} />}
                                                            </div>
                                                            <div className="device-details">
                                                                <h3>{warranty.deviceName}</h3>
                                                                <span className="service-type">{warranty.serviceName}</span>
                                                            </div>
                                                        </div>
                                                        <div className={`warranty-badge ${status.status}`}>
                                                            {status.status === 'active' && <ShieldCheck size={14} />}
                                                            {status.status === 'expiring' && <AlertCircle size={14} />}
                                                            {status.status === 'expired' && <XCircle size={14} />}
                                                            {status.label}
                                                        </div>
                                                    </div>

                                                    <div className="warranty-progress-section">
                                                        <div className="progress-header">
                                                            <span className="progress-label">Warranty Period</span>
                                                            <span className="progress-days">
                                                                {status.status === 'expired' ? 'Expired' : `${daysRemaining} days remaining`}
                                                            </span>
                                                        </div>
                                                        <div className="warranty-progress-bar">
                                                            <div
                                                                className={`progress-fill ${status.status}`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="warranty-info-grid">
                                                        <div className="info-item">
                                                            <Calendar size={16} />
                                                            <div>
                                                                <span className="info-label">Repair Date</span>
                                                                <span className="info-value">{new Date(warranty.repairDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        </div>
                                                        <div className="info-item">
                                                            <Clock size={16} />
                                                            <div>
                                                                <span className="info-label">Expiry Date</span>
                                                                <span className="info-value">{new Date(warranty.warrantyExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        </div>
                                                        <div className="info-item">
                                                            <Shield size={16} />
                                                            <div>
                                                                <span className="info-label">Coverage Period</span>
                                                                <span className="info-value">{warranty.warrantyDays} Days</span>
                                                            </div>
                                                        </div>
                                                        <div className="info-item">
                                                            <FileText size={16} />
                                                            <div>
                                                                <span className="info-label">Warranty ID</span>
                                                                <span className="info-value">#{warranty.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {warranty.coverage && warranty.coverage.length > 0 && (
                                                        <div className="warranty-coverage-section">
                                                            <h4><CheckCircle size={16} /> What's Covered</h4>
                                                            <div className="coverage-grid">
                                                                {warranty.coverage.map((item, i) => (
                                                                    <div key={i} className="coverage-item">
                                                                        <CheckCircle size={14} />
                                                                        <span>{item}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="warranty-card-footer">
                                                        {status.status === 'active' && (
                                                            <Button
                                                                variant="primary"
                                                                onClick={() => { setSelectedWarranty(warranty); setShowWarrantyClaimModal(true); }}
                                                            >
                                                                <AlertCircle size={16} /> File a Warranty Claim
                                                            </Button>
                                                        )}
                                                        {status.status === 'expiring' && (
                                                            <>
                                                                <div className="expiring-notice">
                                                                    <AlertCircle size={16} />
                                                                    <span>Your warranty expires in {daysRemaining} days</span>
                                                                </div>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() => { setSelectedWarranty(warranty); setShowWarrantyClaimModal(true); }}
                                                                >
                                                                    <AlertCircle size={16} /> File a Claim
                                                                </Button>
                                                            </>
                                                        )}
                                                        {status.status === 'expired' && (
                                                            <div className="expired-notice">
                                                                <XCircle size={16} />
                                                                <span>This warranty has expired. Contact support for repair options.</span>
                                                            </div>
                                                        )}
                                                        <Button variant="secondary" onClick={() => navigate('/booking')}>
                                                            <RefreshCw size={16} /> Book New Repair
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Warranty Info Footer */}
                                <div className="warranty-info-footer">
                                    <div className="info-card">
                                        <ShieldCheck size={20} />
                                        <div>
                                            <h4>Our Warranty Promise</h4>
                                            <p>All repairs come with a minimum 90-day warranty. Screen replacements include a 6-month warranty on parts and labor.</p>
                                        </div>
                                    </div>
                                    <div className="info-card">
                                        <Headphones size={20} />
                                        <div>
                                            <h4>Need Help?</h4>
                                            <p>Contact our support team for warranty questions or to file a claim by phone.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PAYMENT METHODS TAB */}
                        {activeTab === 'payments' && (
                            <div className="payments-section">
                                <div className="section-header">
                                    <h1>Payment Methods</h1>
                                    <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
                                        <Plus size={16} /> Add Card
                                    </Button>
                                </div>

                                <div className="security-notice">
                                    <Lock size={18} />
                                    <p>Your payment information is encrypted and securely stored. We never store your full card number.</p>
                                </div>

                                {paymentMethods.length === 0 ? (
                                    <div className="empty-state">
                                        <CreditCard size={48} />
                                        <h3>No payment methods</h3>
                                        <p>Add a payment method for faster checkout.</p>
                                        <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
                                            <Plus size={16} /> Add Payment Method
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="payment-methods-list">
                                        {paymentMethods.map(method => (
                                            <div key={method.id} className={`payment-card ${method.isDefault ? 'default' : ''}`}>
                                                <div className="card-visual">
                                                    <span className="card-type">{method.type?.toUpperCase()}</span>
                                                    <span className="card-number">•••• •••• •••• {method.last4}</span>
                                                    <span className="card-expiry">{method.expiryMonth}/{method.expiryYear}</span>
                                                </div>
                                                <div className="card-info">
                                                    <span className="cardholder">{method.cardholderName}</span>
                                                    {method.isDefault && <span className="default-badge">Default</span>}
                                                </div>
                                                <div className="card-actions">
                                                    {!method.isDefault && (
                                                        <Button variant="secondary" onClick={() => handleSetDefaultPayment(method.id)}>
                                                            Set Default
                                                        </Button>
                                                    )}
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => handleRemovePaymentMethod(method.id)}
                                                        aria-label="Remove payment method"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="reviews-section">
                                <div className="section-header">
                                    <h1>My Reviews</h1>
                                </div>

                                {reviewableBookings.length > 0 && (
                                    <div className="pending-reviews">
                                        <h3><Star size={18} /> Pending Reviews</h3>
                                        <p>Share your experience! These repairs are waiting for your feedback.</p>
                                        <div className="reviewable-list">
                                            {reviewableBookings.map(booking => (
                                                <div key={booking.id} className="reviewable-item">
                                                    <div className="item-info">
                                                        <h4>{getDeviceName(booking.device)}</h4>
                                                        <span>{booking.issue}</span>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => { setSelectedBookingForReview(booking); setShowReviewModal(true); }}
                                                    >
                                                        Write Review
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {reviews.length === 0 && reviewableBookings.length === 0 ? (
                                    <div className="empty-state">
                                        <Star size={48} />
                                        <h3>No reviews yet</h3>
                                        <p>After completing a repair, you can leave a review here.</p>
                                    </div>
                                ) : reviews.length > 0 && (
                                    <div className="reviews-list">
                                        <h3>Your Reviews</h3>
                                        {reviews.map(review => (
                                            <div key={review.id} className="review-card">
                                                <div className="review-header">
                                                    <div className="review-service">
                                                        <h4>{review.deviceName}</h4>
                                                        <span>{review.serviceName}</span>
                                                    </div>
                                                    <div className="review-rating">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star
                                                                key={star}
                                                                size={18}
                                                                fill={star <= review.rating ? '#fbbf24' : 'none'}
                                                                color={star <= review.rating ? '#fbbf24' : '#94a3b8'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <h5>{review.title}</h5>
                                                <p>{review.comment}</p>
                                                <div className="review-footer">
                                                    <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
                                                    {review.wouldRecommend && (
                                                        <span className="would-recommend">
                                                            <ThumbsUp size={14} /> Would recommend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MESSAGES TAB */}
                        {activeTab === 'messages' && (
                            <div className="messages-section">
                                <div className="section-header">
                                    <h1>Messages</h1>
                                    <button className="add-btn" onClick={() => setLiveChatOpen(true)}>
                                        <Plus size={20} /> New Chat
                                    </button>
                                </div>

                                <div className="messages-container">
                                    {liveChatMessages.length === 0 ? (
                                        <div className="empty-messages">
                                            <div className="empty-icon">💬</div>
                                            <h3>No messages yet</h3>
                                            <p>Start a conversation with our support team</p>
                                            <button className="start-chat-btn" onClick={() => setLiveChatOpen(true)}>
                                                <MessageSquare size={18} /> Start Chat
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="conversation-view">
                                            <div className="conversation-header">
                                                <div className="conversation-info">
                                                    <span className="conversation-icon">💬</span>
                                                    <div>
                                                        <h3>Support Conversation</h3>
                                                        <span className="conversation-status online">Active</span>
                                                    </div>
                                                </div>
                                                <span className="message-count">{liveChatMessages.length} messages</span>
                                            </div>

                                            <div className="messages-list">
                                                {liveChatMessages.map(msg => (
                                                    <motion.div
                                                        key={msg.id}
                                                        className={`message-item ${msg.sender}`}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                    >
                                                        <div className="message-avatar">
                                                            {msg.sender === 'customer'
                                                                ? (user.name?.charAt(0) || 'U')
                                                                : (msg.agentAvatar || '🤖')
                                                            }
                                                        </div>
                                                        <div className="message-body">
                                                            <div className="message-header">
                                                                <span className="message-sender">
                                                                    {msg.sender === 'customer'
                                                                        ? 'You'
                                                                        : (msg.agentName || 'Support')
                                                                    }
                                                                </span>
                                                                {msg.isRealAgent && (
                                                                    <span className="real-agent-badge">Support Agent</span>
                                                                )}
                                                                {msg.isBot && (
                                                                    <span className="bot-badge">Bot</span>
                                                                )}
                                                                <span className="message-timestamp">
                                                                    {new Date(msg.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {msg.attachment && (
                                                                <div className="message-attachment-preview">
                                                                    {msg.attachment.type?.startsWith('image/') ? (
                                                                        <img src={msg.attachment.preview} alt="Attachment" />
                                                                    ) : (
                                                                        <div className="file-preview-item">
                                                                            <FileText size={16} />
                                                                            <span>{msg.attachment.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <p className="message-text">{msg.message}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <div className="conversation-actions">
                                                <button className="open-chat-btn" onClick={() => setLiveChatOpen(true)}>
                                                    <Send size={18} /> Continue Chat
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SETTINGS TAB */}
                        {activeTab === 'settings' && customerSettings && (
                            <div className="settings-section">
                                <div className="section-header">
                                    <h1>Settings</h1>
                                </div>

                                <div className="settings-grid">
                                    {/* Notification Settings */}
                                    <div className="settings-card">
                                        <div className="card-header">
                                            <h3><Bell size={18} /> Notification Preferences</h3>
                                        </div>
                                        <div className="settings-list">
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Email - Repair Updates</span>
                                                    <span className="setting-desc">Get notified about your repair status</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.notifications?.emailRepairUpdates}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            notifications: { ...customerSettings.notifications, emailRepairUpdates: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Email - Promotions</span>
                                                    <span className="setting-desc">Receive special offers and discounts</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.notifications?.emailPromotions}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            notifications: { ...customerSettings.notifications, emailPromotions: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">SMS - Repair Updates</span>
                                                    <span className="setting-desc">Text message notifications</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.notifications?.smsRepairUpdates}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            notifications: { ...customerSettings.notifications, smsRepairUpdates: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Push Notifications</span>
                                                    <span className="setting-desc">Browser push notifications</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.notifications?.pushNotifications}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            notifications: { ...customerSettings.notifications, pushNotifications: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reminder Settings */}
                                    <div className="settings-card">
                                        <div className="card-header">
                                            <h3><Clock size={18} /> Appointment Reminders</h3>
                                        </div>
                                        <div className="settings-list">
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Reminder Time</span>
                                                    <span className="setting-desc">When to send appointment reminders</span>
                                                </div>
                                                <select
                                                    value={customerSettings.reminders?.appointmentReminder || '24h'}
                                                    onChange={(e) => handleUpdateSettings({
                                                        ...customerSettings,
                                                        reminders: { ...customerSettings.reminders, appointmentReminder: e.target.value }
                                                    })}
                                                    className="setting-select"
                                                >
                                                    <option value="1h">1 hour before</option>
                                                    <option value="3h">3 hours before</option>
                                                    <option value="24h">24 hours before</option>
                                                    <option value="48h">48 hours before</option>
                                                </select>
                                            </div>
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Pickup Reminders</span>
                                                    <span className="setting-desc">Remind me when repair is ready</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.reminders?.pickupReminder}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            reminders: { ...customerSettings.reminders, pickupReminder: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Privacy Settings */}
                                    <div className="settings-card">
                                        <div className="card-header">
                                            <h3><Shield size={18} /> Privacy</h3>
                                        </div>
                                        <div className="settings-list">
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Analytics</span>
                                                    <span className="setting-desc">Help us improve by sharing usage data</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.privacy?.shareDataForAnalytics}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            privacy: { ...customerSettings.privacy, shareDataForAnalytics: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                            <div className="setting-item">
                                                <div className="setting-info">
                                                    <span className="setting-label">Marketing Calls</span>
                                                    <span className="setting-desc">Allow promotional phone calls</span>
                                                </div>
                                                <label className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={customerSettings.privacy?.allowMarketingCalls}
                                                        onChange={(e) => handleUpdateSettings({
                                                            ...customerSettings,
                                                            privacy: { ...customerSettings.privacy, allowMarketingCalls: e.target.checked }
                                                        })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Support Chat Card */}
                                    <div className="settings-card support-card">
                                        <div className="card-header">
                                            <h3><Headphones size={18} /> Support & Help</h3>
                                        </div>
                                        <div className="settings-list">
                                            <div className="setting-item clickable" onClick={() => setActiveTab('messages')}>
                                                <div className="setting-info">
                                                    <span className="setting-label">Live Support Chat</span>
                                                    <span className="setting-desc">Chat with our support team in real-time</span>
                                                </div>
                                                <ChevronRight size={20} className="chevron-icon" />
                                            </div>
                                            <div className="setting-item clickable" onClick={() => setLiveChatOpen(true)}>
                                                <div className="setting-info">
                                                    <span className="setting-label">Quick Chat Widget</span>
                                                    <span className="setting-desc">Open floating chat for quick questions</span>
                                                </div>
                                                <ChevronRight size={20} className="chevron-icon" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* LIVE CHAT WIDGET */}
            <div className={`live-chat-widget ${liveChatOpen ? 'open' : ''}`}>
                <motion.button
                    className="chat-toggle"
                    onClick={() => setLiveChatOpen(!liveChatOpen)}
                    aria-label={liveChatOpen ? 'Close chat' : 'Open live chat'}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={liveChatOpen ? { rotate: 0 } : { rotate: 0 }}
                >
                    {liveChatOpen ? <X size={24} /> : <Headphones size={24} />}
                    {!liveChatOpen && <span className="chat-badge">1</span>}
                </motion.button>

                {liveChatOpen && (
                    <motion.div
                        className="chat-window"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">
                                    <span>🤖</span>
                                    <span className="status-dot online"></span>
                                </div>
                                <div className="chat-header-text">
                                    <h4>SIFIXA Support</h4>
                                    <span className="chat-status-text">
                                        {isTyping ? 'Typing...' : 'Online • Ready to help'}
                                    </span>
                                </div>
                            </div>
                            <button className="chat-close-btn" onClick={() => setLiveChatOpen(false)} aria-label="Close chat">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="chat-messages">
                            {liveChatMessages.length === 0 && (
                                <div className="chat-welcome">
                                    <div className="welcome-icon">💬</div>
                                    <h3>Hi there! 👋</h3>
                                    <p>How can we help you today?</p>
                                </div>
                            )}

                            {liveChatMessages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    className={`chat-message ${msg.sender}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {msg.sender === 'agent' && (
                                        <div className="agent-avatar">
                                            {msg.agentAvatar || '👤'}
                                        </div>
                                    )}
                                    <div className="message-content">
                                        {msg.agentName && <span className="agent-name">{msg.agentName}</span>}
                                        {msg.attachment && (
                                            <div className="message-attachment">
                                                {msg.attachment.type?.startsWith('image/') ? (
                                                    <img src={msg.attachment.preview} alt="Attachment" />
                                                ) : (
                                                    <div className="file-attachment">
                                                        <FileText size={16} />
                                                        <span>{msg.attachment.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {msg.message && <p>{msg.message}</p>}
                                        <div className="message-meta">
                                            <span className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.sender === 'customer' && msg.status && (
                                                <span className={`message-status ${msg.status}`}>
                                                    {msg.status === 'sent' && '✓'}
                                                    {msg.status === 'delivered' && '✓✓'}
                                                    {msg.status === 'read' && <span className="read-check">✓✓</span>}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="chat-message agent typing-indicator">
                                    <div className="agent-avatar">🤖</div>
                                    <div className="message-content typing">
                                        <div className="typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Replies */}
                        {showQuickReplies && liveChatMessages.length === 0 && (
                            <div className="quick-replies">
                                <span className="quick-replies-label">Quick questions:</span>
                                <div className="quick-replies-grid">
                                    {quickReplies.map((reply, idx) => (
                                        <button
                                            key={idx}
                                            className="quick-reply-btn"
                                            onClick={() => handleSendLiveChat(reply.message)}
                                        >
                                            <span className="quick-reply-icon">{reply.icon}</span>
                                            <span>{reply.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File Attachment Preview */}
                        {chatAttachment && (
                            <div className="attachment-preview">
                                {chatAttachment.type?.startsWith('image/') ? (
                                    <img src={chatAttachment.preview} alt="Preview" />
                                ) : (
                                    <div className="file-preview">
                                        <FileText size={20} />
                                        <span>{chatAttachment.name}</span>
                                    </div>
                                )}
                                <button className="remove-attachment" onClick={() => setChatAttachment(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="chat-input-area">
                            <label className="attachment-btn">
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    hidden
                                />
                                <Plus size={20} />
                            </label>
                            <input
                                type="text"
                                value={liveChatInput}
                                onChange={(e) => setLiveChatInput(e.target.value)}
                                placeholder="Type a message..."
                                onKeyPress={(e) => e.key === 'Enter' && handleSendLiveChat()}
                                aria-label="Type a message"
                            />
                            <button
                                className="send-btn"
                                onClick={() => handleSendLiveChat()}
                                aria-label="Send"
                                disabled={!liveChatInput.trim() && !chatAttachment}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* MODALS */}
            {showDeviceModal && (
                <DeviceModal
                    device={editingDevice}
                    onSave={handleSaveDevice}
                    onClose={() => { setShowDeviceModal(false); setEditingDevice(null); }}
                />
            )}

            {showRescheduleModal && selectedBooking && (
                <RescheduleModal
                    booking={selectedBooking}
                    timeSlots={timeSlots}
                    onReschedule={handleReschedule}
                    onClose={() => { setShowRescheduleModal(false); setSelectedBooking(null); }}
                />
            )}

            {showProfileModal && (
                <ProfileModal
                    user={user}
                    customerData={customerData}
                    onSave={async (data) => {
                        await mockApi.updateUserProfile(user.id, data);
                        updateUser({ ...user, ...data });
                        setShowProfileModal(false);
                        loadAllData();
                    }}
                    onClose={() => setShowProfileModal(false)}
                />
            )}

            {showPasswordModal && (
                <PasswordModal
                    userId={user.id}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}

            {showInvoiceModal && selectedInvoice && (
                <InvoiceModal
                    invoice={selectedInvoice}
                    onClose={() => { setShowInvoiceModal(false); setSelectedInvoice(null); }}
                />
            )}

            {showPaymentModal && (
                <PaymentModal
                    paymentMethod={null}
                    onSave={handleSavePaymentMethod}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            {showReviewModal && selectedBookingForReview && (
                <ReviewModal
                    booking={selectedBookingForReview}
                    onSubmit={handleSubmitReview}
                    onClose={() => { setShowReviewModal(false); setSelectedBookingForReview(null); }}
                />
            )}

            {showWarrantyClaimModal && selectedWarranty && (
                <WarrantyClaimModal
                    warranty={selectedWarranty}
                    onSubmit={handleFileWarrantyClaim}
                    onClose={() => { setShowWarrantyClaimModal(false); setSelectedWarranty(null); }}
                />
            )}

            {showReferralInviteModal && (
                <ReferralInviteModal
                    referralCode={referralCode}
                    onSend={handleSendReferralInvite}
                    onClose={() => setShowReferralInviteModal(false)}
                />
            )}
        </div>
    );
};

// ========== MODAL COMPONENTS ==========

const DeviceModal = ({ device, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: device?.name || '',
        type: device?.type || 'smartphone',
        brand: device?.brand || '',
        model: device?.model || '',
        color: device?.color || '',
        serialNumber: device?.serialNumber || '',
        notes: device?.notes || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{device ? 'Edit Device' : 'Add New Device'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Device Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="My iPhone" required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="smartphone">Smartphone</option>
                                <option value="laptop">Laptop</option>
                                <option value="tablet">Tablet</option>
                                <option value="smartwatch">Smartwatch</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Brand</label>
                            <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Apple, Samsung..." required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Model</label>
                            <input type="text" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="iPhone 15, Galaxy S24..." required />
                        </div>
                        <div className="form-group">
                            <label>Color</label>
                            <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="Black, Silver..." />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Serial Number / IMEI (optional)</label>
                        <input type="text" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="For warranty purposes" />
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes..."></textarea>
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit"><Save size={16} /> Save Device</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RescheduleModal = ({ booking, timeSlots, onReschedule, onClose }) => {
    const [newDate, setNewDate] = useState(booking.date);
    const [newTime, setNewTime] = useState(booking.time);
    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content small" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Reschedule Booking</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="reschedule-info">
                    <p><strong>{getDeviceName(booking.device)}</strong> - {booking.issue}</p>
                    <p className="current">Current: {booking.date} ({booking.time})</p>
                </div>
                <div className="form-group">
                    <label>New Date</label>
                    <input type="date" value={newDate} min={minDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>New Time</label>
                    <select value={newTime} onChange={e => setNewTime(e.target.value)}>
                        {timeSlots.map(slot => (
                            <option key={slot.id} value={slot.name}>{slot.name} ({slot.startTime} - {slot.endTime})</option>
                        ))}
                    </select>
                </div>
                <div className="modal-actions">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={() => onReschedule(newDate, newTime)}>
                        <Calendar size={16} /> Confirm Reschedule
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ProfileModal = ({ user, customerData, onSave, onClose }) => {
    // Helper to parse address string if separate fields don't exist
    const parseAddress = (addrString) => {
        if (!addrString) return { street: '', city: '', state: '', zip: '' };
        // Try simple parsing: "Street, City, State Zip"
        const parts = addrString.split(', ');
        if (parts.length >= 2) {
            const street = parts[0];
            const city = parts[1];
            // Last part might be "State Zip" or just State
            const lastPart = parts[2] || '';
            const lastSpaceIndex = lastPart.lastIndexOf(' ');
            let state = lastPart;
            let zip = '';
            if (lastSpaceIndex > 0) {
                state = lastPart.substring(0, lastSpaceIndex);
                zip = lastPart.substring(lastSpaceIndex + 1);
            }
            return { street, city, state, zip };
        }
        return { street: addrString, city: '', state: '', zip: '' };
    };

    const initialAddress = customerData?.address || user.address || '';
    const addressComponents = user.addressComponents || parseAddress(initialAddress);

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || customerData?.phone || '',
        street: addressComponents.street || '',
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        zip: addressComponents.zip || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct full address string for display compatibility
        const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`.replace(/, , /g, ', ').replace(/ {2}/g, ' ').trim();

        onSave({
            ...formData,
            address: fullAddress,
            // Also save individual components for future editing
            addressComponents: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                zip: formData.zip
            }
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group readonly">
                        <label>Username <span className="readonly-badge">Cannot be changed</span></label>
                        <input type="text" value={`@${user.username}`} disabled />
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="555-123-4567" />
                    </div>

                    <div className="form-group">
                        <label>Street Address</label>
                        <input type="text" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} placeholder="123 Main St" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                        </div>
                        <div className="form-group">
                            <label>State</label>
                            <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                        </div>
                        <div className="form-group">
                            <label>Zip Code</label>
                            <input type="text" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} placeholder="Zip" />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit"><Save size={16} /> Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PasswordModal = ({ userId, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await mockApi.changePassword(userId, currentPassword, newPassword);
            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content small" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Change Password</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                {success ? (
                    <div className="success-message">
                        <CheckCircle size={48} />
                        <p>Password changed successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label>Current Password</label>
                            <div className="password-input">
                                <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        <label className="show-password">
                            <input type="checkbox" checked={showPasswords} onChange={() => setShowPasswords(!showPasswords)} />
                            Show passwords
                        </label>
                        <div className="modal-actions">
                            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                            <Button variant="primary" type="submit"><Shield size={16} /> Change Password</Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const InvoiceModal = ({ invoice, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content invoice-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Invoice {invoice.id}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="invoice-details">
                    <div className="invoice-meta">
                        <div><strong>Date:</strong> {invoice.date}</div>
                        <div><strong>Status:</strong> <span className={`status ${invoice.status.toLowerCase()}`}>{invoice.status}</span></div>
                        {invoice.paymentMethod && <div><strong>Payment:</strong> {invoice.paymentMethod}</div>}
                    </div>

                    <table className="invoice-items">
                        <thead>
                            <tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.unitPrice.toFixed(2)}</td>
                                    <td>${item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="invoice-totals">
                        <div className="total-row"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
                        <div className="total-row"><span>Tax</span><span>${invoice.tax.toFixed(2)}</span></div>
                        {invoice.discount > 0 && <div className="total-row discount"><span>Discount</span><span>-${invoice.discount.toFixed(2)}</span></div>}
                        <div className="total-row grand"><span>Total</span><span>${invoice.total.toFixed(2)}</span></div>
                    </div>

                    {invoice.notes && <div className="invoice-notes"><strong>Notes:</strong> {invoice.notes}</div>}
                </div>
                <div className="modal-actions">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button variant="primary"><Download size={16} /> Download PDF</Button>
                </div>
            </div>
        </div>
    );
};

// ========== PAYMENT METHOD MODAL ==========
const PaymentModal = ({ paymentMethod, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        type: paymentMethod?.type || 'credit',
        cardNumber: paymentMethod?.cardNumber || '',
        cardHolder: paymentMethod?.cardHolder || '',
        expiryDate: paymentMethod?.expiryDate || '',
        isDefault: paymentMethod?.isDefault || false
    });
    const [errors, setErrors] = useState({});

    const validateCard = () => {
        const newErrors = {};
        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
            newErrors.cardNumber = 'Card number must be 16 digits';
        }
        if (!formData.cardHolder) {
            newErrors.cardHolder = 'Cardholder name is required';
        }
        if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
            newErrors.expiryDate = 'Expiry date must be MM/YY format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : v;
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateCard()) {
            onSave(formData);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{paymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Card Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="credit">Credit Card</option>
                            <option value="debit">Debit Card</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Card Number</label>
                        <input
                            type="text"
                            value={formData.cardNumber}
                            onChange={e => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                        />
                        {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                    </div>
                    <div className="form-group">
                        <label>Cardholder Name</label>
                        <input
                            type="text"
                            value={formData.cardHolder}
                            onChange={e => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                            placeholder="JOHN DOE"
                            required
                        />
                        {errors.cardHolder && <span className="field-error">{errors.cardHolder}</span>}
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Expiry Date</label>
                            <input
                                type="text"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: formatExpiry(e.target.value) })}
                                placeholder="MM/YY"
                                maxLength={5}
                                required
                            />
                            {errors.expiryDate && <span className="field-error">{errors.expiryDate}</span>}
                        </div>
                        <div className="form-group">
                            <label>CVV</label>
                            <input
                                type="password"
                                placeholder="•••"
                                maxLength={4}
                                required
                            />
                            <small className="form-hint">For verification only, not stored</small>
                        </div>
                    </div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.isDefault}
                            onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                        />
                        Set as default payment method
                    </label>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            <CreditCard size={16} /> {paymentMethod ? 'Update' : 'Add'} Card
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== REVIEW MODAL ==========
const ReviewModal = ({ booking, onSubmit, onClose }) => {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [recommend, setRecommend] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            bookingId: booking.id,
            serviceType: booking.service,
            rating,
            title,
            comment,
            recommend
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Review Your Service</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="review-service-info">
                        <strong>{booking.service}</strong>
                        <span className="text-muted">{getDeviceName(booking.device)} • {booking.date}</span>
                    </div>

                    <div className="form-group">
                        <label>Your Rating</label>
                        <div className="star-rating-input">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} />
                                </button>
                            ))}
                        </div>
                        <span className="rating-text">
                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Review Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Your Review</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Tell us about your experience..."
                            rows={4}
                            required
                        />
                    </div>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={recommend}
                            onChange={e => setRecommend(e.target.checked)}
                        />
                        I would recommend this service to others
                    </label>

                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            <Star size={16} /> Submit Review
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== WARRANTY CLAIM MODAL ==========
const WarrantyClaimModal = ({ warranty, onSubmit, onClose }) => {
    const [issueDescription, setIssueDescription] = useState('');
    const [issueType, setIssueType] = useState('same_issue');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            warrantyId: warranty.id,
            issueType,
            issueDescription
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>File Warranty Claim</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="warranty-claim-info">
                        <div className="info-row">
                            <span>Device:</span>
                            <strong>{warranty.device}</strong>
                        </div>
                        <div className="info-row">
                            <span>Original Service:</span>
                            <strong>{warranty.service}</strong>
                        </div>
                        <div className="info-row">
                            <span>Warranty Expires:</span>
                            <strong>{warranty.expiresAt}</strong>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Issue Type</label>
                        <select
                            value={issueType}
                            onChange={e => setIssueType(e.target.value)}
                        >
                            <option value="same_issue">Same issue as original repair</option>
                            <option value="related_issue">Related issue from repair</option>
                            <option value="part_failure">Replaced part failure</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Describe the Issue</label>
                        <textarea
                            value={issueDescription}
                            onChange={e => setIssueDescription(e.target.value)}
                            placeholder="Please describe what's happening with your device..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="warranty-notice">
                        <AlertCircle size={16} />
                        <span>Our team will review your claim within 24-48 hours. If approved, you'll be contacted to schedule a free repair.</span>
                    </div>

                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit">
                            <Shield size={16} /> Submit Claim
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== REFERRAL INVITE MODAL ==========
const ReferralInviteModal = ({ referralCode, onSend, onClose }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState(`Hey! I've been using FixIt Pro for my device repairs and they're amazing. Use my referral code ${referralCode} to get $10 off your first repair!`);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        await onSend({ email, name, message });
        setSending(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Invite a Friend</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="referral-preview">
                        <Gift size={32} />
                        <div>
                            <strong>Both of you get rewarded!</strong>
                            <p>Your friend gets $10 off, you get $15 credit</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Friend's Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="John"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Friend's Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="friend@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Personal Message (Optional)</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={sending}>
                            {sending ? (
                                <><Loader2 size={16} className="spin" /> Sending...</>
                            ) : (
                                <><Send size={16} /> Send Invitation</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerProfile;

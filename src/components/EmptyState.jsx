import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, Bell, Smartphone, Receipt, Star, Shield, Settings, Gift } from 'lucide-react';
import './Skeleton.css';

// Icon mapping for different empty state types
const icons = {
    bookings: Calendar,
    devices: Smartphone,
    notifications: Bell,
    invoices: Receipt,
    reviews: Star,
    warranties: Shield,
    settings: Settings,
    rewards: Gift,
    default: Package
};

// Empty state messages
const emptyMessages = {
    bookings: {
        title: 'No Bookings Yet',
        description: 'Book your first repair and track it right here!',
        action: 'Book a Repair',
        link: '/booking'
    },
    activeBookings: {
        title: 'No Active Repairs',
        description: 'All caught up! No repairs in progress right now.',
        action: 'Book a Repair',
        link: '/booking'
    },
    devices: {
        title: 'No Devices Added',
        description: 'Add your devices for faster booking and warranty tracking.',
        action: 'Add Device'
    },
    notifications: {
        title: 'All Caught Up!',
        description: 'You have no notifications at the moment. We\'ll notify you about repairs and offers.',
        action: null
    },
    invoices: {
        title: 'No Invoices',
        description: 'Your invoices will appear here after your first completed repair.',
        action: 'Book a Repair',
        link: '/booking'
    },
    reviews: {
        title: 'No Reviews Yet',
        description: 'Complete a repair to share your feedback and help others!',
        action: 'Book a Repair',
        link: '/booking'
    },
    reviewable: {
        title: 'Nothing to Review',
        description: 'Complete a repair to leave a review. Your feedback helps us improve!',
        action: null
    },
    warranties: {
        title: 'No Warranties',
        description: 'Warranties from your repairs will appear here automatically.',
        action: 'Book a Repair',
        link: '/booking'
    },
    referrals: {
        title: 'No Referrals Yet',
        description: 'Share your code with friends and earn rewards when they book!',
        action: null
    },
    rewards: {
        title: 'No Rewards Available',
        description: 'Keep earning points to unlock exciting rewards!',
        action: null
    }
};

const EmptyState = ({
    type = 'default',
    title,
    description,
    action,
    link,
    onClick,
    compact = false,
    icon: CustomIcon
}) => {
    // Use custom props or defaults from messages
    const defaults = emptyMessages[type] || {};
    const Icon = CustomIcon || icons[type] || icons.default;

    const displayTitle = title || defaults.title || 'Nothing Here Yet';
    const displayDescription = description || defaults.description || 'Data will appear here once available.';
    const displayAction = action !== undefined ? action : defaults.action;
    const displayLink = link || defaults.link;

    return (
        <div className={`empty-state ${compact ? 'compact' : ''}`}>
            <div className="empty-state-icon">
                <Icon size={compact ? 28 : 36} />
            </div>
            <h3>{displayTitle}</h3>
            <p>{displayDescription}</p>
            {displayAction && (
                displayLink ? (
                    <Link to={displayLink} className="btn-cta">
                        {displayAction}
                    </Link>
                ) : onClick ? (
                    <button className="btn-cta" onClick={onClick}>
                        {displayAction}
                    </button>
                ) : null
            )}
        </div>
    );
};

export default EmptyState;

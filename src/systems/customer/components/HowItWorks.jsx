import React from 'react';
import { MapPin, Store, Truck } from 'lucide-react';
import './HowItWorks.css';

// Icon mapping
const iconMap = { MapPin, Store, Truck };

// Default section header
const defaultSection = {
    title: 'How It Works',
    subtitle: 'Choose the service option that works best for you'
};

// Service options with extended descriptions
const defaultOptions = [
    {
        id: 'come-to-you',
        title: 'We Come To You',
        icon: 'MapPin',
        description: 'Our technician visits your location. Simply book online, and we\'ll arrive at your preferred time. Get your device repaired on the spot without leaving your home or office.'
    },
    {
        id: 'pickup-delivery',
        title: 'Pickup & Delivery',
        icon: 'Truck',
        description: 'We pick up and deliver back to you. Schedule a convenient pickup time, and our driver will collect your device. Once repaired, we\'ll deliver it right to your door.'
    },
    {
        id: 'visit-shop',
        title: 'Visit Our Shop',
        icon: 'Store',
        description: 'Walk in anytime - no appointment needed. Get a free diagnosis in minutes and have your device repaired while you wait. Most repairs are completed the same day.'
    }
];

const HowItWorks = ({ section, options, loading }) => {
    const headerData = section?.title ? section : defaultSection;
    // Use database options if available, otherwise use defaults
    const optionsData = options?.length > 0 ? options : defaultOptions;

    if (loading) {
        return (
            <section className="how-it-works-section section-padding">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">{defaultSection.title}</h2>
                        <p className="section-subtitle">{defaultSection.subtitle}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="how-it-works-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">{headerData.title}</h2>
                    <p className="section-subtitle">{headerData.subtitle}</p>
                </div>

                <div className="service-cards-simple">
                    {optionsData.map((option, idx) => {
                        const OptionIcon = iconMap[option.icon] || MapPin;
                        return (
                            <div key={option.id || idx} className="service-card-simple">
                                <div className="service-icon-box">
                                    <OptionIcon size={24} />
                                </div>
                                <div className="service-content">
                                    <h3>{option.title}</h3>
                                    <p>{option.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

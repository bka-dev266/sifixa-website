import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock, ShieldCheck, Truck, Wrench, Shield, Award, Star, DollarSign,
    BadgeCheck, ThumbsUp, HeartHandshake, Smartphone, MapPin, Users, Zap
} from 'lucide-react';
import './WhyChooseUs.css';

// Icon mapping - extend as needed for admin
const iconMap = {
    Clock,
    Shield,
    ShieldCheck,
    Award,
    Star,
    Truck,
    Wrench,
    DollarSign,
    BadgeCheck,
    ThumbsUp,
    HeartHandshake,
    Smartphone,
    MapPin,
    Users,
    Zap
};

// Default section header
const defaultSection = {
    title: 'Why Choose SIFIXA?',
    subtitle: 'The smartest way to repair your device'
};

// Default features (fallback)
const defaultFeatures = [
    { id: '1', icon: 'Clock', title: 'Fast Turnaround', description: 'Most repairs completed in under 30 minutes.' },
    { id: '2', icon: 'ShieldCheck', title: 'Lifetime Warranty', description: 'We stand by our parts and labor with a lifetime warranty.' },
    { id: '3', icon: 'Truck', title: 'We Come to You', description: 'Home, office, or coffee shop - we meet you anywhere.' },
    { id: '4', icon: 'Wrench', title: 'Expert Technicians', description: 'Certified professionals with years of experience.' }
];

const WhyChooseUs = ({ section, features, loading }) => {
    // Use defaults if no data
    const headerData = section?.title ? section : defaultSection;
    // Always use defaults for consistent display
    const featuresData = defaultFeatures;

    // Loading skeleton
    if (loading) {
        return (
            <section className="why-choose-us section-padding">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="skeleton" style={{ width: '280px', height: '40px', margin: '0 auto 16px' }}></div>
                        <div className="skeleton" style={{ width: '350px', height: '24px', margin: '0 auto' }}></div>
                    </div>
                    <div className="features-grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="feature-card skeleton" style={{ height: '200px' }}></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="why-choose-us section-padding">
            <div className="container">
                {/* Section Header - Dynamic */}
                <div className="section-header text-center">
                    <h2 className="section-title">{headerData.title}</h2>
                    <p className="section-subtitle">{headerData.subtitle}</p>
                </div>

                {/* Features Grid */}
                <div className="features-grid">
                    {featuresData.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || Clock;

                        return (
                            <div key={feature.id || index} className="feature-card">
                                <div className="feature-icon">
                                    <IconComponent size={32} />
                                </div>
                                <div className="feature-text">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;

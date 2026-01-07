import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Store, Truck, Calendar, Wrench, CheckCircle,
    ArrowRight, Pause, Play, ClipboardCheck, PackageCheck
} from 'lucide-react';
import './HowItWorks.css';

// Icon mapping - add all icons used in the section
const iconMap = {
    MapPin,
    Store,
    Truck,
    Calendar,
    Wrench,
    CheckCircle,
    ArrowRight,
    Pause,
    Play,
    ClipboardCheck,
    PackageCheck
};

// Default section header
const defaultSection = {
    title: 'How It Works',
    subtitle: 'Choose the service option that works best for you'
};

// Default options with steps (fallback)
const defaultOptions = [
    {
        id: 'come-to-you',
        title: 'We Come To You',
        icon: 'MapPin',
        description: 'Our technician visits your location',
        steps: [
            { step_number: 1, icon: 'Calendar', title: 'Book Online', description: 'Schedule a convenient time' },
            { step_number: 2, icon: 'MapPin', title: 'We Arrive', description: 'Technician comes to your location' },
            { step_number: 3, icon: 'Wrench', title: 'Quick Repair', description: 'Fixed on the spot' },
            { step_number: 4, icon: 'CheckCircle', title: 'All Done!', description: 'Back to working perfectly' }
        ]
    },
    {
        id: 'visit-shop',
        title: 'Visit Our Shop',
        icon: 'Store',
        description: 'Walk in - no appointment needed',
        steps: [
            { step_number: 1, icon: 'Store', title: 'Walk In', description: 'Visit our convenient location' },
            { step_number: 2, icon: 'ClipboardCheck', title: 'Quick Assessment', description: 'Free diagnosis in minutes' },
            { step_number: 3, icon: 'Wrench', title: 'Expert Repair', description: 'Fixed while you wait' },
            { step_number: 4, icon: 'CheckCircle', title: 'All Done!', description: 'Back to working perfectly' }
        ]
    },
    {
        id: 'pickup-delivery',
        title: 'Pickup & Delivery',
        icon: 'Truck',
        description: 'We pick up and deliver back to you',
        steps: [
            { step_number: 1, icon: 'Calendar', title: 'Schedule Pickup', description: 'Book a convenient time' },
            { step_number: 2, icon: 'Truck', title: 'We Collect', description: 'Driver picks up your device' },
            { step_number: 3, icon: 'Wrench', title: 'We Repair', description: 'Fixed at our workshop' },
            { step_number: 4, icon: 'PackageCheck', title: 'Delivered Back', description: 'Returned to your door' }
        ]
    }
];

const AUTO_PLAY_INTERVAL = 6000; // 6 seconds per service option

const HowItWorks = ({ section, options, loading }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Use props or defaults
    const headerData = section?.title ? section : defaultSection;
    const optionsData = options?.length > 0 ? options : defaultOptions;
    const currentOption = optionsData[activeIndex];

    const nextOption = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % optionsData.length);
    }, [optionsData.length]);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            nextOption();
        }, AUTO_PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [isAutoPlaying, nextOption]);

    // Pause on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    // Loading skeleton
    if (loading) {
        return (
            <section className="how-it-works-section section-padding">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="skeleton" style={{ width: '250px', height: '40px', margin: '0 auto 16px' }}></div>
                        <div className="skeleton" style={{ width: '400px', height: '24px', margin: '0 auto' }}></div>
                    </div>
                    <div className="how-it-works-showcase">
                        <div className="skeleton" style={{ height: '60px', marginBottom: '20px' }}></div>
                        <div className="skeleton" style={{ height: '200px' }}></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="how-it-works-section section-padding">
            <div className="container">
                {/* Section Header - Dynamic */}
                <div className="section-header text-center">
                    <h2 className="section-title">{headerData.title}</h2>
                    <p className="section-subtitle">{headerData.subtitle}</p>
                </div>

                <div
                    className="how-it-works-showcase"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Progress bar */}
                    <div className="service-progress-bar">
                        {optionsData.map((option, index) => (
                            <div
                                key={option.id || index}
                                className={`progress-segment ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'completed' : ''}`}
                                onClick={() => setActiveIndex(index)}
                            >
                                <div
                                    className="progress-fill"
                                    style={{
                                        animationDuration: index === activeIndex && isAutoPlaying ? `${AUTO_PLAY_INTERVAL}ms` : '0ms',
                                        animationPlayState: index === activeIndex && isAutoPlaying ? 'running' : 'paused',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Option Tabs - Dynamic */}
                    <div className="service-options-tabs">
                        {optionsData.map((option, index) => {
                            const Icon = iconMap[option.icon] || MapPin;
                            return (
                                <button
                                    key={option.id || index}
                                    className={`option-tab ${activeIndex === index ? 'active' : ''}`}
                                    onClick={() => setActiveIndex(index)}
                                >
                                    <div className="tab-icon-wrapper">
                                        <Icon size={24} />
                                    </div>
                                    <span className="tab-title">{option.title}</span>
                                    <span className="tab-desc">{option.description}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Steps Container - Dynamic */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            className="steps-container"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <div className="steps-grid">
                                {(currentOption?.steps || []).map((step, index) => {
                                    const StepIcon = iconMap[step.icon] || CheckCircle;
                                    return (
                                        <motion.div
                                            key={step.id || index}
                                            className="step-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.3 }}
                                        >
                                            <div className="step-number">{step.step_number || index + 1}</div>
                                            <div className="step-icon">
                                                <StepIcon size={28} />
                                            </div>
                                            <div className="step-text">
                                                <h4>{step.title}</h4>
                                                <p>{step.description || step.desc}</p>
                                            </div>
                                            {index < (currentOption?.steps?.length || 0) - 1 && (
                                                <div className="step-arrow">
                                                    <ArrowRight size={20} />
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="how-it-works-controls">
                        <div className="slide-counter">
                            <span className="current">{String(activeIndex + 1).padStart(2, '0')}</span>
                            <span className="separator">/</span>
                            <span className="total">{String(optionsData.length).padStart(2, '0')}</span>
                        </div>
                        <button
                            className="play-pause-btn"
                            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                            aria-label={isAutoPlaying ? 'Pause' : 'Play'}
                        >
                            {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

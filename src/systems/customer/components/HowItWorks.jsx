import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Store, Truck, Calendar, Wrench, CheckCircle, ArrowRight, Pause, Play } from 'lucide-react';
import './HowItWorks.css';

const serviceOptions = [
    {
        id: 'come-to-you',
        title: 'We Come To You',
        icon: MapPin,
        description: 'Our technician visits your location',
        steps: [
            { icon: Calendar, title: 'Book Online', desc: 'Schedule a convenient time' },
            { icon: MapPin, title: 'We Arrive', desc: 'Technician comes to your location' },
            { icon: Wrench, title: 'Quick Repair', desc: 'Fixed on the spot' },
            { icon: CheckCircle, title: 'All Done!', desc: 'Back to working perfectly' }
        ]
    },
    {
        id: 'visit-shop',
        title: 'Visit Our Shop',
        icon: Store,
        description: 'Walk in - no appointment needed',
        steps: [
            { icon: Store, title: 'Visit Us', desc: 'Bring your device to our shop' },
            { icon: Wrench, title: 'Expert Repair', desc: 'We fix it while you wait or notify you if it takes longer' },
            { icon: CheckCircle, title: 'We Notify You', desc: 'Get notified when your device is ready' },
            { icon: Truck, title: 'Pick Up or Delivery', desc: 'Collect in-store or we deliver to you' }
        ]
    },
    {
        id: 'pickup-delivery',
        title: 'Pickup & Delivery',
        icon: Truck,
        description: 'We pick up and deliver back to you',
        steps: [
            { icon: Calendar, title: 'Schedule Pickup', desc: 'Choose a pickup time' },
            { icon: Truck, title: 'We Collect', desc: 'We pick up your device' },
            { icon: Wrench, title: 'Repair at Shop', desc: 'Fixed by our experts' },
            { icon: Truck, title: 'Delivered', desc: 'Returned to your door' }
        ]
    }
];

const AUTO_PLAY_INTERVAL = 6000; // 6 seconds per service option

const HowItWorks = ({ section }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Use props from parent or defaults
    const content = section || {};
    const currentOption = serviceOptions[activeIndex];

    const nextOption = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % serviceOptions.length);
    }, []);

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

    return (
        <section className="how-it-works-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">{content?.sectionTitle || 'How It Works'}</h2>
                    <p className="section-subtitle">{content?.sectionSubtitle || 'Choose the service option that works best for you'}</p>
                </div>

                <div
                    className="how-it-works-showcase"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Progress bar */}
                    <div className="service-progress-bar">
                        {serviceOptions.map((option, index) => (
                            <div
                                key={option.id}
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

                    <div className="service-options-tabs">
                        {serviceOptions.map((option, index) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.id}
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
                                {currentOption.steps.map((step, index) => {
                                    const StepIcon = step.icon;
                                    return (
                                        <motion.div
                                            key={index}
                                            className="step-card"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.3 }}
                                        >
                                            <div className="step-number">{index + 1}</div>
                                            <div className="step-icon">
                                                <StepIcon size={28} />
                                            </div>
                                            <h4>{step.title}</h4>
                                            <p>{step.desc}</p>
                                            {index < currentOption.steps.length - 1 && (
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
                            <span className="total">{String(serviceOptions.length).padStart(2, '0')}</span>
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

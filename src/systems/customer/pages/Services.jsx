import React, { useState, useEffect } from 'react';
import { Smartphone, Battery, Droplets, Zap, Camera, Cpu, Monitor, HardDrive, Shield, Wrench, ArrowRight, Clock, Award, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import { api } from '../../../services/apiClient';
import Button from '../../../components/Button';
import './Services.css';

// Icon mapping for dynamic services
const iconMap = {
    'screen': Smartphone,
    'battery': Battery,
    'water': Droplets,
    'charging': Zap,
    'camera': Camera,
    'software': Cpu,
    'laptop': Monitor,
    'hard': HardDrive,
    'virus': Shield,
    'default': Cpu
};

const getIconForService = (name) => {
    const nameLower = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (nameLower.includes(key)) return icon;
    }
    return iconMap.default;
};

const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadServices();

        // Auto-refresh every 15 seconds to catch admin changes
        const interval = setInterval(loadServices, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadServices = async () => {
        try {
            const data = await api.services.list();
            // Only show active services
            const activeServices = data.filter(s => s.active);
            setServices(activeServices);
        } catch (error) {
            console.error('Failed to load services', error);
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Clock, title: 'Fast Turnaround', description: 'Most repairs completed same-day', color: 'blue' },
        { icon: Award, title: 'Expert Technicians', description: 'Certified professionals', color: 'purple' },
        { icon: Shield, title: '90-Day Warranty', description: 'On all repairs', color: 'green' },
        { icon: CheckCircle, title: 'Quality Parts', description: 'OEM or premium quality', color: 'orange' },
    ];

    if (loading) {
        return (
            <div className="services-page">
                <div className="container section-padding">
                    <div className="loading">Loading services...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="services-page">
            {/* Hero Section */}
            <section className="services-hero">
                <div className="container">
                    <motion.div
                        className="services-hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="hero-badge">Our Services</span>
                        <h1>Expert Repair Solutions</h1>
                        <p>Professional repairs for all your mobile and computer needs. Fast, reliable, and backed by our quality guarantee.</p>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="services-features-section">
                <div className="container">
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="feature-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className={`feature-icon ${feature.color}`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Grid Section */}
            <section className="services-list-section">
                <div className="container">
                    <motion.div
                        className="section-intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="intro-icon">
                            <Wrench size={28} />
                        </div>
                        <div>
                            <h2>Available Services</h2>
                            <p>Choose from our comprehensive range of repair services</p>
                        </div>
                    </motion.div>

                    <div className="services-grid">
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <ServiceCard
                                    icon={getIconForService(service.name)}
                                    title={service.name}
                                    description={service.description}
                                    price={`$${service.priceMin} - $${service.priceMax}`}
                                    delay={0}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {services.length === 0 && (
                        <div className="no-services">
                            <p>No services available at the moment. Please check back later.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="services-cta-section">
                <div className="container">
                    <motion.div
                        className="cta-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="cta-content">
                            <h2>Ready to Get Your Device Fixed?</h2>
                            <p>Book an appointment now and get your device repaired by our expert technicians.</p>
                        </div>
                        <div className="cta-actions">
                            <Link to="/book">
                                <Button variant="primary">
                                    Book a Repair <ArrowRight size={18} />
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button variant="secondary">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Services;

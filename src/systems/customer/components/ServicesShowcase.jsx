import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Tablet, Laptop, Monitor, Watch, Headphones, ArrowRight } from 'lucide-react';
import { getAssetUrl } from '../../../utils/assets';
// Import default images directly for reliable fallback
import phoneImage from '../../../assets/images/phone-repair.png';
import computerImage from '../../../assets/images/computer-repair.png';

// Icon mapping - add more as needed
const iconMap = {
    Smartphone: Smartphone,
    Tablet: Tablet,
    Laptop: Laptop,
    Monitor: Monitor,
    Watch: Watch,
    Headphones: Headphones
};

// Image mapping for fallback - use available images
const imageMap = {
    'smartphone-repair.png': phoneImage,
    'phone-repair.png': phoneImage,
    'tablet-repair.png': computerImage, // Use computer image for tablet
    'computer-repair.png': computerImage,
    'laptop-repair.png': computerImage
};

// Default section header
const defaultSection = {
    title: 'Expert Repair Services',
    subtitle: 'We fix all major brands and devices with premium quality parts and certified technicians.'
};

// Default services data
const defaultServices = [
    {
        title: 'Smartphone Repair',
        description: 'Screen replacement, battery, charging port, camera and more for all major brands.',
        icon: 'Smartphone',
        image: 'smartphone-repair.png',
        link: '/services',
        link_text: 'Explore Services'
    },
    {
        title: 'Tablet Repair',
        description: 'iPad, Samsung Tab, and other tablet repairs with genuine parts and warranty.',
        icon: 'Tablet',
        image: 'tablet-repair.png',
        link: '/services',
        link_text: 'Explore Services'
    },
    {
        title: 'Computer Repair',
        description: 'Laptop screen, keyboard, battery, SSD upgrades, and software troubleshooting.',
        icon: 'Laptop',
        image: 'computer-repair.png',
        link: '/services',
        link_text: 'Explore Services'
    }
];

// Helper to get image URL
const getImageUrl = (imagePath) => {
    if (!imagePath) return phoneImage;

    // If it's a full URL, use as-is
    if (imagePath.startsWith('http')) return imagePath;

    // Remove leading slash if present
    const cleanPath = imagePath.replace(/^\//, '');

    // Check if we have a direct import for this image
    if (imageMap[cleanPath]) return imageMap[cleanPath];

    // Try getAssetUrl, fallback to phone image
    try {
        return getAssetUrl(cleanPath);
    } catch {
        return phoneImage;
    }
};

const ServicesShowcase = ({ section, services, loading }) => {
    // Use defaults if no data
    const headerData = section?.title ? section : defaultSection;
    const servicesData = services?.length > 0 ? services : defaultServices;

    // Loading skeleton
    if (loading) {
        return (
            <section className="services-showcase-section">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="skeleton" style={{ width: '300px', height: '40px', margin: '0 auto 16px' }}></div>
                        <div className="skeleton" style={{ width: '500px', height: '24px', margin: '0 auto' }}></div>
                    </div>
                    <div className="services-showcase-grid">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="service-showcase-card skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-text"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="services-showcase-section">
            <div className="container">
                {/* Section Header - Dynamic */}
                <div className="section-header text-center">
                    <h2 className="section-title">{headerData.title}</h2>
                    <p className="section-subtitle">{headerData.subtitle}</p>
                </div>

                {/* Services Grid - Dynamic */}
                <div className="services-showcase-grid">
                    {servicesData.map((service, index) => {
                        const IconComponent = iconMap[service.icon] || Smartphone;
                        const imageUrl = getImageUrl(service.image);

                        return (
                            <Link
                                key={service.id || index}
                                to={service.link || '/services'}
                                className="service-showcase-card"
                            >
                                {/* Card Image */}
                                <div className="service-card-image">
                                    <img
                                        src={imageUrl}
                                        alt={service.title}
                                    />
                                    <div className="service-card-overlay"></div>
                                </div>

                                {/* Card Content */}
                                <div className="service-card-content">
                                    <div className="service-card-icon">
                                        <IconComponent size={28} />
                                    </div>
                                    <h3>{service.title}</h3>
                                    <p>{service.description}</p>
                                    <span className="service-card-link">
                                        {service.link_text || 'Explore Services'} <ArrowRight size={18} />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-8">
                    <Link to="/services" className="btn btn-outline">
                        View All Services
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ServicesShowcase;

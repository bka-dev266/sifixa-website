import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tablet, Laptop, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PricingTable.css';

const pricingCards = [
    {
        id: 'phone',
        title: 'Phone Repair',
        icon: Smartphone,
        priceFrom: '$20',
        priceTo: '$500+',
        description: 'Screen, battery, charging port, and more',
        popular: true
    },
    {
        id: 'tablet',
        title: 'Tablet Repair',
        icon: Tablet,
        priceFrom: '$30',
        priceTo: '$500+',
        description: 'iPad, Samsung Tab, and other tablets',
        popular: false
    },
    {
        id: 'computer',
        title: 'Computer Repair',
        icon: Laptop,
        priceFrom: '$40',
        priceTo: '$600+',
        description: 'Laptops, desktops, and MacBooks',
        popular: false
    }
];

const PricingTable = ({ sectionHeader }) => {
    return (
        <section className="pricing-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">{sectionHeader?.title || 'Transparent Pricing'}</h2>
                    <p className="section-subtitle">{sectionHeader?.subtitle || 'Simple pricing based on your device type'}</p>
                </div>

                <div className="pricing-cards-simple">
                    {pricingCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.id}
                                className={`pricing-card-simple ${card.popular ? 'popular' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.4 }}
                            >
                                {card.popular && <span className="popular-badge">Most Popular</span>}
                                <div className="card-icon">
                                    <Icon size={32} />
                                </div>
                                <h3>{card.title}</h3>
                                <div className="price-range">
                                    <span className="from">from</span>
                                    <span className="price-from">{card.priceFrom}</span>
                                    <span className="to">to</span>
                                    <span className="price-to">{card.priceTo}</span>
                                </div>
                                <p className="card-description">{card.description}</p>
                                <Link to="/booking" className="card-cta">
                                    Get Quote <ArrowRight size={16} />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="pricing-cta">
                    <p className="pricing-disclaimer">* Final price depends on device model and damage extent. Free diagnosis!</p>
                </div>
            </div>
        </section>
    );
};

export default PricingTable;

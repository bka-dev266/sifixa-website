import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Tablet, Laptop, Battery, Monitor, HardDrive, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPricing } from '../../../services/landingService';
import './PricingTable.css';

// Icon mapping
const iconMap = {
    Smartphone, Tablet, Laptop, Battery, Monitor, HardDrive
};

const defaultPricingData = [
    {
        category: 'Phone Screen', icon: 'Smartphone', items: [
            { name: 'iPhone Screen Repair', price: 'From $79' },
            { name: 'Samsung Screen Repair', price: 'From $69' },
            { name: 'Other Android Screen', price: 'From $59' }
        ]
    },
    {
        category: 'Phone Battery', icon: 'Battery', items: [
            { name: 'iPhone Battery', price: 'From $49' },
            { name: 'Samsung Battery', price: 'From $45' },
            { name: 'Other Android Battery', price: 'From $39' }
        ]
    },
    {
        category: 'Tablet Repair', icon: 'Tablet', items: [
            { name: 'iPad Screen Repair', price: 'From $129' },
            { name: 'iPad Battery', price: 'From $79' },
            { name: 'Samsung Tab Screen', price: 'From $99' }
        ]
    },
    {
        category: 'Laptop Repair', icon: 'Laptop', items: [
            { name: 'Laptop Screen', price: 'From $149' },
            { name: 'Laptop Battery', price: 'From $89' },
            { name: 'Keyboard Replacement', price: 'From $99' }
        ]
    },
    {
        category: 'Desktop & PC', icon: 'Monitor', items: [
            { name: 'OS Reinstall', price: 'From $49' },
            { name: 'Virus Removal', price: 'From $59' },
            { name: 'Hardware Upgrade', price: 'From $79' }
        ]
    },
    {
        category: 'Data Recovery', icon: 'HardDrive', items: [
            { name: 'Basic Recovery', price: 'From $99' },
            { name: 'Advanced Recovery', price: 'From $199' },
            { name: 'SSD/HDD Failure', price: 'From $299' }
        ]
    }
];

const PricingTable = ({ sectionHeader, loading: propLoading }) => {
    const [pricingData, setPricingData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPricing = async () => {
            try {
                const data = await getPricing();
                setPricingData(data.length > 0 ? data : defaultPricingData);
            } catch (error) {
                console.error('Failed to load pricing:', error);
                setPricingData(defaultPricingData);
            }
            setLoading(false);
        };
        loadPricing();
    }, []);

    const isLoading = propLoading || loading;

    return (
        <section className="pricing-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">{sectionHeader?.title || 'Transparent Pricing'}</h2>
                    <p className="section-subtitle">{sectionHeader?.subtitle || 'No hidden fees. Get an instant estimate for your repair.'}</p>
                </div>

                {isLoading ? (
                    <div className="pricing-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="pricing-card skeleton">
                                <div className="skeleton-header"></div>
                                <div className="skeleton-list"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pricing-grid">
                        {pricingData.map((cat, index) => {
                            const Icon = iconMap[cat.icon] || Smartphone;
                            return (
                                <motion.div
                                    key={cat.id || cat.category}
                                    className="pricing-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.4 }}
                                >
                                    <div className="pricing-card-header">
                                        <div className="pricing-icon">
                                            <Icon size={24} />
                                        </div>
                                        <h3>{cat.category}</h3>
                                    </div>
                                    <ul className="pricing-list">
                                        {(cat.items || []).map((item, idx) => (
                                            <li key={item.id || idx}>
                                                <span className="service-name">{item.name}</span>
                                                <span className="service-price">{item.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <div className="pricing-cta">
                    <p className="pricing-disclaimer">* Prices are estimates. Final price depends on device model and damage extent.</p>
                    <Link to="/booking" className="btn btn-primary">
                        Get Exact Quote <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PricingTable;


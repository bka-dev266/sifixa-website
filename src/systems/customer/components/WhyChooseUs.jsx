import React from 'react';
import { Clock, ShieldCheck, Truck, Wrench, Shield, Award, Star, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import './WhyChooseUs.css';

// Icon mapping for CMS
const iconMap = {
    Clock: Clock,
    Shield: Shield,
    ShieldCheck: ShieldCheck,
    Award: Award,
    Star: Star,
    Truck: Truck,
    Wrench: Wrench,
    DollarSign: DollarSign
};

const defaultFeatures = [
    { icon: Clock, title: "Fast Turnaround", description: "Most repairs completed in under 30 minutes." },
    { icon: ShieldCheck, title: "Lifetime Warranty", description: "We stand by our parts and labor with a lifetime warranty." },
    { icon: Truck, title: "We Come to You", description: "Home, office, or coffee shop - we meet you anywhere." },
    { icon: Wrench, title: "Expert Technicians", description: "Certified professionals with years of experience." }
];

const WhyChooseUs = ({ section, loading }) => {
    // Use props from parent or defaults
    const content = section || {};

    // Use CMS features from section.content.features or defaults
    const features = content?.content?.features?.map(f => ({
        icon: iconMap[f.icon] || ShieldCheck,
        title: f.title,
        description: f.description
    })) || defaultFeatures;

    return (
        <section className="why-choose-us section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">{content?.sectionTitle || 'Why Choose SIFIXA?'}</h2>
                    <p className="section-subtitle">{content?.sectionSubtitle || 'The smartest way to repair your device'}</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <div className="feature-icon">
                                <feature.icon size={32} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;

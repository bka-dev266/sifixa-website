import React from 'react';
import { motion } from 'framer-motion';
import './BrandsWeRepair.css';

const brands = [
    { name: 'Apple', logo: '🍎' },
    { name: 'Samsung', logo: '📱' },
    { name: 'Google', logo: '🔍' },
    { name: 'Dell', logo: '💻' },
    { name: 'HP', logo: '🖥️' },
    { name: 'Lenovo', logo: '⌨️' },
    { name: 'Microsoft', logo: '🪟' },
    { name: 'Asus', logo: '🎮' },
    { name: 'Sony', logo: '🎧' },
    { name: 'LG', logo: '📺' },
    { name: 'OnePlus', logo: '➕' },
    { name: 'Huawei', logo: '📶' },
];

const BrandsWeRepair = () => {
    return (
        <section className="brands-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Brands We Repair</h2>
                    <p className="section-subtitle">We service all major brands with genuine parts and expert care</p>
                </div>

                <div className="brands-grid">
                    {brands.map((brand, index) => (
                        <motion.div
                            key={brand.name}
                            className="brand-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="brand-logo">{brand.logo}</span>
                            <span className="brand-name">{brand.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BrandsWeRepair;

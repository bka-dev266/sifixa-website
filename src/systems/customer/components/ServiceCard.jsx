import React from 'react';
import { motion } from 'framer-motion';
import './ServiceCard.css';

const ServiceCard = ({ icon: Icon, title, description, price, delay = 0 }) => {
    return (
        <motion.div
            className="service-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay, duration: 0.5 }}
            whileHover={{ y: -10 }}
        >
            <div className="icon-wrapper">
                <Icon size={32} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            {price && <div className="service-price">{price}</div>}
        </motion.div>
    );
};

export default ServiceCard;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const defaultFaqData = [
    {
        question: 'How long does a typical repair take?',
        answer: 'Most repairs are completed within 30-60 minutes. Complex repairs like water damage or motherboard issues may take 1-3 days. We\'ll give you an accurate time estimate before starting.'
    },
    {
        question: 'Do you offer a warranty on repairs?',
        answer: 'Yes! All our repairs come with a lifetime warranty on parts and labor. If anything goes wrong with the repaired component, we\'ll fix it free of charge.'
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, cash, Apple Pay, Google Pay, and can arrange payment plans for larger repairs.'
    },
    {
        question: 'Do I need to make an appointment?',
        answer: 'While walk-ins are welcome at our shop, we recommend booking an appointment to ensure minimal wait time. For mobile service, appointments are required.'
    },
    {
        question: 'What if you can\'t fix my device?',
        answer: 'If we determine a device is unrepairable, you won\'t be charged for the diagnostic. We\'ll also offer data recovery options and recommend alternatives.'
    },
    {
        question: 'Is my data safe during the repair?',
        answer: 'Absolutely. We never access personal data unless required for the repair (like testing after a screen replacement). Your privacy is our priority.'
    },
    {
        question: 'Do you use genuine parts?',
        answer: 'We offer both OEM (Original Equipment Manufacturer) and high-quality aftermarket parts. You choose what works best for your budget and needs.'
    },
    {
        question: 'Can you fix water-damaged devices?',
        answer: 'Yes, we specialize in water damage repair. Success depends on how quickly you bring it in and the extent of the damage. Never try to charge a wet device!'
    },
];

const FAQ = ({ faqItems, loading }) => {
    const [openIndex, setOpenIndex] = useState(null);

    // Use props FAQ or defaults
    const faqData = faqItems?.length > 0 ? faqItems : defaultFaqData;

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    if (loading) {
        return (
            <section className="faq-section section-padding">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Frequently Asked Questions</h2>
                        <p className="section-subtitle">Got questions? We've got answers.</p>
                    </div>
                    <div className="faq-container">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="faq-item skeleton">
                                <div className="skeleton-question"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="faq-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <p className="section-subtitle">Got questions? We've got answers.</p>
                </div>

                <div className="faq-container">
                    {faqData.map((faq, index) => (
                        <motion.div
                            key={index}
                            className={`faq-item ${openIndex === index ? 'open' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <button
                                className="faq-question"
                                onClick={() => toggleFAQ(index)}
                            >
                                <span>{faq.question}</span>
                                <motion.div
                                    className="faq-icon"
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown size={20} />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        className="faq-answer"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <p>{faq.answer}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;

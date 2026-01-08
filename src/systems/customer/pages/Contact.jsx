import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Send, Clock, MessageCircle, Headphones, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import { api } from '../../../services/apiClient';
import { mockApi } from '../../../services/mockApi'; // Keep for settings
import { useToast } from '../../../context/NotificationContext';
import './Contact.css';

const Contact = () => {
    const [settings, setSettings] = useState({
        phone: '(555) 123-4567',
        email: 'support@sifixa.com',
        address: '123 Tech Street, New York, NY 10001',
        businessHours: 'Mon-Sat: 9AM - 8PM'
    });
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        const loadSettings = async () => {
            try {
                const data = await mockApi.getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        loadSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.messages.create({
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message
            });
            toast.success('Message sent! We\'ll get back to you within 24 hours.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message. Please try again.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="container">
                    <motion.div
                        className="contact-hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="hero-badge">Contact Us</span>
                        <h1>Let's Start a Conversation</h1>
                        <p>Have questions about our repair services? Need a quote? We're here to help!</p>
                    </motion.div>
                </div>
            </section>

            {/* Quick Contact Cards */}
            <section className="quick-contact-section">
                <div className="container">
                    <div className="quick-contact-grid">
                        <motion.a
                            href={`tel:${settings.phone}`}
                            className="quick-contact-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="quick-icon phone">
                                <Phone size={24} />
                            </div>
                            <h3>Call Us</h3>
                            <p>{settings.phone}</p>
                            <span className="quick-link">Call now <ArrowRight size={16} /></span>
                        </motion.a>

                        <motion.a
                            href={`mailto:${settings.email}`}
                            className="quick-contact-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="quick-icon email">
                                <Mail size={24} />
                            </div>
                            <h3>Email Us</h3>
                            <p>{settings.email}</p>
                            <span className="quick-link">Send email <ArrowRight size={16} /></span>
                        </motion.a>

                        <motion.div
                            className="quick-contact-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <div className="quick-icon location">
                                <MapPin size={24} />
                            </div>
                            <h3>Visit Us</h3>
                            <p>{settings.address}</p>
                            <span className="quick-link">Get directions <ArrowRight size={16} /></span>
                        </motion.div>

                        <motion.div
                            className="quick-contact-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                        >
                            <div className="quick-icon hours">
                                <Clock size={24} />
                            </div>
                            <h3>Business Hours</h3>
                            <p>Mon-Sat: 9AM - 8PM</p>
                            <p className="sub-text">Sun: 10AM - 6PM</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Contact Section */}
            <section className="main-contact-section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Form */}
                        <motion.div
                            className="contact-form-wrapper"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="form-header">
                                <MessageCircle size={28} className="form-icon" />
                                <div>
                                    <h2>Send Us a Message</h2>
                                    <p>Fill out the form and we'll respond within 24 hours</p>
                                </div>
                            </div>

                            <form className="contact-form" onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Your Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        placeholder="How can we help you?"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Your Message *</label>
                                    <textarea
                                        name="message"
                                        placeholder="Tell us about your device issue or inquiry..."
                                        rows="6"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>

                                <Button variant="primary" type="submit" className="submit-btn">
                                    Send Message <Send size={18} />
                                </Button>
                            </form>
                        </motion.div>

                        {/* Map & Additional Info */}
                        <motion.div
                            className="contact-info-wrapper"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="map-card">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49475.76863554285!2d-78.91827565!3d38.4495688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b4e4102bd07dc9%3A0x7dfb3f2497379cb!2sHarrisonburg%2C%20VA!5e0!3m2!1sen!2sus!4v1701720000000!5m2!1sen!2sus"
                                    width="100%"
                                    height="280"
                                    style={{ border: 0, borderRadius: '16px' }}
                                    allowFullScreen=""
                                    loading="lazy">
                                </iframe>
                            </div>

                            <div className="support-card">
                                <div className="support-icon">
                                    <Headphones size={32} />
                                </div>
                                <div className="support-content">
                                    <h3>Need Immediate Help?</h3>
                                    <p>Our support team is available during business hours for urgent repairs.</p>
                                    <a href={`tel:${settings.phone}`} className="support-call-btn">
                                        <Phone size={18} />
                                        Call {settings.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="faq-promo-card">
                                <h3>Frequently Asked Questions</h3>
                                <p>Find quick answers to common questions about our services.</p>
                                <a href="/faq" className="faq-link">
                                    View FAQ <ArrowRight size={16} />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;

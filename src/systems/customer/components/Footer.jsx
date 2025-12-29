import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Clock } from 'lucide-react';
import { getSettings } from '../../../services/landingService';
import './Footer.css';

const Footer = () => {
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Failed to load footer content:', error);
            }
        };
        loadSettings();
    }, []);

    const brand = settings.brand || {};
    const contact = settings.contact || {};
    const socialLinks = settings.social_links || {};

    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-column">
                    <Link to="/" className="footer-logo">
                        <Smartphone className="logo-icon" size={24} />
                        <span className="logo-text">{brand.name || 'SIFIXA'}</span>
                    </Link>
                    <p className="footer-description">
                        {brand.tagline || 'Premium mobile repair services delivered to your doorstep. Fast, reliable, and professional.'}
                    </p>
                    <div className="social-links">
                        {socialLinks.facebook && <a href={socialLinks.facebook} className="social-link" target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>}
                        {socialLinks.twitter && <a href={socialLinks.twitter} className="social-link" target="_blank" rel="noopener noreferrer"><Twitter size={20} /></a>}
                        {socialLinks.instagram && <a href={socialLinks.instagram} className="social-link" target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>}
                        {socialLinks.linkedin && <a href={socialLinks.linkedin} className="social-link" target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>}
                        {!socialLinks.facebook && !socialLinks.twitter && !socialLinks.instagram && !socialLinks.linkedin && (
                            <>
                                <a href="#" className="social-link"><Facebook size={20} /></a>
                                <a href="#" className="social-link"><Twitter size={20} /></a>
                                <a href="#" className="social-link"><Instagram size={20} /></a>
                                <a href="#" className="social-link"><Linkedin size={20} /></a>
                            </>
                        )}
                    </div>
                </div>

                <div className="footer-column">
                    <h3 className="footer-title">Quick Links</h3>
                    <ul className="footer-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/services">Services</Link></li>
                        <li><Link to="/booking">Book Repair</Link></li>
                        <li><Link to="/track">Track Order</Link></li>
                        <li><Link to="/sell">Sell Device</Link></li>
                        <li><Link to="/faq">FAQ</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h3 className="footer-title">Services</h3>
                    <ul className="footer-links">
                        <li><Link to="/services">Screen Replacement</Link></li>
                        <li><Link to="/services">Battery Replacement</Link></li>
                        <li><Link to="/services">Water Damage Repair</Link></li>
                        <li><Link to="/services">Software Issues</Link></li>
                        <li><Link to="/services">Data Recovery</Link></li>
                        <li><Link to="/services">Computer Repair</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h3 className="footer-title">Contact Us</h3>
                    <ul className="contact-info">
                        <li>
                            <MapPin size={18} />
                            <span>{contact.address || '123 Repair Street, Tech City, TC 90210'}</span>
                        </li>
                        <li>
                            <Phone size={18} />
                            <span>{contact.phone || '(555) 123-4567'}</span>
                        </li>
                        <li>
                            <Mail size={18} />
                            <div className="email-list">
                                <span>Support: {contact.supportEmail || 'support@sifixa.com'}</span>
                                <span>Info: {contact.infoEmail || 'info@sifixa.com'}</span>
                            </div>
                        </li>
                        <li>
                            <Clock size={18} />
                            <span>{contact.hours || 'Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM'}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-container">
                    <p>{`© ${new Date().getFullYear()} ${brand.name || 'SIFIXA'}. All rights reserved.`}</p>
                    <div className="footer-legal">
                        <Link to="/privacy" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link>
                        <Link to="/terms" onClick={() => window.scrollTo(0, 0)}>Terms of Use</Link>
                        <Link to="/refund" onClick={() => window.scrollTo(0, 0)}>Refund Policy</Link>
                        <Link to="/warranty" onClick={() => window.scrollTo(0, 0)}>Warranty Policy</Link>
                        <Link to="/cookies" onClick={() => window.scrollTo(0, 0)}>Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

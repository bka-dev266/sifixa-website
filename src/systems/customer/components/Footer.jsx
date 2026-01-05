import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MapPin, Phone, Mail, Clock,
    Facebook, Twitter, Instagram, Linkedin, Youtube, ExternalLink
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { getFooterData } from '../../../services/settingsService';
import LogoDark from '../../../assets/logo/dark.svg';
import LogoLight from '../../../assets/logo/light.svg';
import './Footer.css';

// Platform icon mapping
const socialIconMap = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube
};

// Default data (fallback)
const defaultSettings = {
    brand: {
        name: 'SIFIXA',
        tagline: 'Premium Device Repair',
        logo_icon: 'Smartphone'
    },
    contact: {
        address: '123 Tech Street, Harrisonburg, VA 22801',
        phone: '(540) 123-4567',
        emails: ['support@sifixa.com', 'info@sifixa.com'],
        hours: 'Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM'
    },
    copyright: `© ${new Date().getFullYear()} SIFIXA. All rights reserved.`
};

const defaultSocialLinks = [
    { platform: 'facebook', url: 'https://facebook.com/sifixa' },
    { platform: 'twitter', url: 'https://twitter.com/sifixa' },
    { platform: 'instagram', url: 'https://instagram.com/sifixa' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/sifixa' }
];

const defaultQuickLinks = [
    { label: 'Home', url: '/' },
    { label: 'Services', url: '/services' },
    { label: 'Book Repair', url: '/booking' },
    { label: 'Track Order', url: '/track' },
    { label: 'Sell Device', url: '/sell' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Contact', url: '/contact' }
];

const defaultServicesLinks = [
    { label: 'Screen Replacement', url: '/services' },
    { label: 'Battery Replacement', url: '/services' },
    { label: 'Water Damage Repair', url: '/services' },
    { label: 'Software Issues', url: '/services' },
    { label: 'Data Recovery', url: '/services' },
    { label: 'Computer Repair', url: '/services' }
];

const defaultLegalLinks = [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Use', url: '/terms' },
    { label: 'Refund Policy', url: '/refund' },
    { label: 'Warranty Policy', url: '/warranty' },
    { label: 'Cookie Policy', url: '/cookies' }
];

const Footer = () => {
    const [footerData, setFooterData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        const loadFooterData = async () => {
            try {
                const data = await getFooterData();
                setFooterData(data);
            } catch (error) {
                console.error('Failed to load footer data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFooterData();
    }, []);

    // Use defaults if no data or still loading
    // Deep merge defaults to handle cases where DB returns empty objects (e.g. before seeding)
    const rawSettings = footerData?.settings || defaultSettings;
    const settings = {
        ...rawSettings,
        brand: { ...defaultSettings.brand, ...rawSettings.brand },
        contact: { ...defaultSettings.contact, ...rawSettings.contact },
        copyright: rawSettings.copyright || defaultSettings.copyright
    };

    const socialLinks = footerData?.socialLinks?.length > 0 ? footerData.socialLinks : defaultSocialLinks;
    const quickLinks = footerData?.links?.quick_links?.length > 0 ? footerData.links.quick_links : defaultQuickLinks;
    const servicesLinks = footerData?.links?.services?.length > 0 ? footerData.links.services : defaultServicesLinks;
    const legalLinks = footerData?.links?.legal?.length > 0 ? footerData.links.legal : defaultLegalLinks;

    // Helper to render links (handles external vs internal)
    const renderLink = (link) => {
        const isExternal = link.url.startsWith('http');

        if (isExternal) {
            return (
                <a key={link.id || link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="footer-link-item">
                    {link.label} <ExternalLink size={12} className="external-icon" />
                </a>
            );
        }

        return (
            <Link key={link.id || link.label} to={link.url} onClick={() => window.scrollTo(0, 0)}>
                {link.label}
            </Link>
        );
    };

    return (
        <footer className="footer">
            <div className="container footer-container">
                {/* Brand Column */}
                <div className="footer-column brand-column">
                    <Link to="/" className="footer-logo">
                        <img
                            src={theme === 'dark' ? LogoLight : LogoDark}
                            alt="SIFIXA"
                            className="footer-logo-img"
                        />
                    </Link>
                    <p className="footer-description">
                        {settings.brand?.tagline || 'Premium Device Repair'}
                    </p>
                    <div className="social-links">
                        {socialLinks.map((social, index) => {
                            const IconComponent = socialIconMap[social.platform] || Facebook;
                            return (
                                <a
                                    key={social.id || index}
                                    href={social.url}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.platform}
                                >
                                    <IconComponent size={20} />
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Links Column */}
                <div className="footer-column">
                    <h3 className="footer-title">Quick Links</h3>
                    <ul className="footer-links">
                        {quickLinks.map((link) => (
                            <li key={link.id || link.label}>
                                {renderLink(link)}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Services Column */}
                <div className="footer-column">
                    <h3 className="footer-title">Services</h3>
                    <ul className="footer-links">
                        {servicesLinks.map((link) => (
                            <li key={link.id || link.label}>
                                {renderLink(link)}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="footer-column">
                    <h3 className="footer-title">Contact Us</h3>
                    <ul className="contact-info">
                        {/* Address */}
                        <li>
                            <MapPin size={18} className="contact-icon" />
                            <span>{settings.contact?.address}</span>
                        </li>

                        {/* Phone */}
                        <li>
                            <Phone size={18} className="contact-icon" />
                            <a href={`tel:${settings.contact?.phone?.replace(/\D/g, '')}`}>{settings.contact?.phone}</a>
                        </li>

                        {/* Emails */}
                        <li>
                            <Mail size={18} className="contact-icon" />
                            <div className="email-list">
                                {Array.isArray(settings.contact?.emails) ? (
                                    settings.contact.emails.map((email, index) => (
                                        <a href={`mailto:${email}`} key={index} className="email-link">
                                            {email}
                                        </a>
                                    ))
                                ) : (
                                    // Fallback for flat structure or migration transition
                                    <>
                                        {settings.contact?.supportEmail && <a href={`mailto:${settings.contact.supportEmail}`}>{settings.contact.supportEmail}</a>}
                                        {settings.contact?.infoEmail && <a href={`mailto:${settings.contact.infoEmail}`}>{settings.contact.infoEmail}</a>}
                                    </>
                                )}
                            </div>
                        </li>

                        {/* Hours */}
                        <li>
                            <Clock size={18} className="contact-icon" />
                            <span>{settings.contact?.hours}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <div className="container footer-bottom-container">
                    <p>{settings.copyright || `© ${new Date().getFullYear()} SIFIXA. All rights reserved.`}</p>
                    <div className="footer-legal">
                        {legalLinks.map((link) => (
                            <React.Fragment key={link.id || link.label}>
                                {renderLink(link)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

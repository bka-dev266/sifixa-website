import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowLeft } from 'lucide-react';
import { getLegalPage } from '../../../services/landingService';
import './LegalPages.css';

const PrivacyPolicy = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const data = await getLegalPage('privacy');
                setContent(data);
            } catch (error) {
                console.error('Failed to load privacy policy content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Icon mapping for dynamic rendering
    const iconMap = {
        Lock: Lock,
        Database: Database,
        Eye: Eye,
        UserCheck: UserCheck,
        Shield: Shield,
        Mail: Mail
    };

    // Default content fallback
    const defaultContent = {
        title: 'Privacy Policy',
        lastUpdated: 'December 2025',
        intro: 'At SIFIXA, we understand that your privacy is important to you. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our repair services.',
        sections: [
            { heading: 'Information We Collect', content: 'We may collect personal information that you voluntarily provide to us when you register for an account, book a repair service, contact us for support, subscribe to our newsletter, or sell a device to us.' },
            { heading: 'How We Use Your Information', content: 'We use the information we collect to provide, maintain, and improve our repair services; process your repair bookings and transactions; send you service updates and notifications.' },
            { heading: 'Information Sharing', content: 'We do not sell, trade, or rent your personal information to third parties.' },
            { heading: 'Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access.' },
            { heading: 'Your Rights', content: 'You have the right to access your personal data, request correction, request deletion, and opt-out of marketing communications.' }
        ],
        contactEmail: 'info@sifixa.com'
    };

    const displayContent = content || defaultContent;

    if (loading) {
        return (
            <div className="legal-page">
                <div className="legal-container">
                    <div className="loading-state">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="legal-page">
            <div className="legal-container">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} /> Back to Home
                </Link>

                <div className="legal-header">
                    <Shield size={48} className="legal-icon" />
                    <h1>{displayContent.title}</h1>
                    <p className="last-updated">Last updated: {displayContent.lastUpdated}</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2><Lock size={20} /> Introduction</h2>
                        <p>{displayContent.intro}</p>
                    </section>

                    {displayContent.sections?.map((section, index) => (
                        <section key={index}>
                            <h2>{section.heading}</h2>
                            <p>{section.content}</p>
                        </section>
                    ))}

                    <section>
                        <h2><Mail size={20} /> Contact Us</h2>
                        <p>
                            If you have questions or concerns about this Privacy Policy or our data practices,
                            please contact us:
                        </p>
                        <div className="contact-info">
                            <p>Email: <a href={`mailto:${displayContent.contactEmail}`}>{displayContent.contactEmail}</a></p>
                        </div>
                    </section>

                    <section>
                        <h2>Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

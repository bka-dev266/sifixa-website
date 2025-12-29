import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Mail } from 'lucide-react';
import { getLegalPage } from '../../../services/landingService';
import './LegalPages.css';

const TermsOfUse = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const data = await getLegalPage('terms');
                setContent(data);
            } catch (error) {
                console.error('Failed to load terms of use content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Default content fallback
    const defaultContent = {
        title: 'Terms of Use',
        lastUpdated: 'December 2025',
        intro: 'Welcome to SIFIXA. By accessing or using our website and services, you agree to be bound by these Terms of Use. Please read them carefully before using our services.',
        sections: [
            { heading: 'Acceptance of Terms', content: 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.' },
            { heading: 'Use of Services', content: 'Our services are intended for personal, non-commercial use. You agree to use our services only for lawful purposes.' },
            { heading: 'Repair Services', content: 'We provide device repair services as described on our website. Repair times and costs are estimates and may vary.' },
            { heading: 'Intellectual Property', content: 'All content on this website is the property of SIFIXA and is protected by copyright and other intellectual property laws.' },
            { heading: 'Limitation of Liability', content: 'SIFIXA shall not be liable for any indirect, incidental, special, consequential, or punitive damages.' },
            { heading: 'Changes to Terms', content: 'We reserve the right to modify these Terms at any time.' }
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
                    <FileText size={48} className="legal-icon" />
                    <h1>{displayContent.title}</h1>
                    <p className="last-updated">Last updated: {displayContent.lastUpdated}</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2><FileText size={20} /> Introduction</h2>
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
                        <p>For questions about these Terms of Use, please contact:</p>
                        <div className="contact-info">
                            <p>Email: <a href={`mailto:${displayContent.contactEmail}`}>{displayContent.contactEmail}</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfUse;

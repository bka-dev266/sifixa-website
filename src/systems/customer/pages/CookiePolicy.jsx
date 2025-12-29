import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, Mail } from 'lucide-react';
import { getLegalPage } from '../../../services/landingService';
import './LegalPages.css';

const CookiePolicy = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const data = await getLegalPage('cookies');
                setContent(data);
            } catch (error) {
                console.error('Failed to load cookie policy content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Default content fallback
    const defaultContent = {
        title: 'Cookie Policy',
        lastUpdated: 'December 2025',
        intro: 'This Cookie Policy explains how SIFIXA uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them.',
        sections: [
            { heading: 'What Are Cookies', content: 'Cookies are small data files placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.' },
            { heading: 'How We Use Cookies', content: 'We use cookies for several purposes: Essential Cookies (necessary for the website to function), Performance Cookies (help us understand how visitors interact with our website), Functionality Cookies (remember your preferences), and Marketing Cookies.' },
            { heading: 'Types of Cookies We Use', content: 'Session Cookies: temporary cookies deleted when you close your browser. Persistent Cookies: remain on your device until they expire. First-Party Cookies: set by our website. Third-Party Cookies: set by our partners for analytics.' },
            { heading: 'Managing Cookies', content: 'Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies. Please note that disabling cookies may affect the functionality of our website.' },
            { heading: 'Updates to This Policy', content: 'We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. We encourage you to review this policy periodically for any changes.' }
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
                    <Cookie size={48} className="legal-icon" />
                    <h1>{displayContent.title}</h1>
                    <p className="last-updated">Last updated: {displayContent.lastUpdated}</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2><Cookie size={20} /> Introduction</h2>
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
                        <p>For questions about our Cookie Policy:</p>
                        <div className="contact-info">
                            <p>Email: <a href={`mailto:${displayContent.contactEmail}`}>{displayContent.contactEmail}</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;

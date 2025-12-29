import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail } from 'lucide-react';
import { getLegalPage } from '../../../services/landingService';
import './LegalPages.css';

const WarrantyPolicy = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const data = await getLegalPage('warranty');
                setContent(data);
            } catch (error) {
                console.error('Failed to load warranty policy content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Default content fallback
    const defaultContent = {
        title: 'Warranty Policy',
        lastUpdated: 'December 2025',
        intro: 'SIFIXA stands behind the quality of our repairs. We offer a comprehensive warranty on all our repair services to ensure your peace of mind.',
        sections: [
            { heading: '30-Day Warranty', content: 'All repairs performed by SIFIXA come with a 30-day warranty covering parts and labor. If the same issue reoccurs within this period, we will re-repair your device at no additional cost.' },
            { heading: 'What\'s Covered', content: 'Our warranty covers defects in parts installed during the repair, issues directly related to the original repair service, and workmanship problems that arise under normal use conditions.' },
            { heading: 'What\'s Not Covered', content: 'The warranty does not cover physical damage occurring after repair, issues unrelated to the original repair, damage caused by unauthorized modifications, or normal wear and tear.' },
            { heading: 'How to Claim Warranty', content: 'To claim your warranty, bring your device back to our store with your original receipt or booking confirmation. Our technicians will assess the issue and determine if it falls under warranty coverage.' },
            { heading: 'Extended Warranty', content: 'For additional peace of mind, we offer extended warranty options at the time of repair. Ask our staff about extending your coverage to 6 months or 1 year.' }
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
                        <h2><Shield size={20} /> Warranty Coverage</h2>
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
                        <p>For warranty inquiries:</p>
                        <div className="contact-info">
                            <p>Email: <a href={`mailto:${displayContent.contactEmail}`}>{displayContent.contactEmail}</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default WarrantyPolicy;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ArrowLeft, Mail } from 'lucide-react';
import { getLegalPage } from '../../../services/landingService';
import './LegalPages.css';

const RefundPolicy = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const data = await getLegalPage('refund');
                setContent(data);
            } catch (error) {
                console.error('Failed to load refund policy content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Default content fallback
    const defaultContent = {
        title: 'Refund Policy',
        lastUpdated: 'December 2025',
        intro: 'At SIFIXA, we strive to provide excellent repair services and customer satisfaction. This Refund Policy outlines the conditions under which refunds may be issued.',
        sections: [
            { heading: 'Repair Service Refunds', content: 'If we are unable to repair your device, you will not be charged for the repair service (diagnostic fees may still apply).' },
            { heading: 'Diagnostic Fee', content: 'A diagnostic fee may be charged to assess your device. This fee is non-refundable if you choose not to proceed with the repair.' },
            { heading: 'Parts and Accessories', content: 'Unused parts and accessories purchased from our store may be returned within 14 days of purchase for a full refund.' },
            { heading: 'How to Request a Refund', content: 'To request a refund, please contact our customer service team with your order number and reason for the refund request.' },
            { heading: 'Exceptions', content: 'Refunds may not be issued for repairs where damage occurred after pickup, issues caused by water damage or physical abuse after repair.' }
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
                    <DollarSign size={48} className="legal-icon" />
                    <h1>{displayContent.title}</h1>
                    <p className="last-updated">Last updated: {displayContent.lastUpdated}</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2><DollarSign size={20} /> Overview</h2>
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
                        <p>For refund inquiries:</p>
                        <div className="contact-info">
                            <p>Email: <a href={`mailto:${displayContent.contactEmail}`}>{displayContent.contactEmail}</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;

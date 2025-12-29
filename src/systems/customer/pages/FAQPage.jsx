import React, { useEffect } from 'react';
import FAQ from '../components/FAQ';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './FAQPage.css';

const FAQPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="faq-page">
            <div className="faq-page-header">
                <div className="container">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <h1>Frequently Asked Questions</h1>
                    <p>Find answers to common questions about our repair services</p>
                </div>
            </div>

            <FAQ />

            <section className="faq-cta section-padding">
                <div className="container">
                    <div className="faq-cta-content">
                        <h2>Still have questions?</h2>
                        <p>Our team is here to help. Contact us for personalized assistance.</p>
                        <div className="faq-cta-buttons">
                            <Link to="/contact" className="btn btn-primary">Contact Us</Link>
                            <Link to="/booking" className="btn btn-outline">Book a Repair</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FAQPage;

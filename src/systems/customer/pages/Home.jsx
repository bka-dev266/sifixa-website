import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ServicesShowcase from '../components/ServicesShowcase';
import HowItWorks from '../components/HowItWorks';
import WhyChooseUs from '../components/WhyChooseUs';
import PricingTable from '../components/PricingTable';
import BeforeAfterGallery from '../components/BeforeAfterGallery';
import Testimonials from '../components/Testimonials';
import { ArrowRight, Smartphone, Laptop, DollarSign } from 'lucide-react';
import { getLanding } from '../../../services/landingService';
import './Home.css';

const Home = () => {
    const [landing, setLanding] = useState(null);
    const [loading, setLoading] = useState(true);

    // Scroll to top on mount and load content
    useEffect(() => {
        window.scrollTo(0, 0);

        const loadContent = async () => {
            try {
                const data = await getLanding();
                console.log('Landing Data:', data); // Debug logging
                setLanding(data);
            } catch (error) {
                console.error('Failed to load landing content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    // Get section content helper
    const getSection = (key) => landing?.sections?.[key] || {};
    const sellCta = getSection('sell_cta');
    const ctaSection = getSection('cta');

    return (
        <div className="home-page">
            <Hero hero={landing?.hero} loading={loading} />

            <ServicesShowcase
                section={getSection('services_showcase')}
                services={landing?.services}
                loading={loading}
            />

            <HowItWorks
                section={getSection('how_it_works')}
                options={landing?.howItWorks}
                loading={loading}
            />

            <WhyChooseUs
                section={getSection('why_choose_us')}
                features={landing?.features}
                loading={loading}
            />

            <PricingTable />

            <section className="sell-cta-section">
                <div className="container">
                    <div className="sell-cta-content">
                        <div className="sell-cta-text">
                            <h2>{sellCta?.title || 'Sell Your Old Device'}</h2>
                            <p>{sellCta?.subtitle || 'Got an old phone, tablet, or laptop? Get instant cash! We offer the best prices for your used devices.'}</p>
                            <Link to={sellCta?.content?.buttonLink || '/sell'} className="btn btn-primary">
                                {sellCta?.content?.buttonText || 'Get a Quote'} <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="sell-cta-visual">
                            <div className="device-stack">
                                <Laptop size={120} className="stack-icon laptop" />
                                <Smartphone size={60} className="stack-icon phone" />
                                <DollarSign size={40} className="stack-icon money" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BeforeAfterGallery
                section={getSection('gallery')}
                items={landing?.gallery}
                loading={loading}
            />

            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="section-title">{ctaSection?.title || 'Ready to get your device fixed?'}</h2>
                        <p className="section-subtitle">{ctaSection?.subtitle || 'Book a repair now and get your device back in perfect condition.'}</p>
                        <div className="cta-buttons">
                            <Link to={ctaSection?.content?.primaryButtonLink || '/booking'} className="btn btn-primary btn-lg">
                                {ctaSection?.content?.primaryButtonText || 'Book Repair Now'}
                            </Link>
                            <Link to={ctaSection?.content?.secondaryButtonLink || '/contact'} className="btn btn-secondary btn-lg">
                                {ctaSection?.content?.secondaryButtonText || 'Contact Us'}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Testimonials testimonials={landing?.testimonials} loading={loading} />
        </div>
    );
};

export default Home;


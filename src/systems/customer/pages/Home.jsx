import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import WhyChooseUs from '../components/WhyChooseUs';
import PricingTable from '../components/PricingTable';
import BeforeAfterGallery from '../components/BeforeAfterGallery';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import { ArrowRight, Smartphone, Laptop, Tablet, DollarSign } from 'lucide-react';
import { getLanding } from '../../../services/landingService';
import './Home.css';

// Icon mapping
const iconMap = {
    Smartphone: Smartphone,
    Tablet: Tablet,
    Laptop: Laptop
};

const Home = () => {
    const [landing, setLanding] = useState(null);
    const [loading, setLoading] = useState(true);

    // Scroll to top on mount and load content
    useEffect(() => {
        window.scrollTo(0, 0);

        const loadContent = async () => {
            try {
                const data = await getLanding();
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

    // Services from DB or defaults
    const services = landing?.services?.length > 0 ? landing.services : [
        { title: 'Smartphone Repair', description: 'Screen replacement, battery, charging port, camera and more.', icon: 'Smartphone', image: '/smartphone-repair.png' },
        { title: 'Tablet Repair', description: 'iPad, Samsung Tab, and other tablet repairs with genuine parts.', icon: 'Tablet', image: '/tablet-repair.png' },
        { title: 'Computer Repair', description: 'Laptop screen, keyboard, battery, SSD upgrades, and more.', icon: 'Laptop', image: '/computer-repair.png' }
    ];

    return (
        <div className="home-page">
            <Hero hero={landing?.hero} loading={loading} />

            <section className="services-showcase-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Expert Repair Services</h2>
                        <p className="section-subtitle">We fix all major brands and devices with premium quality parts and certified technicians.</p>
                    </div>

                    {loading ? (
                        <div className="services-showcase-grid">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="service-showcase-card skeleton">
                                    <div className="skeleton-image"></div>
                                    <div className="skeleton-content">
                                        <div className="skeleton-title"></div>
                                        <div className="skeleton-text"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="services-showcase-grid">
                            {services.map((service, index) => {
                                const Icon = iconMap[service.icon] || Smartphone;
                                return (
                                    <Link to={service.link || '/services'} className="service-showcase-card" key={service.id || index}>
                                        <div className="service-card-image">
                                            <img src={service.image || '/smartphone-repair.png'} alt={service.title} />
                                            <div className="service-card-overlay"></div>
                                        </div>
                                        <div className="service-card-content">
                                            <div className="service-card-icon">
                                                <Icon size={28} />
                                            </div>
                                            <h3>{service.title}</h3>
                                            <p>{service.description}</p>
                                            <span className="service-card-link">Explore Services <ArrowRight size={18} /></span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-center mt-8">
                        <Link to="/services" className="btn btn-outline">View All Services</Link>
                    </div>
                </div>
            </section>

            <HowItWorks section={getSection('how_it_works')} loading={loading} />

            <WhyChooseUs section={getSection('why_choose_us')} loading={loading} />

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

            <BeforeAfterGallery />

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

            <FAQ faqItems={landing?.faq} loading={loading} />
        </div>
    );
};

export default Home;

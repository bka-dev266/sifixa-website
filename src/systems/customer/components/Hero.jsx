import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Zap, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import { getAssetUrl } from '../../../utils/assets';
// Import hero image directly as fallback
import defaultHeroImage from '../../../assets/images/hero-repair.png';
import './Hero.css';

// Default values (fallback if database fails or fields are missing)
const defaultHero = {
    badge_text: 'Trusted by 2,500+ Happy Customers',
    title: 'Expert Device Repair',
    highlight: 'Done Right!',
    subtitle: 'Premium repair services for iPhones, Samsung, Laptops & Tablets. Fast turnaround. Certified technicians. 90-day warranty on all repairs.',
    cta_text: 'Book Repair',
    cta_link: '/booking',
    secondary_cta_text: 'View Services',
    secondary_cta_link: '/services',
    hero_image: null, // Will use imported image as default
    stat_rating: '4.9',
    stat_avg_time: '30 min',
    stat_warranty: '90 Days',
    stat_repairs: '15K+'
};

const Hero = ({ hero, loading }) => {
    const heroRef = useRef(null);
    const isInView = useInView(heroRef, { once: true, margin: "-100px" });

    // Merge database data with defaults (fallback for missing fields)
    const data = { ...defaultHero, ...hero };

    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });

    const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: (custom) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: 0.6 + (custom * 0.15),
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        })
    };

    // Loading skeleton
    if (loading) {
        return (
            <section className="hero" ref={heroRef}>
                <div className="container hero-container">
                    <div className="hero-content">
                        <div className="skeleton skeleton-badge" style={{ width: '200px', height: '32px', borderRadius: '20px', marginBottom: '20px' }}></div>
                        <div className="skeleton skeleton-title" style={{ width: '100%', height: '60px', marginBottom: '16px' }}></div>
                        <div className="skeleton skeleton-subtitle" style={{ width: '80%', height: '80px', marginBottom: '24px' }}></div>
                        <div className="skeleton skeleton-buttons" style={{ width: '300px', height: '50px' }}></div>
                    </div>
                    <div className="hero-image">
                        <div className="skeleton skeleton-image" style={{ width: '100%', height: '400px', borderRadius: '24px' }}></div>
                    </div>
                </div>
            </section>
        );
    }

    // For now, always use the imported image
    // The database hero_image field can be used later with Supabase Storage URLs
    const heroImageUrl = defaultHeroImage;

    return (
        <section className="hero" ref={heroRef}>
            <div className="container hero-container">
                <motion.div
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    style={{ y: contentY }}
                >
                    {/* Badge - Dynamic */}
                    <motion.div className="badge" variants={itemVariants}>
                        <Star size={14} fill="currentColor" />
                        <span>{data.badge_text}</span>
                    </motion.div>

                    {/* Title - Dynamic */}
                    <motion.h1 variants={itemVariants}>
                        <span className="hero-title-main">{data.title}</span>
                        {data.highlight && (
                            <>
                                {' '}
                                <span className="highlight">{data.highlight}</span>
                            </>
                        )}
                    </motion.h1>

                    {/* Subtitle - Dynamic */}
                    <motion.p variants={itemVariants}>
                        {data.subtitle}
                    </motion.p>

                    {/* CTA Buttons - Dynamic links and text */}
                    <motion.div className="hero-actions" variants={itemVariants}>
                        <Link to={data.cta_link}>
                            <Button variant="primary">
                                {data.cta_text} <ArrowRight size={18} />
                            </Button>
                        </Link>
                        <Link to={data.secondary_cta_link}>
                            <Button variant="secondary">
                                {data.secondary_cta_text}
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-image"
                    initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
                    transition={{ delay: 0.3, duration: 0.9, ease: "easeOut" }}
                    style={{ y: imageY }}
                >
                    <div className="hero-image-wrapper">
                        <div className="hero-image-border"></div>
                        {/* Hero Image - Dynamic */}
                        <img
                            src={heroImageUrl}
                            alt="Professional device repair by SIFIXA technicians"
                            className="hero-main-image"
                        />
                        <div className="hero-image-overlay"></div>
                        <div className="hero-image-glow"></div>
                    </div>

                    {/* Glass Cards - All stats from database */}
                    <motion.div
                        className="glass-card card-rating"
                        custom={0}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        whileHover={{ scale: 1.05, y: -5 }}
                    >
                        <div className="glass-card-icon rating-icon">
                            <Star size={22} fill="#fbbf24" stroke="#fbbf24" />
                        </div>
                        <div className="glass-card-content">
                            <span className="glass-card-value">{data.stat_rating}</span>
                            <span className="glass-card-label">Rating</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className="glass-card card-speed"
                        custom={1}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        whileHover={{ scale: 1.05, y: -5 }}
                    >
                        <div className="glass-card-icon speed-icon">
                            <Zap size={22} />
                        </div>
                        <div className="glass-card-content">
                            <span className="glass-card-value">{data.stat_avg_time}</span>
                            <span className="glass-card-label">Avg Time</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className="glass-card card-warranty"
                        custom={2}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        whileHover={{ scale: 1.05, y: -5 }}
                    >
                        <div className="glass-card-icon warranty-icon">
                            <Shield size={22} />
                        </div>
                        <div className="glass-card-content">
                            <span className="glass-card-value">{data.stat_warranty}</span>
                            <span className="glass-card-label">Warranty</span>
                        </div>
                    </motion.div>

                    <motion.div
                        className="glass-card card-repairs"
                        custom={3}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        whileHover={{ scale: 1.05, y: -5 }}
                    >
                        <div className="glass-card-icon repairs-icon">
                            <Award size={22} />
                        </div>
                        <div className="glass-card-content">
                            <span className="glass-card-value">{data.stat_repairs}</span>
                            <span className="glass-card-label">Repairs</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="scroll-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.6 }}
            >
                <span>Scroll</span>
                <div className="scroll-indicator-line"></div>
            </motion.div>
        </section>
    );
};

export default Hero;


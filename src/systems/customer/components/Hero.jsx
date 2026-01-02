import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Zap, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import heroImage from '../../../assets/images/hero-repair.png';
import './Hero.css';

const Hero = ({ hero }) => {
    const heroRef = useRef(null);
    const isInView = useInView(heroRef, { once: true, margin: "-100px" });

    // Use props or defaults
    const content = hero || {};


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

    // Use dynamic content or fallback
    const headingText = content?.title || "Expert Device Repair";
    const highlightText = content?.subtitle || "Done Right.";

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
                    <motion.div className="badge" variants={itemVariants}>
                        <Star size={14} fill="currentColor" />
                        <span>Trusted by 2,500+ Happy Customers</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants}>
                        <span className="hero-title-main">{headingText}</span>
                        {' '}
                        <span className="highlight">{highlightText}</span>
                    </motion.h1>

                    <motion.p variants={itemVariants}>
                        {content?.description || 'Premium repair services for iPhones, Samsung, Laptops & Tablets. Fast turnaround. Certified technicians. 90-day warranty on all repairs.'}
                    </motion.p>

                    <motion.div className="hero-actions" variants={itemVariants}>
                        <Link to="/booking">
                            <Button variant="primary">{content?.primaryButtonText || 'Book Repair'} <ArrowRight size={18} /></Button>
                        </Link>
                        <Link to="/services">
                            <Button variant="secondary">{content?.secondaryButtonText || 'View Services'}</Button>
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
                        <img
                            src={heroImage}
                            alt="Professional device repair by SIFIXA technicians"
                            className="hero-main-image"
                        />
                        <div className="hero-image-overlay"></div>
                        <div className="hero-image-glow"></div>
                    </div>

                    {/* Glassmorphism floating cards */}
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
                            <span className="glass-card-value">4.9</span>
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
                            <span className="glass-card-value">30 min</span>
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
                            <span className="glass-card-value">90 Days</span>
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
                            <span className="glass-card-value">15K+</span>
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

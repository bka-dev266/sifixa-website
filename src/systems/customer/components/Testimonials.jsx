import React, { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Testimonials.css';

const defaultTestimonials = [
    {
        customer_name: "Sarah Johnson",
        customer_title: "iPhone User",
        content: "Amazing service! They came to my office and fixed my screen in 20 minutes. Highly recommended!",
        rating: 5,
        device_repaired: "Fixed in 20 minutes"
    },
    {
        customer_name: "Mike Chen",
        customer_title: "Samsung User",
        content: "Thought my phone was a goner after water damage. TechFix saved it and my data. Lifesavers!",
        rating: 5,
        device_repaired: "Data recovery success"
    },
    {
        customer_name: "Emily Davis",
        customer_title: "iPad User",
        content: "Professional, polite, and very affordable. The lifetime warranty gives me peace of mind.",
        rating: 5,
        device_repaired: "Lifetime warranty"
    },
    {
        customer_name: "James Wilson",
        customer_title: "MacBook User",
        content: "They replaced my MacBook screen same day. The quality is indistinguishable from original. Outstanding!",
        rating: 5,
        device_repaired: "Same day service"
    },
    {
        customer_name: "Ana Rodriguez",
        customer_title: "Google Pixel User",
        content: "Best repair shop in town! Fair prices and honest technicians. I've been a customer for 3 years now.",
        rating: 5,
        device_repaired: "Trusted for 3 years"
    }
];

const AUTO_SLIDE_INTERVAL = 4000;

const Testimonials = ({ testimonials: propTestimonials, loading }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState(1);

    // Use props testimonials or defaults
    const testimonials = propTestimonials?.length > 0
        ? propTestimonials.map(t => ({
            ...t,
            name: t.customer_name,
            role: t.customer_title,
            avatar: t.customer_avatar || (t.customer_name?.split(' ').map(n => n[0]).join('') || 'U'),
            highlight: t.device_repaired
        }))
        : defaultTestimonials.map(t => ({
            ...t,
            name: t.customer_name,
            role: t.customer_title,
            avatar: t.customer_name?.split(' ').map(n => n[0]).join('') || 'U',
            highlight: t.device_repaired
        }));

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }, [testimonials.length]);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            nextSlide();
        }, AUTO_SLIDE_INTERVAL);

        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide]);

    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    const currentTestimonial = testimonials[currentIndex];

    // Get visible testimonials for the preview row (previous and next)
    const getPreviewIndex = (offset) => {
        return (currentIndex + offset + testimonials.length) % testimonials.length;
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction) => ({
            x: direction > 0 ? -100 : 100,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <section className="testimonials section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">What Our Customers Say</h2>
                    <p className="section-subtitle">Real reviews from real people who trust us with their devices</p>
                </div>

                <div
                    className="testimonials-showcase"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Main testimonial card */}
                    <div className="testimonial-main">
                        <button className="testimonial-nav prev" onClick={prevSlide}>
                            <ChevronLeft size={24} />
                        </button>

                        <div className="testimonial-content-wrapper">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentIndex}
                                    className="testimonial-featured"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    <div className="quote-icon">
                                        <Quote size={32} />
                                    </div>

                                    <div className="testimonial-body">
                                        <div className="stars-row">
                                            {[...Array(currentTestimonial.rating)].map((_, i) => (
                                                <Star key={i} size={20} fill="currentColor" />
                                            ))}
                                        </div>

                                        <p className="testimonial-text">"{currentTestimonial.content}"</p>

                                        <span className="testimonial-highlight">{currentTestimonial.highlight}</span>
                                    </div>

                                    <div className="testimonial-footer">
                                        <div className="testimonial-avatar">
                                            {currentTestimonial.avatar}
                                        </div>
                                        <div className="testimonial-author-info">
                                            <h4>{currentTestimonial.name}</h4>
                                            <span>{currentTestimonial.role}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button className="testimonial-nav next" onClick={nextSlide}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Thumbnail previews */}
                    <div className="testimonial-thumbnails">
                        {testimonials.map((testimonial, index) => (
                            <button
                                key={index}
                                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setDirection(index > currentIndex ? 1 : -1);
                                    setCurrentIndex(index);
                                }}
                            >
                                <div className="thumbnail-avatar">{testimonial.avatar}</div>
                                <div className="thumbnail-info">
                                    <span className="thumbnail-name">{testimonial.name}</span>
                                    <span className="thumbnail-role">{testimonial.role}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Progress indicator */}
                    <div className="testimonial-progress">
                        {testimonials.map((_, index) => (
                            <div
                                key={index}
                                className={`progress-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setDirection(index > currentIndex ? 1 : -1);
                                    setCurrentIndex(index);
                                }}
                            >
                                <div
                                    className="progress-dot-fill"
                                    style={{
                                        animationDuration: index === currentIndex && isAutoPlaying ? `${AUTO_SLIDE_INTERVAL}ms` : '0ms',
                                        animationPlayState: index === currentIndex && isAutoPlaying ? 'running' : 'paused',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;

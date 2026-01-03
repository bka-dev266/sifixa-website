import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getGalleryUrl } from '../../../utils/assets';
import './BeforeAfterGallery.css';

// Default section header
const defaultSection = {
    title: 'Before & After',
    subtitle: 'See the transformation - real repairs by our expert technicians'
};

// Default gallery items with real images (fallback)
const defaultGalleryItems = [
    {
        id: '1',
        title: 'iPhone Screen Repair',
        description: 'Shattered screen restored to brand new condition',
        before_image: 'phone-before.png',
        after_image: 'phone-after.png',
    },
    {
        id: '2',
        title: 'MacBook Screen Replacement',
        description: 'Cracked display replaced with original parts',
        before_image: 'laptop-before.png',
        after_image: 'laptop-after.png',
    },
    {
        id: '3',
        title: 'Samsung Galaxy Screen Repair',
        description: 'Severely cracked display restored to perfect condition',
        before_image: 'samsung-before.png',
        after_image: 'samsung-after.png',
    },
    {
        id: '4',
        title: 'iPad Screen Replacement',
        description: 'Damaged tablet screen replaced with premium parts',
        before_image: 'ipad-before.png',
        after_image: 'ipad-after.png',
    },
    {
        id: '5',
        title: 'iPhone Battery Replacement',
        description: 'Swollen battery replaced - 100% health restored',
        before_image: 'battery-before.png',
        after_image: 'battery-after.png',
    },
];

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds

// Helper to get gallery image URL
const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    // If it's a full URL, use as-is
    if (imagePath.startsWith('http')) return imagePath;
    // Otherwise use getGalleryUrl helper
    return getGalleryUrl(imagePath);
};

const BeforeAfterGallery = ({ section, items, loading }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState(1);

    // Use defaults if no data
    const headerData = section?.title ? section : defaultSection;
    const galleryItems = items?.length > 0 ? items : defaultGalleryItems;
    const totalSlides = galleryItems.length;

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }, [totalSlides]);

    const goToSlide = (index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || totalSlides <= 1) return;

        const interval = setInterval(() => {
            nextSlide();
        }, AUTO_PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide, totalSlides]);

    // Pause on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    // Loading skeleton
    if (loading) {
        return (
            <section className="gallery-section section-padding">
                <div className="container">
                    <div className="section-header text-center">
                        <div className="skeleton" style={{ width: '220px', height: '40px', margin: '0 auto 16px' }}></div>
                        <div className="skeleton" style={{ width: '450px', height: '24px', margin: '0 auto' }}></div>
                    </div>
                    <div className="gallery-showcase">
                        <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }}></div>
                    </div>
                </div>
            </section>
        );
    }

    // Don't render if no items
    if (galleryItems.length === 0) return null;

    const currentItem = galleryItems[currentIndex];

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <section className="gallery-section section-padding">
            <div className="container">
                {/* Section Header - Dynamic */}
                <div className="section-header text-center">
                    <h2 className="section-title">{headerData.title}</h2>
                    <p className="section-subtitle">{headerData.subtitle}</p>
                </div>

                <div
                    className="gallery-showcase"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Progress bar */}
                    <div className="slideshow-progress">
                        {galleryItems.map((_, index) => (
                            <div
                                key={index}
                                className={`progress-segment ${index === currentIndex ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
                                onClick={() => goToSlide(index)}
                            >
                                <div
                                    className="progress-fill"
                                    style={{
                                        animationDuration: index === currentIndex && isAutoPlaying ? `${AUTO_PLAY_INTERVAL}ms` : '0ms',
                                        animationPlayState: index === currentIndex && isAutoPlaying ? 'running' : 'paused',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="gallery-main">
                        <button className="gallery-nav-btn prev" onClick={prevSlide} aria-label="Previous slide">
                            <ChevronLeft size={28} />
                        </button>

                        <div className="gallery-content">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentIndex}
                                    className="gallery-slide"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                        duration: 0.5
                                    }}
                                >
                                    <div className="comparison-container">
                                        {/* Before Side */}
                                        <div className="comparison-side before">
                                            <div className="side-label">
                                                <span className="label-dot"></span>
                                                Before
                                            </div>
                                            <div className="side-image">
                                                <img
                                                    src={getImageUrl(currentItem.before_image)}
                                                    alt={`${currentItem.title} - Before`}
                                                />
                                                <div className="image-overlay before-overlay"></div>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="comparison-divider">
                                            <div className="divider-line"></div>
                                            <div className="divider-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <div className="divider-line"></div>
                                        </div>

                                        {/* After Side */}
                                        <div className="comparison-side after">
                                            <div className="side-label">
                                                <span className="label-dot"></span>
                                                After
                                            </div>
                                            <div className="side-image">
                                                <img
                                                    src={getImageUrl(currentItem.after_image)}
                                                    alt={`${currentItem.title} - After`}
                                                />
                                                <div className="image-overlay after-overlay"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slide Info */}
                                    <div className="slide-info">
                                        <h3>{currentItem.title}</h3>
                                        <p>{currentItem.description}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button className="gallery-nav-btn next" onClick={nextSlide} aria-label="Next slide">
                            <ChevronRight size={28} />
                        </button>
                    </div>

                    {/* Slide counter and play/pause */}
                    <div className="gallery-controls">
                        <div className="slide-counter">
                            <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
                            <span className="separator">/</span>
                            <span className="total">{String(totalSlides).padStart(2, '0')}</span>
                        </div>
                        <button
                            className="play-pause-btn"
                            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                            aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                        >
                            {isAutoPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BeforeAfterGallery;

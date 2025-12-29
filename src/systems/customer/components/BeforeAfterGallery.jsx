import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getGallery } from '../../../services/landingService';
import './BeforeAfterGallery.css';

// Default gallery items with real images
const defaultGalleryItems = [
    {
        id: 1,
        title: 'iPhone Screen Repair',
        description: 'Shattered screen restored to brand new condition',
        before_image: '/gallery/phone-before.png',
        after_image: '/gallery/phone-after.png',
    },
    {
        id: 2,
        title: 'MacBook Screen Replacement',
        description: 'Cracked display replaced with original parts',
        before_image: '/gallery/laptop-before.png',
        after_image: '/gallery/laptop-after.png',
    },
    {
        id: 3,
        title: 'Samsung Galaxy Screen Repair',
        description: 'Severely cracked display restored to perfect condition',
        before_image: '/gallery/samsung-before.png',
        after_image: '/gallery/samsung-after.png',
    },
    {
        id: 4,
        title: 'iPad Screen Replacement',
        description: 'Damaged tablet screen replaced with premium parts',
        before_image: '/gallery/ipad-before.png',
        after_image: '/gallery/ipad-after.png',
    },
    {
        id: 5,
        title: 'iPhone Battery Replacement',
        description: 'Swollen battery replaced - 100% health restored',
        before_image: '/gallery/battery-before.png',
        after_image: '/gallery/battery-after.png',
    },
];

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds

const BeforeAfterGallery = ({ sectionHeader }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [galleryItems, setGalleryItems] = useState(defaultGalleryItems);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [direction, setDirection] = useState(1);

    // Load gallery items from database
    useEffect(() => {
        const loadGallery = async () => {
            try {
                const data = await getGallery();
                if (data.length > 0) {
                    setGalleryItems(data);
                }
            } catch (error) {
                console.error('Failed to load gallery:', error);
            }
        };
        loadGallery();
    }, []);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
    }, [galleryItems.length]);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
    }, [galleryItems.length]);

    const goToSlide = (index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || galleryItems.length <= 1) return;

        const interval = setInterval(() => {
            nextSlide();
        }, AUTO_PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [isAutoPlaying, nextSlide, galleryItems.length]);

    // Pause on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

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
                <div className="section-header text-center">
                    <h2 className="section-title">Before & After</h2>
                    <p className="section-subtitle">See the transformation - real repairs by our expert technicians</p>
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
                        <button className="gallery-nav-btn prev" onClick={prevSlide}>
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
                                        <div className="comparison-side before">
                                            <div className="side-label">
                                                <span className="label-dot"></span>
                                                Before
                                            </div>
                                            <div className="side-image">
                                                <img
                                                    src={currentItem.before_image}
                                                    alt={`${currentItem.title} - Before`}
                                                />
                                                <div className="image-overlay before-overlay"></div>
                                            </div>
                                        </div>

                                        <div className="comparison-divider">
                                            <div className="divider-line"></div>
                                            <div className="divider-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <div className="divider-line"></div>
                                        </div>

                                        <div className="comparison-side after">
                                            <div className="side-label">
                                                <span className="label-dot"></span>
                                                After
                                            </div>
                                            <div className="side-image">
                                                <img
                                                    src={currentItem.after_image}
                                                    alt={`${currentItem.title} - After`}
                                                />
                                                <div className="image-overlay after-overlay"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="slide-info">
                                        <h3>{currentItem.title}</h3>
                                        <p>{currentItem.description}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button className="gallery-nav-btn next" onClick={nextSlide}>
                            <ChevronRight size={28} />
                        </button>
                    </div>

                    {/* Slide counter and play/pause */}
                    <div className="gallery-controls">
                        <div className="slide-counter">
                            <span className="current">{String(currentIndex + 1).padStart(2, '0')}</span>
                            <span className="separator">/</span>
                            <span className="total">{String(galleryItems.length).padStart(2, '0')}</span>
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

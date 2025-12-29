import React from 'react';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import './LocationMap.css';

const LocationMap = () => {
    return (
        <section className="location-section section-padding">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Find Us</h2>
                    <p className="section-subtitle">Visit our shop or let us come to you - we service the entire metro area</p>
                </div>

                <div className="location-content">
                    <div className="map-container">
                        <div className="map-placeholder">
                            <div className="map-visual">
                                <div className="map-grid">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="map-cell"></div>
                                    ))}
                                </div>
                                <div className="map-pin">
                                    <MapPin size={32} />
                                    <div className="pin-pulse"></div>
                                </div>
                                <div className="service-radius">
                                    <span>Service Area</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="location-info">
                        <div className="info-card">
                            <h3>SIFIXA Repair Center</h3>

                            <div className="info-item">
                                <div className="info-icon">
                                    <MapPin size={20} />
                                </div>
                                <div className="info-text">
                                    <strong>Address</strong>
                                    <p>123 Tech Street, Suite 100<br />Downtown, CA 90210</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <Phone size={20} />
                                </div>
                                <div className="info-text">
                                    <strong>Phone</strong>
                                    <p>(555) 123-4567</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <Mail size={20} />
                                </div>
                                <div className="info-text">
                                    <strong>Email</strong>
                                    <p>support@sifixa.com</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <Clock size={20} />
                                </div>
                                <div className="info-text">
                                    <strong>Hours</strong>
                                    <p>Mon - Sat: 9:00 AM - 8:00 PM<br />Sunday: 10:00 AM - 6:00 PM</p>
                                </div>
                            </div>

                            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="directions-btn">
                                <Navigation size={18} />
                                Get Directions
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationMap;

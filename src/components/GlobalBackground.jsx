import React from 'react';
import './GlobalBackground.css';

const GlobalBackground = () => {
    return (
        <div className="global-background" aria-hidden="true">
            {/* Aurora background effect */}
            <div className="global-aurora">
                <div className="aurora-layer"></div>
                <div className="aurora-layer"></div>
            </div>

            {/* Animated grid */}
            <div className="global-grid"></div>

            {/* Gradient orbs */}
            <div className="global-orbs">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
                <div className="gradient-orb orb-4"></div>
                <div className="gradient-orb orb-5"></div>
            </div>

            {/* Floating particles */}
            <div className="global-particles">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>

            {/* Noise texture overlay */}
            <div className="global-noise"></div>
        </div>
    );
};

export default GlobalBackground;

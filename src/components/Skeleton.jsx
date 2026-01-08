import React from 'react';
import './Skeleton.css';

// Skeleton building blocks
export const Skeleton = ({ width, height, className = '', style = {} }) => (
    <div
        className={`skeleton ${className}`}
        style={{
            width: width || '100%',
            height: height || '20px',
            ...style
        }}
    />
);

// Skeleton for stat cards (4 column grid)
export const SkeletonStatCards = () => (
    <div className="stats-cards">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-stat-card">
                <div className="skeleton skeleton-icon" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Skeleton width="60px" height="28px" />
                    <Skeleton width="80px" height="14px" />
                </div>
            </div>
        ))}
    </div>
);

// Skeleton for booking/card lists
export const SkeletonCard = ({ showActions = false }) => (
    <div className="skeleton-card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Skeleton width="50px" height="50px" style={{ borderRadius: '12px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Skeleton width="60%" height="18px" />
                <Skeleton width="40%" height="14px" />
            </div>
            <Skeleton width="80px" height="24px" style={{ borderRadius: '20px' }} />
        </div>
        <Skeleton width="100%" height="8px" style={{ borderRadius: '4px' }} />
        {showActions && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <Skeleton width="100px" height="36px" style={{ borderRadius: '8px' }} />
                <Skeleton width="100px" height="36px" style={{ borderRadius: '8px' }} />
            </div>
        )}
    </div>
);

// Skeleton for notifications list
export const SkeletonNotifications = ({ count = 4 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Skeleton width="40px" height="40px" style={{ borderRadius: '10px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <Skeleton width="70%" height="16px" />
                        <Skeleton width="90%" height="12px" />
                        <Skeleton width="30%" height="12px" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Skeleton for device grid
export const SkeletonDeviceGrid = ({ count = 3 }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <Skeleton width="48px" height="48px" style={{ borderRadius: '12px' }} />
                    <div style={{ flex: 1 }}>
                        <Skeleton width="80%" height="16px" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="60%" height="12px" />
                    </div>
                </div>
                <Skeleton width="100%" height="14px" style={{ marginBottom: '0.5rem' }} />
                <Skeleton width="70%" height="14px" />
            </div>
        ))}
    </div>
);

// Skeleton for section with header
export const SkeletonSection = ({ title = true, children }) => (
    <div className="tab-loading">
        {title && (
            <div className="skeleton-header">
                <Skeleton width="200px" height="32px" />
                <Skeleton width="120px" height="40px" style={{ borderRadius: '8px' }} />
            </div>
        )}
        {children}
    </div>
);

// Skeleton for overview tab
export const SkeletonOverview = () => (
    <div className="overview-section">
        {/* Welcome Hero skeleton */}
        <div className="skeleton-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Skeleton width="50px" height="50px" style={{ borderRadius: '50%' }} />
                    <div>
                        <Skeleton width="250px" height="28px" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="180px" height="16px" />
                    </div>
                </div>
                <Skeleton width="120px" height="50px" style={{ borderRadius: '12px' }} />
            </div>
        </div>

        <SkeletonStatCards />

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="skeleton-card" style={{ minHeight: '300px' }}>
                <Skeleton width="150px" height="24px" style={{ marginBottom: '1.5rem' }} />
                <SkeletonCard />
                <SkeletonCard />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="skeleton-card" style={{ flex: 1 }}>
                    <Skeleton width="120px" height="20px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="100px" />
                </div>
                <div className="skeleton-card" style={{ flex: 1 }}>
                    <Skeleton width="100px" height="20px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="60px" />
                </div>
            </div>
        </div>
    </div>
);

export default Skeleton;

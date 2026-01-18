import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import LogoDark from '../../../assets/logo/dark.svg';
import LogoLight from '../../../assets/logo/light.svg';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/');
        } finally {
            setShowUserMenu(false);
        }
    };

    const getDashboardLink = () => {
        if (user?.role === 'admin') return '/admin';
        if (user?.role === 'employee') return '/employee';
        if (user?.role === 'support') return '/support';
        if (user?.role === 'inventory') return '/inventory';
        if (user?.role === 'sales') return '/pos';
        return '/customer/profile';
    };

    // Helper to get display name
    const getDisplayName = () => {
        if (!user) return 'Guest';
        if (user.name) return user.name.split(' ')[0];
        if (user.full_name) return user.full_name.split(' ')[0];
        if (user.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
        if (user.username) return user.username;
        if (user.email) return user.email.split('@')[0];
        return 'User';
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo">
                        <img
                            src={theme === 'dark' ? LogoLight : LogoDark}
                            alt="SIFIXA"
                            className="logo-img"
                        />
                    </Link>
                    <ThemeToggle />
                </div>

                <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/track" className={`nav-link ${location.pathname === '/track' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Track Repair</Link>
                    <Link to="/sell" className={`nav-link ${location.pathname === '/sell' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Sell Device</Link>
                    <div className="nav-cta">
                        {user ? (
                            <div className="user-menu-container">
                                <button
                                    className="user-menu-btn"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                >
                                    <User size={18} />
                                    <span>{getDisplayName()}</span>
                                </button>
                                {showUserMenu && (
                                    <div className="user-dropdown">
                                        <Link to={getDashboardLink()} onClick={() => { setShowUserMenu(false); setIsOpen(false); }}>
                                            Dashboard
                                        </Link>
                                        <button onClick={handleLogout}>
                                            <LogOut size={14} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="login-link" onClick={() => setIsOpen(false)}>
                                <User size={18} />
                                <span>Login</span>
                            </Link>
                        )}
                        <Link to="/booking" onClick={() => setIsOpen(false)}>
                            <Button variant="primary">Book Repair</Button>
                        </Link>
                    </div>
                </div>

                <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;

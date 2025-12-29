import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import { validateName, validateEmail, validatePhone } from '../../../utils/validation';
import { User, UserPlus, ArrowLeft, Mail, Phone, Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import './Login.css';

const CustomerLogin = () => {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const { login, signup, isAuthenticated, isCustomer } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in as customer
    useEffect(() => {
        if (isAuthenticated && isCustomer) {
            navigate('/customer/profile');
        }
    }, [isAuthenticated, isCustomer, navigate]);

    const handleNameChange = (e) => {
        const sanitized = validateName(e.target.value);
        setName(sanitized);
    };

    const handlePhoneChange = (e) => {
        const sanitized = validatePhone(e.target.value);
        setPhone(sanitized);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        if (result.success) {
            // Redirect handled by useEffect
        } else {
            setError(result.error || 'Login failed. Please check your credentials.');
        }
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!acceptedTerms) {
            setError('You must accept the Terms of Use and Privacy Policy to create an account');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const result = await signup(email, password, { fullName: name, phone });

            if (result.success) {
                setSuccess('Account created! Please check your email to verify your account.');
                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setPhone('');
            } else {
                setError(result.error || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError('Failed to create account. Please try again.');
        }
        setLoading(false);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="login-page">
            <div className="theme-toggle-corner">
                <ThemeToggle />
            </div>
            <Link to="/" className="home-link">
                <ArrowLeft size={18} /> Back to Home
            </Link>
            <div className="login-container">
                <div className="portal-badge customer">Customer Portal</div>

                {(mode === 'login' || mode === 'signup') && (
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            <User size={18} /> Sign In
                        </button>
                        <button
                            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => switchMode('signup')}
                        >
                            <UserPlus size={18} /> Sign Up
                        </button>
                    </div>
                )}

                {mode === 'login' && (
                    <>
                        <h1>Welcome Back</h1>
                        <p>Sign in to track your repairs and manage bookings.</p>

                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="login-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label><Mail size={16} /> Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Lock size={16} /> Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        <button
                            className="forgot-password-link"
                            onClick={() => alert('Password reset functionality coming soon. Please contact support.')}
                        >
                            <KeyRound size={14} /> Forgot Password?
                        </button>
                    </>
                )}

                {mode === 'signup' && (
                    <>
                        <h1>Create Account</h1>
                        <p>Sign up to track your repairs and manage bookings.</p>

                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                        <form className="login-form signup-form" onSubmit={handleSignup}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><User size={16} /> Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Phone size={16} /> Phone <span className="optional">(optional)</span></label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="5551234567"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label><Mail size={16} /> Email <span className="required">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(validateEmail(e.target.value))}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><Lock size={16} /> Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label><Lock size={16} /> Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="verification-notice">
                                <ShieldCheck size={16} />
                                <span>You'll receive a verification email to confirm your account</span>
                            </div>

                            <div className="terms-consent">
                                <label className="consent-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        required
                                    />
                                    <span className="checkmark"></span>
                                    <span className="consent-text">
                                        I agree to the{' '}
                                        <Link to="/terms" target="_blank">Terms of Use</Link> and{' '}
                                        <Link to="/privacy" target="_blank">Privacy Policy</Link>
                                    </span>
                                </label>
                            </div>

                            <Button variant="primary" type="submit" disabled={loading || !acceptedTerms}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                        </form>
                    </>
                )}

                <div className="staff-portal-link">
                    <p>Are you a staff member?</p>
                    <Link to="/staff/login">Go to Staff Portal</Link>
                </div>
            </div>
        </div>
    );
};

export default CustomerLogin;

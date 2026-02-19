import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/NotificationContext';
import { resetPasswordRequest, signInWithGoogle } from '../../../services/authService';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import { validateName, validateEmail, validatePhone } from '../../../utils/validation';
import {
    User, UserPlus, ArrowLeft, Mail, Phone, Lock, KeyRound,
    ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle
} from 'lucide-react';
import './Login.css';

const CustomerLogin = () => {
    const [mode, setMode] = useState('login'); // login, signup, forgot
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login, logout, signup, isAuthenticated, isCustomer } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Redirect if already logged in as customer
    useEffect(() => {
        if (isAuthenticated && isCustomer) {
            navigate('/customer/profile');
        }
    }, [isAuthenticated, isCustomer, navigate]);

    // Load remembered email
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

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

        // Handle remember me - save email preference
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // Pass rememberMe to login so AuthContext can handle session persistence
        const result = await login(email, password, rememberMe);

        if (result.success) {
            const roleData = result.role;

            if (roleData && roleData.isStaff) {
                await logout();
                setError('Staff members must use the Staff Portal to login.');
                setLoading(false);
                return;
            }

            toast.success('Welcome back!');
            navigate('/customer/profile', { replace: true });
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
            setError('You must accept the Terms of Use and Privacy Policy');
            return;
        }
        if (!phone.trim()) {
            setError('Phone number is required');
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
                toast.success('Account created! Please check your email to verify.');
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

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            await resetPasswordRequest(email);
            toast.success('Password reset email sent! Check your inbox.');
            setSuccess('We sent you a password reset link. Check your email!');
        } catch (err) {
            setError(err.message || 'Failed to send reset email.');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            toast.error('Google sign-in failed. Please try again.');
        }
    };

    // Apple sign-in disabled - requires Apple Developer Program ($99/year)
    // const handleAppleLogin = async () => {
    //     try {
    //         await signInWithApple();
    //     } catch (err) {
    //         toast.error('Apple sign-in failed. Please try again.');
    //     }
    // };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
    };

    return (
        <div className="login-page">
            <div className="login-bg-decoration">
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
                <div className="bg-circle bg-circle-3"></div>
            </div>

            <div className="theme-toggle-corner">
                <ThemeToggle />
            </div>
            <Link to="/" className="home-link">
                <ArrowLeft size={18} /> Back to Home
            </Link>

            <div className="login-container">
                {/* Auth Tabs */}
                {mode !== 'forgot' && (
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

                {/* LOGIN MODE */}
                {mode === 'login' && (
                    <>
                        <h1>Welcome Back</h1>
                        <p>Sign in to track your repairs and manage bookings.</p>

                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
                        {success && <div className="success-message"><CheckCircle size={16} /> {success}</div>}

                        {/* Social Login */}
                        <div className="social-login-section">
                            <button className="social-btn google" onClick={handleGoogleLogin}>
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                            {/* Apple sign-in hidden - requires Apple Developer Program ($99/year) */}
                        </div>

                        <div className="divider">
                            <span>or continue with email</span>
                        </div>

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
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="login-options">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    className="forgot-password-link"
                                    onClick={() => switchMode('forgot')}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </>
                )}

                {/* SIGNUP MODE */}
                {mode === 'signup' && (
                    <>
                        <h1>Create Account</h1>
                        <p>Sign up to track your repairs and earn rewards.</p>

                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                        {/* Social Signup */}
                        <div className="social-login-section">
                            <button className="social-btn google" onClick={handleGoogleLogin}>
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign up with Google
                            </button>
                            {/* Apple sign-in hidden - requires Apple Developer Program ($99/year) */}
                        </div>

                        <div className="divider">
                            <span>or sign up with email</span>
                        </div>

                        <form className="login-form signup-form" onSubmit={handleSignup}>
                            <div className="form-group">
                                <label><User size={16} /> Full Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-row">
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
                                <div className="form-group">
                                    <label><Phone size={16} /> Phone <span className="required">*</span></label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="(555) 123-4567"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label><Lock size={16} /> Password <span className="required">*</span></label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><Lock size={16} /> Confirm <span className="required">*</span></label>
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

                {/* FORGOT PASSWORD MODE */}
                {mode === 'forgot' && (
                    <>
                        <div className="forgot-header">
                            <div className={`forgot-icon ${success ? 'success' : ''}`}>
                                {success ? <CheckCircle size={48} /> : <KeyRound size={48} />}
                            </div>
                            <h1>{success ? 'Check Your Email' : 'Reset Password'}</h1>
                            <p>{success
                                ? 'We sent you a password reset link.'
                                : 'Enter your email and we\'ll send you a reset link.'
                            }</p>
                        </div>

                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                        {!success && (
                            <form className="login-form" onSubmit={handleForgotPassword}>
                                <div className="form-group">
                                    <label><Mail size={16} /> Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        )}

                        <button className="back-to-login-link" onClick={() => switchMode('login')}>
                            <ArrowLeft size={16} /> Back to Sign In
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerLogin;

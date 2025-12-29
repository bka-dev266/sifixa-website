import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { mockApi } from '../../../services/mockApi';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import { validateUsername, validateName, validateEmail, validatePhone } from '../../../utils/validation';
import { User, UserPlus, ArrowLeft, Mail, Phone, Lock, KeyRound, CheckCircle, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
    // Mode: 'login', 'signup', 'verify-signup', 'forgot', 'reset'
    const [mode, setMode] = useState('login');
    const [recoveryMethod, setRecoveryMethod] = useState('email'); // 'email' or 'phone'
    const [verifyMethod, setVerifyMethod] = useState('email'); // for signup verification
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [recoveryInput, setRecoveryInput] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [recoveredUser, setRecoveredUser] = useState(null);
    const [pendingUser, setPendingUser] = useState(null); // Stores user data during verification
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleUsernameChange = (e) => {
        const sanitized = validateUsername(e.target.value);
        setUsername(sanitized);
    };

    const handleNameChange = (e) => {
        const sanitized = validateName(e.target.value);
        setName(sanitized);
    };

    const handlePhoneChange = (e) => {
        const sanitized = validatePhone(e.target.value);
        setPhone(sanitized);
    };

    const handleRecoveryInputChange = (e) => {
        if (recoveryMethod === 'email') {
            setRecoveryInput(validateEmail(e.target.value));
        } else {
            setRecoveryInput(validatePhone(e.target.value));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (result.success) {
            // Check if user is verified
            if (result.user?.verified === false) {
                setError('Please verify your account first. Check your email or phone.');
                setLoading(false);
                return;
            }
            // Redirect based on role
            switch (result.user?.role) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'employee':
                    navigate('/employee');
                    break;
                case 'support':
                    navigate('/support');
                    break;
                case 'inventory':
                    navigate('/inventory');
                    break;
                case 'sales':
                    navigate('/pos');
                    break;
                default:
                    navigate('/customer/profile');
            }
        } else {
            setError(result.error);
        }
        setLoading(false);
    };


    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
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
            // Check if username already exists
            const users = await mockApi.getUsers();
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
                setError('Username already exists');
                setLoading(false);
                return;
            }
            if (users.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
                setError('Email already registered');
                setLoading(false);
                return;
            }

            // Generate verification code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);

            // Store pending user data (not yet saved to database)
            setPendingUser({
                name,
                username,
                email,
                phone,
                password,
                role: 'customer'
            });

            // Determine verification method based on what was provided
            if (phone && phone.length >= 10) {
                setVerifyMethod('phone');
                setSuccess(`Verification code sent to phone: ${phone.slice(-4).padStart(phone.length, '*')} (Demo code: ${code})`);
            } else {
                setVerifyMethod('email');
                setSuccess(`Verification code sent to: ${email} (Demo code: ${code})`);
            }

            setMode('verify-signup');
        } catch (err) {
            setError('Failed to initiate signup. Please try again.');
        }
        setLoading(false);
    };

    const handleVerifySignup = async (e) => {
        e.preventDefault();
        setError('');

        if (verificationCode !== generatedCode) {
            setError('Invalid verification code. Please try again.');
            return;
        }

        setLoading(true);

        try {
            // Now create the verified user
            await mockApi.addUser({
                ...pendingUser,
                verified: true,
                verifiedAt: new Date().toISOString()
            });

            // Also add to customers list
            await mockApi.addCustomer({
                name: pendingUser.name,
                email: pendingUser.email,
                phone: pendingUser.phone,
                totalBookings: 0,
                lastVisit: new Date().toISOString().split('T')[0],
                notes: 'Verified customer',
                tags: ['verified']
            });

            setSuccess('Account verified and created successfully! You can now log in.');
            setMode('login');
            setUsername(pendingUser.username);

            // Clear all signup fields
            setPassword('');
            setConfirmPassword('');
            setName('');
            setEmail('');
            setPhone('');
            setVerificationCode('');
            setPendingUser(null);
        } catch (err) {
            setError('Failed to create account. Please try again.');
        }
        setLoading(false);
    };

    const resendVerificationCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setVerificationCode('');
        setError('');

        if (verifyMethod === 'phone') {
            setSuccess(`New code sent to phone! (Demo code: ${code})`);
        } else {
            setSuccess(`New code sent to email! (Demo code: ${code})`);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const users = await mockApi.getUsers();
            let foundUser = null;

            if (recoveryMethod === 'email') {
                foundUser = users.find(u => u.email?.toLowerCase() === recoveryInput.toLowerCase());
            } else {
                // Clean phone numbers for comparison
                const cleanInput = recoveryInput.replace(/\D/g, '');
                foundUser = users.find(u => u.phone?.replace(/\D/g, '') === cleanInput);
            }

            if (!foundUser) {
                setError(`No account found with this ${recoveryMethod}`);
                setLoading(false);
                return;
            }

            // Generate a simulated verification code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);
            setRecoveredUser(foundUser);

            // In a real app, this would send an email/SMS
            setSuccess(`Verification code sent to your ${recoveryMethod}! (Demo code: ${code})`);
            setMode('reset');
        } catch (err) {
            setError('Failed to process recovery. Please try again.');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (verificationCode !== generatedCode) {
            setError('Invalid verification code');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Update user password
            await mockApi.updateUser(recoveredUser.id, { password: newPassword });

            setSuccess('Password reset successfully! You can now log in with your new password.');
            setMode('login');
            setUsername(recoveredUser.username);
            setPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setVerificationCode('');
            setRecoveryInput('');
            setRecoveredUser(null);
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        }
        setLoading(false);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
        setRecoveryInput('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');
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
                {/* Tab Switcher - only show for login/signup */}
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
                        <p>Sign in to access your account or dashboard.</p>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="login-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label><User size={16} /> Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    placeholder="Enter your username"
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
                            onClick={() => switchMode('forgot')}
                        >
                            <KeyRound size={14} /> Forgot Password?
                        </button>

                        <div className="demo-credentials">
                            <p><strong>Demo Accounts:</strong></p>
                            <p>Admin: admin / password</p>
                            <p>Technician: employee / password</p>
                            <p>Support: support / password</p>
                            <p>Inventory: dataentry / password</p>
                            <p>POS: cashier / password</p>
                        </div>

                    </>
                )}

                {mode === 'signup' && (
                    <>
                        <h1>Create Account</h1>
                        <p>Sign up to track your repairs and manage bookings.</p>

                        {error && <div className="error-message">{error}</div>}

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
                                    <label><User size={16} /> Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
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
                                    <label><Phone size={16} /> Phone <span className="optional">(optional)</span></label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="5551234567"
                                    />
                                </div>
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
                                <span>We'll send a verification code to confirm your identity</span>
                            </div>

                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Processing...' : 'Continue to Verification'}
                            </Button>
                        </form>

                        <p className="terms-notice">
                            By signing up, you agree to our{' '}
                            <Link to="/terms">Terms of Use</Link> and{' '}
                            <Link to="/privacy">Privacy Policy</Link>.
                        </p>
                    </>
                )}

                {mode === 'verify-signup' && (
                    <>
                        <div className="forgot-header">
                            <ShieldCheck size={40} className="forgot-icon" />
                            <h1>Verify Your Account</h1>
                            <p>
                                Enter the 6-digit code sent to your {verifyMethod === 'email' ? 'email' : 'phone'}.
                            </p>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="login-form" onSubmit={handleVerifySignup}>
                            <div className="form-group">
                                <label><KeyRound size={16} /> Verification Code</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="verification-input"
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit" disabled={loading || verificationCode.length !== 6}>
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </Button>
                        </form>

                        <div className="resend-section">
                            <p>Didn't receive the code?</p>
                            <button
                                className="resend-link"
                                onClick={resendVerificationCode}
                            >
                                <Mail size={14} /> Resend Code
                            </button>
                        </div>

                        <button
                            className="back-to-login-link"
                            onClick={() => switchMode('signup')}
                        >
                            <ArrowLeft size={14} /> Back to Sign Up
                        </button>
                    </>
                )}

                {mode === 'forgot' && (
                    <>
                        <div className="forgot-header">
                            <KeyRound size={40} className="forgot-icon" />
                            <h1>Forgot Password</h1>
                            <p>Recover your account using email or phone number.</p>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="recovery-method-tabs">
                            <button
                                className={`method-tab ${recoveryMethod === 'email' ? 'active' : ''}`}
                                onClick={() => { setRecoveryMethod('email'); setRecoveryInput(''); }}
                            >
                                <Mail size={16} /> Email
                            </button>
                            <button
                                className={`method-tab ${recoveryMethod === 'phone' ? 'active' : ''}`}
                                onClick={() => { setRecoveryMethod('phone'); setRecoveryInput(''); }}
                            >
                                <Phone size={16} /> Phone
                            </button>
                        </div>

                        <form className="login-form" onSubmit={handleForgotPassword}>
                            <div className="form-group">
                                <label>
                                    {recoveryMethod === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                                    {recoveryMethod === 'email' ? ' Email Address' : ' Phone Number'}
                                </label>
                                <input
                                    type={recoveryMethod === 'email' ? 'email' : 'tel'}
                                    value={recoveryInput}
                                    onChange={handleRecoveryInputChange}
                                    placeholder={recoveryMethod === 'email' ? 'john@example.com' : '5551234567'}
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                        </form>

                        <button
                            className="back-to-login-link"
                            onClick={() => switchMode('login')}
                        >
                            <ArrowLeft size={14} /> Back to Sign In
                        </button>
                    </>
                )}

                {mode === 'reset' && (
                    <>
                        <div className="forgot-header">
                            <CheckCircle size={40} className="forgot-icon success" />
                            <h1>Reset Password</h1>
                            <p>Enter the verification code and set your new password.</p>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="login-form" onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label><KeyRound size={16} /> Verification Code</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Lock size={16} /> New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Lock size={16} /> Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>

                        <button
                            className="back-to-login-link"
                            onClick={() => switchMode('forgot')}
                        >
                            <ArrowLeft size={14} /> Try Different Method
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;

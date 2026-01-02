import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import ThemeToggle from '../../../components/ThemeToggle';
import { Mail, ArrowLeft, Lock, KeyRound, Briefcase, AlertCircle } from 'lucide-react';
import '../../customer/pages/Login.css';

const StaffLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated, isStaff, role } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in as staff
    useEffect(() => {
        console.log('StaffLogin check:', { isAuthenticated, isStaff, role });

        if (isAuthenticated && role?.isStaff === true) {
            if (role?.name === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/employee', { replace: true });
            }
        }
    }, [isAuthenticated, isStaff, role, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            // The login was successful - redirect will happen via useEffect
            // when isAuthenticated and isStaff update
            // Give a moment for state to update then force check
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } else {
            setError(result.error || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="login-page staff-login-page">
            <div className="theme-toggle-corner">
                <ThemeToggle />
            </div>
            <Link to="/" className="home-link">
                <ArrowLeft size={18} /> Back to Home
            </Link>
            <div className="login-container">
                <div className="portal-badge staff">
                    <Briefcase size={16} /> Staff Portal
                </div>

                <h1>Staff Login</h1>
                <p>Sign in to access your dashboard and manage operations.</p>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label><Mail size={16} /> Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your staff email"
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

                <button className="forgot-password-link" onClick={() => alert('Please contact your administrator to reset your password.')}>
                    <KeyRound size={14} /> Forgot Password?
                </button>

                <div className="staff-portal-link">
                    <p>Are you a customer?</p>
                    <Link to="/login">Go to Customer Portal</Link>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;

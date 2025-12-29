import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        
        // Log error to console in development
        if (import.meta.env.MODE === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
        
        // You could also send to an error reporting service here
        // errorReportingService.log({ error, errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <div className="error-icon">
                            <AlertTriangle size={64} />
                        </div>
                        <h1>Oops! Something went wrong</h1>
                        <p>
                            We're sorry, but something unexpected happened. 
                            Please try refreshing the page or go back to the home page.
                        </p>
                        
                        {import.meta.env.MODE === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error Details (Development Only)</summary>
                                <pre>
                                    <strong>Error:</strong> {this.state.error.toString()}
                                    {this.state.errorInfo && (
                                        <>
                                            {'\n\n'}
                                            <strong>Component Stack:</strong>
                                            {this.state.errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}
                        
                        <div className="error-actions">
                            <Button variant="primary" onClick={this.handleRetry}>
                                <RefreshCw size={16} /> Try Again
                            </Button>
                            <Button variant="secondary" onClick={this.handleGoHome}>
                                <Home size={16} /> Go Home
                            </Button>
                        </div>
                    </div>
                    
                    <style>{`
                        .error-boundary-container {
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 2rem;
                            background: var(--bg-primary, #0f172a);
                        }
                        
                        .error-boundary-content {
                            max-width: 500px;
                            text-align: center;
                        }
                        
                        .error-icon {
                            width: 100px;
                            height: 100px;
                            margin: 0 auto 1.5rem;
                            background: rgba(239, 68, 68, 0.15);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #ef4444;
                        }
                        
                        .error-boundary-content h1 {
                            font-size: 1.75rem;
                            margin-bottom: 0.75rem;
                            color: var(--text-primary, #f1f5f9);
                        }
                        
                        .error-boundary-content p {
                            color: var(--text-secondary, #94a3b8);
                            margin-bottom: 1.5rem;
                            line-height: 1.6;
                        }
                        
                        .error-details {
                            text-align: left;
                            margin-bottom: 1.5rem;
                            background: var(--bg-secondary, #1e293b);
                            border: 1px solid var(--border-color, #334155);
                            border-radius: 8px;
                            padding: 1rem;
                        }
                        
                        .error-details summary {
                            cursor: pointer;
                            color: var(--text-secondary, #94a3b8);
                            font-weight: 500;
                            margin-bottom: 0.5rem;
                        }
                        
                        .error-details pre {
                            font-size: 0.75rem;
                            overflow-x: auto;
                            white-space: pre-wrap;
                            word-break: break-word;
                            color: #ef4444;
                            margin: 0;
                        }
                        
                        .error-actions {
                            display: flex;
                            gap: 1rem;
                            justify-content: center;
                        }
                        
                        @media (max-width: 480px) {
                            .error-actions {
                                flex-direction: column;
                            }
                            
                            .error-actions button {
                                width: 100%;
                            }
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

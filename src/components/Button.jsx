import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, className = '', type = 'button', disabled = false }) => {
    return (
        <button
            className={`btn btn-${variant} ${className}`}
            onClick={onClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;


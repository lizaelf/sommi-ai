import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  fullWidth = false,
  disabled = false
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        border: '1px solid transparent',
        backgroundImage: 'linear-gradient(#0A0A0A, #0A0A0A), linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2))',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        display: 'inline-flex',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
      className={className}
    >
      <div style={{
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        fontSize: 14,
        fontFamily: 'Inter',
        fontWeight: '400',
        wordWrap: 'break-word'
      }}>
        {children}
      </div>
    </button>
  );
};

export default Button;
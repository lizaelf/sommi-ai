import React from 'react';
import typography from '@/styles/typography';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: "default" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  variant = "default",
  size = "md",
  fullWidth = false,
  disabled = false,
  style = {}
}) => {
  const baseStyles = {
    display: "inline-flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderRadius: (fullWidth || className?.includes('w-full')) ? 0 : 24,
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
    opacity: disabled ? 0.5 : 1,
    width: (fullWidth || className?.includes('w-full')) ? '100%' : 'auto',
  };

  const sizeStyles = {
    sm: {
      height: "32px",
      padding: (fullWidth || className?.includes('w-full')) ? '0px' : "0 12px",
      fontSize: "12px",
    },
    md: {
      height: "40px",
      padding: (fullWidth || className?.includes('w-full')) ? '0px' : "0 16px",
      fontSize: "14px",
    },
    lg: {
      height: "56px",
      padding: (fullWidth || className?.includes('w-full')) ? '0px' : "0 24px",
      fontSize: "16px",
    },
  };

  const variantStyles = {
    default: {
      background: "rgba(255, 255, 255, 0.04)",
      backgroundImage: "linear-gradient(#0A0A0A, #0A0A0A), linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2))",
      backgroundOrigin: "border-box",
      backgroundClip: "padding-box, border-box",
      color: "white",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.08)",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      border: "none",
      color: "white",
    },
    danger: {
      background: "#5D1D1E",
      backgroundColor: "#5D1D1E",
      border: "none",
      color: "white",
    },
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === "default") {
        e.currentTarget.style.transform = "scale(1.02)";
      } else if (variant === "secondary") {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
      } else if (variant === "danger") {
        e.currentTarget.style.backgroundColor = "#4A1617";
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === "default") {
        e.currentTarget.style.transform = "scale(1)";
      } else if (variant === "secondary") {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
      } else if (variant === "danger") {
        e.currentTarget.style.backgroundColor = "#5D1D1E";
      }
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      <div style={{
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        color: 'inherit',
        wordWrap: 'break-word',
        ...typography.button
      }}>
        {children}
      </div>
    </button>
  );
};

export default Button;
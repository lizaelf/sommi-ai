import React from "react";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function GradientButton({ 
  children, 
  onClick, 
  variant = "default",
  size = "md",
  disabled = false,
  className = "" 
}: GradientButtonProps) {
  const baseStyles = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "24px",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
    opacity: disabled ? 0.5 : 1,
  };

  const sizeStyles = {
    sm: {
      height: "32px",
      padding: "0 12px",
      fontSize: "12px",
    },
    md: {
      height: "40px",
      padding: "0 16px",
      fontSize: "14px",
    },
    lg: {
      height: "56px",
      padding: "0 24px",
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
      background: "transparent",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      color: "white",
    },
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      if (variant === "default") {
        e.currentTarget.style.transform = "scale(1.02)";
      } else {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      if (variant === "default") {
        e.currentTarget.style.transform = "scale(1)";
      } else {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </div>
  );
}
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "secondaryFilled" | "headerIcon" | "secondaryIcon";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  className = "",
  style = {},
  ...props
}) => {
  // Use CSS classes for variants to override global button styles
  if (variant === "secondaryFilled") {
    return (
      <button
        className="secondary-filled-button react-button"
        style={style}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "primary") {
    return (
      <button
        className="primary-button react-button"
        style={style}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "headerIcon") {
    return (
      <button
        className={`header-icon-button react-button ${className}`}
        style={style}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "secondaryIcon") {
    return (
      <button
        className="secondary-icon-button react-button"
        style={style}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  // Secondary variant also uses CSS class
  return (
    <button
      className="secondary-button react-button"
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
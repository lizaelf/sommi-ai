import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "secondaryFilled";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  style = {},
  ...props
}) => {
  // Get the appropriate CSS class for each variant
  const getVariantClass = () => {
    switch (variant) {
      case "primary":
        return "react-button primary-button";
      case "secondary":
        return "react-button secondary-button";
      case "secondaryFilled":
        return "react-button secondary-filled-button";
      default:
        return "react-button primary-button";
    }
  };

  const finalClassName = `${getVariantClass()} ${className}`.trim();
  const finalStyle = {
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...style,
  };

  return (
    <button
      className={finalClassName}
      style={finalStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
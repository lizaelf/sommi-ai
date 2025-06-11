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
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "secondaryFilled":
        return {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
          borderRadius: "32px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
          minHeight: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        };
      case "secondary":
        return {
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "white",
          borderRadius: "32px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
          minHeight: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        };
      default: // primary
        return {
          backgroundColor: "white",
          border: "none",
          color: "black",
          borderRadius: "32px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.2s ease",
          minHeight: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    ...getVariantStyles(),
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...style, // User styles override defaults
  };

  // For secondaryFilled, ignore className to prevent CSS conflicts
  const finalClassName = variant === "secondaryFilled" ? "" : className;

  return (
    <button
      className={finalClassName}
      style={baseStyles}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled && variant === "secondaryFilled") {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === "secondaryFilled") {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && variant === "secondaryFilled") {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.16)";
          e.currentTarget.style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && variant === "secondaryFilled") {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

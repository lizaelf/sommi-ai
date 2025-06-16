import { ReactNode } from "react";
import { typography } from "../styles/typography";

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  icon, 
  variant = "default",
  disabled = false 
}: DropdownMenuItemProps) {
  const baseStyles = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px",
    backgroundColor: "transparent",
    border: "none",
    cursor: disabled ? "default" : "pointer",
    transition: "all 0.2s ease",
    width: "100vw",
    textAlign: "left" as const,
    borderRadius: 0,
    ...typography.body1R,
  };

  const variantStyles = {
    default: {
      color: disabled ? "#666666" : "white",
    },
    danger: {
      color: disabled ? "#666666" : "#FF6B6B",
    },
  };

  const hoverStyles = {
    default: "rgba(255, 255, 255, 0.1)",
    danger: "rgba(255, 107, 107, 0.1)",
  };

  return (
    <button
      className="dropdown-menu-item"
      onClick={disabled ? undefined : onClick}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = hoverStyles[variant];
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
      disabled={disabled}
    >
      {icon && (
        <span style={{ display: "flex", alignItems: "center" }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
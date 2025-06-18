import React from "react";

interface SectionHeaderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SectionHeaderButton: React.FC<SectionHeaderButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  style = {},
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        width: "auto",
        flexShrink: 0,
        whiteSpace: "nowrap",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        border: "none",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 400,
        color: "white",
        borderRadius: "20px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        outline: "none",
        transition: "background-color 0.2s ease, opacity 0.2s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
        }
      }}
    >
      {children}
    </button>
  );
};

export default SectionHeaderButton;
import React from "react";
import { Button } from "@/components/ui/Button";

interface SectionHeaderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "secondary" | "primary";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SectionHeaderButton: React.FC<SectionHeaderButtonProps> = ({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  className = "",
  style = {},
}) => {
  return (
    <Button
      variant={variant}
      size="sm"
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
        ...style,
      }}
    >
      {children}
    </Button>
  );
};

export default SectionHeaderButton;
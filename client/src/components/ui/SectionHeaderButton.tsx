import React from "react";
import { Button } from "./Button";

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
    <Button
      variant="secondary"
      size="xs"
      onClick={onClick}
      disabled={disabled}
      className={`w-auto flex-shrink-0 whitespace-nowrap ${className}`}
      style={style}
    >
      {children}
    </Button>
  );
};

export default SectionHeaderButton;
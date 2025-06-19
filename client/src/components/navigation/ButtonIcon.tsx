import React from "react";

interface ButtonIconProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

export function ButtonIcon({ 
  onClick,
  children
}: ButtonIconProps) {
  if (!children) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer text-white/80 hover:text-white transition-all duration-200"
    >
      {children}
    </div>
  );
}
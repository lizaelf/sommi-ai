import React from "react";
import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon | React.ComponentType<any>;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "headerIcon" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  title?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  variant = "headerIcon",
  size = "md",
  disabled = false,
  className = "",
  style = {},
  children,
  title,
  ...props
}: IconButtonProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8 min-w-8 min-h-8";
      case "lg":
        return "w-12 h-12 min-w-12 min-h-12";
      default:
        return "w-10 h-10 min-w-10 min-h-10";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 16;
      case "lg":
        return 24;
      default:
        return 20;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
      case "secondary":
        return "bg-gray-600 hover:bg-gray-700 text-white border-gray-600";
      case "ghost":
        return "bg-transparent hover:bg-white/10 text-white border-transparent";
      default:
        return "header-icon-button";
    }
  };

  if (variant === "headerIcon") {
    return (
      <button
        className={`header-icon-button react-button ${className}`}
        style={style}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        title={title}
        {...props}
      >
        <Icon size={getIconSize()} />
        {children}
      </button>
    );
  }

  return (
    <button
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        rounded-full
        border
        transition-all
        duration-200
        ease-in-out
        flex
        items-center
        justify-center
        gap-2
        font-medium
        outline-none
        focus:ring-2
        focus:ring-white/30
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      <Icon size={getIconSize()} />
      {children}
    </button>
  );
}
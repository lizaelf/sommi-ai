import React from "react";
import { LucideIcon } from "lucide-react";
import { buttonVariants } from "./Button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  icon: LucideIcon | React.ComponentType<any>;
  iconSize?: number;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, className, variant = "icon", size = "icon", iconSize, children, ...props }, ref) => {
    const getIconSize = () => {
      if (iconSize) return iconSize;
      switch (size) {
        case "iconSm":
          return 16;
        case "iconLg":
          return 24;
        case "md":
          return 20;
        default:
          return 20;
      }
    };

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        <Icon size={getIconSize()} />
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "react-button inline-flex items-center justify-center rounded-[100px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-white/90 active:bg-white/80 active:scale-[0.98]",
        secondary: "bg-white/8 w-full text-white hover:bg-white/16 active:bg-white/20",
        brand: "bg-[#6C1E2C] w-full text-white hover:bg-[#7C2E3C] active:bg-[#5C1E2C]",
        error: "bg-[#8A332C] text-white hover:bg-[#9A433C] active:bg-[#7A232C]",
        suggestion: "bg-white/8 text-white hover:bg-white/16 active:bg-white/20 whitespace-nowrap",
        headerIcon: "bg-transparent text-white hover:bg-white/10 active:bg-white/15 p-2",
        secondaryIcon: "bg-transparent border border-white/20 text-white hover:bg-white/10 active:bg-white/15 p-2"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "default"
    }
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        data-variant={variant}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
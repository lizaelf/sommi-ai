import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-14 w-full items-center px-6 py-4 text-white font-inter text-base outline-none box-border",
            "rounded-xl border transition-all duration-200",
            "placeholder:text-[#999999]",
            error 
              ? "border-[#FF6B6B]" 
              : "border-[rgba(255,255,255,0.12)]",
            isFocused
              ? "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.3)]"
              : "bg-transparent",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {error && errorMessage && (
          <div className="text-[#ff4444] text-sm mt-1 font-inter">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
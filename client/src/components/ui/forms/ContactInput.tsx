import React, { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ContactInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

const ContactInput = forwardRef<HTMLInputElement, ContactInputProps>(
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
            "contact-input-override",
            error 
              ? "border-[#FF6B6B]" 
              : "border-[rgba(255,255,255,0.12)]",
            isFocused
              ? "border-[rgba(255,255,255,0.3)]"
              : "",
            className
          )}
          style={{
            background: "transparent !important",
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            WebkitAppearance: "none !important",
            appearance: "none !important",
            boxShadow: "none !important",
            WebkitBoxShadow: "none !important",
            MozBoxShadow: "none !important",
            WebkitTextFillColor: "white !important",
            color: "white !important"
          }}
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

ContactInput.displayName = "ContactInput";

export { ContactInput };
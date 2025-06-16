import React, { useState } from "react";

interface FormInputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  name?: string;
  autocomplete?: string;
}

export function FormInput({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  label,
  required = false,
  disabled = false,
  className = "",
  leftIcon,
  rightIcon,
  name,
  autocomplete,
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value.length > 0;

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  // Phone validation
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 7) {
      return "Please enter a valid phone number";
    }
    return undefined;
  };

  // Auto-validation based on type
  const getValidationError = (): string | undefined => {
    if (error) return error;
    if (type === "email") return validateEmail(value);
    if (type === "tel") return validatePhone(value);
    return undefined;
  };

  const validationError = getValidationError();

  const inputStyles = {
    width: "100%",
    height: "48px",
    padding: leftIcon ? "0 16px 0 48px" : rightIcon ? "0 48px 0 16px" : "0 16px",
    borderRadius: "12px",
    border: validationError 
      ? "1px solid #FF6B6B" 
      : "1px solid rgba(255, 255, 255, 0.12)",
    background: "transparent",
    backgroundImage: "none",
    color: "white",
    fontSize: "16px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.2s ease",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (!validationError) {
      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (!validationError) {
      e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
    }
  };

  // Auto-complete mapping
  const getAutocomplete = (): string => {
    if (autocomplete) return autocomplete;
    
    switch (type) {
      case "email":
        return "email";
      case "tel":
        return "tel";
      default:
        if (name?.toLowerCase().includes('firstname') || placeholder?.toLowerCase().includes('first')) {
          return "given-name";
        }
        if (name?.toLowerCase().includes('lastname') || placeholder?.toLowerCase().includes('last')) {
          return "family-name";
        }
        if (name?.toLowerCase().includes('name') && !name?.toLowerCase().includes('first') && !name?.toLowerCase().includes('last')) {
          return "name";
        }
        return "off";
    }
  };

  return (
    <div className={className} style={{ marginBottom: "16px" }}>
      {label && (
        <label
          style={{
            display: "block",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          {label}
          {required && <span style={{ color: "#FF6B6B", marginLeft: "4px" }}>*</span>}
        </label>
      )}
      
      <div style={{ position: "relative" }}>
        {leftIcon && (
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          autoComplete={getAutocomplete()}
          style={inputStyles}
        />
        
        {rightIcon && (
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>
      
      {validationError && (
        <div
          style={{
            color: "#FF6B6B",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            marginTop: "4px",
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  );
}
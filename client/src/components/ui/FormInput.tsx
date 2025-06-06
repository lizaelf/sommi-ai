import React from "react";

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
}: FormInputProps) {
  const inputStyles = {
    width: "100%",
    height: "48px",
    padding: leftIcon ? "0 16px 0 48px" : rightIcon ? "0 48px 0 16px" : "0 16px",
    borderRadius: "12px",
    border: error 
      ? "1px solid #FF6B6B" 
      : "1px solid rgba(255, 255, 255, 0.12)",
    background: "transparent",
    color: "white",
    fontSize: "16px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    transition: "all 0.2s ease",
    ...(!error && {
      backgroundImage: 
        "linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04)), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%)",
      backgroundOrigin: "border-box",
      backgroundClip: "padding-box, border-box",
    }),
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!error) {
      e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!error) {
      e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
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
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
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
      
      {error && (
        <div
          style={{
            color: "#FF6B6B",
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            marginTop: "4px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
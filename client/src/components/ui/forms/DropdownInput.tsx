import React, { useState, CSSProperties } from "react";

interface DropdownInputOption {
  value: string;
  label: string;
}

interface DropdownInputProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownInputOption[];
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const DropdownInput: React.FC<DropdownInputProps> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  error,
  placeholder,
  disabled = false,
  className = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const selectStyles: CSSProperties = {
    width: "100%",
    height: "56px",
    padding: "16px 24px",
    borderRadius: "12px",
    border: error
      ? "1px solid #FF6B6B"
      : isFocused
        ? "1px solid rgba(255, 255, 255, 0.3)"
        : "1px solid rgba(255, 255, 255, 0.12)",
    background: "transparent",
    color: "#4a4a4a",
    fontSize: "16px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    position: "relative",
    zIndex: 2,
  };

  return (
    <div className={className} style={{ marginBottom: "16px", position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "8px",
          }}
        >
          {label}
          {required && <span style={{ color: "#FF6B6B", marginLeft: "4px" }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          style={selectStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Custom arrow icon */}
        <span
          style={{
            position: "absolute",
            right: 18,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            zIndex: 3,
            color: "#4a4a4a",
            fontSize: 18,
          }}
        >
          ▼
        </span>
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
};

export default DropdownInput; 
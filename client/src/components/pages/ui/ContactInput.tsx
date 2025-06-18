import React from "react";

interface ContactInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  error?: boolean;
  errorMessage?: string;
}

const ContactInput: React.FC<ContactInputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  style,
  className = "",
  disabled = false,
  required = false,
  name,
  error = false,
  errorMessage,
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      name={name}
      className={className}
      style={{
        width: "100%",
        padding: "12px 16px",
        backgroundColor: "transparent !important",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "12px",
        color: "#FFFFFF",
        fontFamily: "Inter, sans-serif",
        fontSize: "16px",
        fontWeight: "400",
        outline: "none",
        transition: "all 0.2s ease",
        ...style,
      }}
    />
  );
};

export default ContactInput;
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownMenuProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export function DropdownMenu({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  searchable = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={dropdownRef} className={className} style={{ position: "relative" }}>
      <div
        onClick={toggleDropdown}
        style={{
          width: "100%",
          height: "48px",
          padding: "0 16px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background: "transparent",
          backgroundImage: 
            "linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04)), radial-gradient(circle at top center, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0.16) 100%)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          color: "white",
          fontSize: "16px",
          fontFamily: "Inter, sans-serif",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedOption?.icon}
          <span style={{ color: selectedOption ? "white" : "rgba(255, 255, 255, 0.6)" }}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }} 
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            marginTop: "4px",
            background: "#2A2A29",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          {searchable && (
            <div style={{ padding: "8px" }}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "32px",
                  padding: "0 8px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "transparent",
                  color: "white",
                  fontSize: "14px",
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              />
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                color: "white",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s ease",
                backgroundColor: value === option.value ? "rgba(255, 255, 255, 0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 
                  value === option.value ? "rgba(255, 255, 255, 0.1)" : "transparent";
              }}
            >
              {option.icon}
              {option.label}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div
              style={{
                padding: "12px 16px",
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
              }}
            >
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "./IconButton";

interface SearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  results?: React.ReactNode;
  className?: string;
}

export function SearchInterface({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  results,
  className = "",
}: SearchInterfaceProps) {
  if (!isOpen) return null;

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: "91px",
        left: "16px",
        right: "16px",
        backgroundColor: "#2A2A29",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "16px",
        zIndex: 1000,
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ position: "relative", marginBottom: results ? "16px" : "0" }}>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        >
          <Search size={18} color="#959493" />
        </div>
        
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            height: "48px",
            padding: "0 48px 0 48px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "transparent",
            color: "white",
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
            outline: "none",
          }}
        />
        
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
          }}
        >
          <IconButton
            icon={X}
            onClick={onClose}
            variant="ghost"
            size="sm"
            title="Close search"
          />
        </div>
      </div>
      
      {results && (
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {results}
        </div>
      )}
    </div>
  );
}
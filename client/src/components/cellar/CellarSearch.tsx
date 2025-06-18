import React from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import typography from "@/styles/typography";

interface CellarSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
  placeholder?: string;
}

export const CellarSearch: React.FC<CellarSearchProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  placeholder = "Search wines...",
}) => {
  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <div style={{ position: "relative" }}>
        <Search 
          size={20} 
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#666666",
            zIndex: 1,
          }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px 12px 48px",
            backgroundColor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: "400",
            outline: "none",
            transition: "all 0.2s ease",
            paddingRight: searchTerm ? "48px" : "16px",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
            e.target.style.backgroundColor = "transparent";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
            e.target.style.backgroundColor = "transparent";
          }}
        />
        {searchTerm && (
          <IconButton
            icon={X}
            onClick={onClearSearch}
            variant="secondaryIcon"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "4px",
            }}
          />
        )}
      </div>
    </div>
  );
};
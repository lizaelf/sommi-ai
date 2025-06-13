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
            backgroundColor: "#1A1A1A",
            border: "1px solid #333",
            borderRadius: "12px",
            color: "#FFFFFF",
            ...typography.body,
            paddingRight: searchTerm ? "48px" : "16px",
          }}
        />
        {searchTerm && (
          <IconButton
            icon={X}
            onClick={onClearSearch}
            variant="ghost"
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
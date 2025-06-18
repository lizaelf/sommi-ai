import React from "react";
import { Filter } from "lucide-react";
import Button from "@/components/pages/ui/Button";
import typography from "@/styles/typography";

interface CellarFiltersProps {
  activeFilter: "all" | "available" | "empty";
  onFilterChange: (filter: "all" | "available" | "empty") => void;
  totalCount: number;
  availableCount: number;
  emptyCount: number;
}

export const CellarFilters: React.FC<CellarFiltersProps> = ({
  activeFilter,
  onFilterChange,
  totalCount,
  availableCount,
  emptyCount,
}) => {
  const filters = [
    { key: "all" as const, label: "All Wines", count: totalCount },
    { key: "available" as const, label: "Available", count: availableCount },
    { key: "empty" as const, label: "Out of Stock", count: emptyCount },
  ];

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <Filter size={16} style={{ marginRight: "8px", color: "#666666" }} />
        <span style={{ ...typography.body1R, color: "#666666" }}>
          Filter by availability
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? "primary" : "secondary"}
            onClick={() => onFilterChange(filter.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{filter.label}</span>
            <span
              style={{
                backgroundColor: activeFilter === filter.key ? "#FFFFFF20" : "#66666640",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "12px",
                lineHeight: "16px",
              }}
            >
              {filter.count}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};
import React from "react";
import { WineCard } from "./WineCard";
import typography from "@/styles/typography";

interface Wine {
  id: number;
  name: string;
  year: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  buyAgainLink?: string;
  qrCode?: string;
  qrLink?: string;
}

interface WineCollectionProps {
  wines: Wine[];
  onWineClick: (wineId: number) => void;
  isLoading: boolean;
}

export const WineCollection: React.FC<WineCollectionProps> = ({
  wines,
  onWineClick,
  isLoading,
}) => {
  return (
    <div className="mb-6" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
      <h1
        className="text-xl font-medium"
        style={{
          ...typography.h1,
          marginBottom: "24px",
        }}
      >
        Your wines
      </h1>

      {/* Wine Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {isLoading ? (
          <div style={{ ...typography.body1R, color: "#666666" }}>
            Loading wines...
          </div>
        ) : wines.length > 0 ? (
          wines.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              onClick={onWineClick}
            />
          ))
        ) : (
          <div style={{ ...typography.body1R, color: "#666666" }}>
            No wines found in your collection.
          </div>
        )}
      </div>
    </div>
  );
};
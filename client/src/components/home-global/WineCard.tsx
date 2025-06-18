import React from "react";
import WineRating from "@/components/WineRating";
import typography from "@/styles/typography";
import WineBottleImageDisplay from "@/components/wine-details-page/WineBottleImageDisplay";

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

interface WineCardProps {
  wine: Wine;
  onClick: (wineId: number) => void;
}

export const WineCard: React.FC<WineCardProps> = ({ wine, onClick }) => {
  return (
    <div
      className="rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5"
      style={{
        border: "1px solid #494949",
      }}
      onClick={() => onClick(wine.id)}
    >
      <div className="flex items-start gap-4">
        {/* Wine Bottle Image */}
        <div className="flex items-center justify-center">
          <WineBottleImageDisplay 
            image={wine.image}
            wineName={wine.name}
            height="170px"
            zIndex={1}
          />
        </div>

        {/* Wine Info */}
        <div className="flex-1">
          <h4
            className="font-medium mb-1"
            style={{
              ...typography.h2,
            }}
          >
            {wine.year} {wine.name}
          </h4>
          <p
            className="text-white/60 text-sm mb-3"
            style={{
              ...typography.body1R,
              color: "#999999",
            }}
          >
            {wine.bottles} bottle{wine.bottles !== 1 ? "s" : ""}
          </p>

          {/* Wine Ratings */}
          <WineRating
            ratings={wine.ratings}
            align="left"
            style={{
              position: "relative",
              zIndex: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};
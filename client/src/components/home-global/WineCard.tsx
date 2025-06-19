import React from "react";
import WineRating from "@/components/wine-details/WineRating";
import typography from "@/styles/typography";
import WineBottleImageDisplay from "@/components/wine-details/WineBottleImageDisplay";
import WineCardComponent from "@/components/ui/data-display/WineCardComponent";

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
    <WineCardComponent
      wine={wine}
      onClick={onClick}
    />
  );
};
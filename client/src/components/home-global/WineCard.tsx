import React from "react";
import WineCardComponent from "@/components/ui/data-display/WineCardComponent";
import { Wine } from "@/types/wine";



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
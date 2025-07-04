import React from 'react';
import WineBottleImageDisplay from '@/components/wine-details/WineBottleImageDisplay';
import WineRating from '@/components/wine-details/WineRating';
import typography from '@/styles/typography';

interface Wine {
  id: number;
  name: string;
  year?: number;
  image: string;
  bottles: number;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
}

interface WineCardComponentProps {
  wine: Wine;
  onClick: (wineId: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const WineCardComponent: React.FC<WineCardComponentProps> = ({ 
  wine, 
  onClick, 
  className = "",
  style = {}
}) => {
  return (
    <div
      className={`rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/5 ${className}`}
      style={{
        width: "208px",
        border: "1px solid #494949",
        ...style,
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
            align="center"
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

export default WineCardComponent;
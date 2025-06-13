import React from 'react';
import WineBottleImage from './WineBottleImage';
import USFlagImage from './USFlagImage';
import WineRating from './WineRating';
import typography from '@/styles/typography';

interface WineInfoProps {
  wine: {
    id: number;
    name: string;
    year?: number;
    image: string;
    location?: string;
    ratings: {
      vn: number;
      jd: number;
      ws: number;
      abv: number;
    };
  };
}

export const WineInfo: React.FC<WineInfoProps> = ({ wine }) => {
  if (!wine) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 relative">
      {/* Wine bottle image */}
      <WineBottleImage 
        image={wine.image} 
        wineName={wine.name} 
      />

      {/* Wine name with typography styling */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          color: "white",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "0 20px",
          marginBottom: "0",
          ...typography.h1,
        }}
      >
        {wine.year ? `${wine.year} ${wine.name}` : wine.name}
      </div>

      {/* Wine region with typography styling and flag */}
      <div
        style={{
          textAlign: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.60)",
          wordWrap: "break-word",
          position: "relative",
          zIndex: 2,
          padding: "20px 20px",
          gap: "6px",
          marginBottom: "0",
          ...typography.body,
        }}
      >
        <USFlagImage />
        <span>{wine.location || "Santa Cruz Mountains | California | United States"}</span>
      </div>

      {/* Wine ratings section */}
      <WineRating
        ratings={wine.ratings}
        style={{
          position: "relative",
          zIndex: 2,
          marginBottom: "20px",
        }}
      />
    </div>
  );
};

export default WineInfo;
import React from 'react';
import WineBottleImage from './WineBottleImage';

import WineRating from './WineRating';
import typography from '@/styles/typography';
import { Wine } from '@/types/wine';

export const WineInfo: React.FC<Wine> = ( wine ) => {
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
 

      {/* Wine ratings section */}
      <WineRating
        ratings={wine.ratings}
        align="center"
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
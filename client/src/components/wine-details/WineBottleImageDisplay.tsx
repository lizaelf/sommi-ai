import React from 'react';
import WineImage from './WineImage';

interface WineBottleImageDisplayProps {
  image?: string;
  wineName?: string;
  height?: string;
  zIndex?: number;
}

const WineBottleImageDisplay: React.FC<WineBottleImageDisplayProps> = ({ 
  image, 
  wineName, 
  height = "280px",
  zIndex = 2
}) => {
  return (
    <div
      style={{
        position: "relative",
        height,
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <WineImage
        src={image}
        wineName={wineName}
        style={{
          height: "100%",
          width: "auto",
        }}
      />
    </div>
  );
};

export default WineBottleImageDisplay;
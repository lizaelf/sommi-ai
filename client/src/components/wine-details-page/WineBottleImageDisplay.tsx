import React from 'react';
import ridgeWineImage from '@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png';
import placeholderImage from '@assets/Placeholder.png';

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
    <img
      src={image || ridgeWineImage}
      alt={wineName || "Wine bottle"}
      style={{
        height,
        zIndex,
      }}
      onLoad={() => console.log(`Wine bottle image loaded: ${wineName}`)}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        console.error(`Wine bottle image failed to load: ${wineName}, attempted URL: ${target.src}`);
        
        // Try fallback images in order
        if (target.src !== ridgeWineImage) {
          console.log(`Falling back to Ridge wine image: ${ridgeWineImage}`);
          target.src = ridgeWineImage;
        } else if (target.src !== placeholderImage) {
          console.log(`Falling back to placeholder image: ${placeholderImage}`);
          target.src = placeholderImage;
        } else {
          console.error('All fallback images failed to load');
        }
      }}
    />
  );
};

export default WineBottleImageDisplay;
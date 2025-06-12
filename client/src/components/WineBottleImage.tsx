import React from "react";
import placeholderImage from "@assets/Placeholder.png";
import ridgeWineImage from "@assets/wine-1-ridge-lytton-springs-dry-creek-zinfandel-1749209989253.png";

import _2021_Monte_Bello_Cabernet_Sauvignon from "@assets/wine-2-monte-bello-cabernet-sauvignon-1749210160812.png";

interface WineBottleImageProps {
  image?: string;
  wineName?: string;
}

const WineBottleImage: React.FC<WineBottleImageProps> = ({
  image,
  wineName,
}) => {
  return (
    <div
      className="wine-bottle-image"
      style={{
        position: "relative",
        marginBottom: "40px",
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >

      <img
        src={image || ridgeWineImage}
        alt={wineName || "Wine bottle"}
        style={{
          height: "280px",
          zIndex: 2,
          // Add a subtle drop shadow instead of blur
          filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))",
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
    </div>
  );
};

export default WineBottleImage;